import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import type { DeliveryAttempt } from "../admin/types.ts";
import {
  auditLogs,
  billingCustomerContacts,
  billingCustomers,
  billingInvoiceDeliveries,
  billingInvoiceItems,
  billingInvoices,
  billingSites,
} from "../db/schema.ts";
import type { TransactionalEmailInput } from "../integrations/cloudflare-email.ts";
import {
  buildInvoiceEmail,
  type InvoiceEmailInput,
  type InvoiceEmailItem,
} from "./invoice-email.ts";
import { calculateInvoiceTotals } from "./money.ts";
import type { InvoiceTotals } from "./types.ts";

export { buildInvoiceEmail } from "./invoice-email.ts";

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  }, "날짜 형식이 올바르지 않습니다.");

const draftItemSchema = z.object({
  productCode: z.string().trim().min(2).max(64).toUpperCase(),
  productName: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500),
  quantity: z.number().int().positive(),
  unitSupplyAmount: z.number().int().nonnegative().safe(),
  vatAmount: z.number().int().nonnegative().safe(),
});

export const draftInvoiceInputSchema = z
  .object({
    periodStart: calendarDateSchema,
    periodEnd: calendarDateSchema,
    issueDate: calendarDateSchema,
    dueDate: calendarDateSchema,
    items: z.array(draftItemSchema).min(1).max(100),
  })
  .superRefine((input, context) => {
    if (input.periodEnd < input.periodStart) {
      context.addIssue({
        code: "custom",
        path: ["periodEnd"],
        message: "청구 종료일은 시작일보다 빠를 수 없습니다.",
      });
    }
    if (input.dueDate < input.issueDate) {
      context.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "납부기한은 발행일보다 빠를 수 없습니다.",
      });
    }
  });

export type DraftInvoiceInput = z.input<typeof draftInvoiceInputSchema>;
export type PreparedDraftInvoiceItem = z.output<typeof draftItemSchema> &
  InvoiceTotals & { sortOrder: number };
export type PreparedDraftInvoiceInput = Omit<
  z.output<typeof draftInvoiceInputSchema>,
  "items"
> & {
  items: PreparedDraftInvoiceItem[];
  totals: InvoiceTotals;
};

export type InvoiceDeliveryMessage = {
  deliveryId: string;
  recipient: string;
  invoice: InvoiceEmailInput;
};

export type InvoiceWriteResult = "updated" | "not_found" | "not_draft";
export type InvoiceVoidResult = "voided" | "not_found" | "invalid_status";
export type InvoiceApprovalResult =
  | { kind: "approved"; deliveries: InvoiceDeliveryMessage[] }
  | { kind: "not_found" }
  | { kind: "invalid_status" };

export type BillingInvoiceRepository = {
  updateDraft(
    actorId: string,
    invoiceId: string,
    input: PreparedDraftInvoiceInput,
  ): Promise<InvoiceWriteResult>;
  approveInvoice(
    actorId: string,
    invoiceId: string,
  ): Promise<InvoiceApprovalResult>;
  voidInvoice(
    actorId: string,
    invoiceId: string,
    reason: string,
  ): Promise<InvoiceVoidResult>;
  getDeliveryForRetry(
    actorId: string,
    deliveryId: string,
  ): Promise<InvoiceDeliveryMessage | null>;
  recordDeliveryAttempt(
    deliveryId: string,
    attempt: DeliveryAttempt,
  ): Promise<void>;
};

export type BillingEmailSender = (
  input: TransactionalEmailInput,
) => Promise<DeliveryAttempt>;

function prepareDraftInvoice(input: DraftInvoiceInput): PreparedDraftInvoiceInput {
  const parsed = draftInvoiceInputSchema.parse(input);
  const items = parsed.items.map((item, sortOrder) => ({
    ...item,
    ...calculateInvoiceTotals([item]),
    sortOrder,
  }));
  return { ...parsed, items, totals: calculateInvoiceTotals(items) };
}

function safeAttempt(attempt: DeliveryAttempt): DeliveryAttempt {
  if (attempt.ok) {
    return {
      ok: true,
      externalId: attempt.externalId.slice(0, 500),
    };
  }
  const allowed = new Set([
    "configuration_error",
    "unauthorized",
    "throttled",
    "permanent_bounce",
    "queued",
    "provider_error",
  ]);
  return {
    ok: false,
    errorCode: allowed.has(attempt.errorCode)
      ? attempt.errorCode
      : "provider_error",
  };
}

export function createInvoiceService(
  repository: BillingInvoiceRepository,
  sendEmail: BillingEmailSender,
) {
  async function deliver(message: InvoiceDeliveryMessage): Promise<void> {
    const email = buildInvoiceEmail(message.invoice);
    let attempt: DeliveryAttempt;
    try {
      attempt = safeAttempt(
        await sendEmail({
          to: message.recipient,
          ...email,
        }),
      );
    } catch {
      attempt = { ok: false, errorCode: "provider_error" };
    }
    await repository.recordDeliveryAttempt(message.deliveryId, attempt);
  }

  return {
    async updateDraftInvoice(
      actorId: string,
      invoiceId: string,
      input: DraftInvoiceInput,
    ): Promise<void> {
      const result = await repository.updateDraft(
        z.string().uuid().parse(actorId),
        z.string().uuid().parse(invoiceId),
        prepareDraftInvoice(input),
      );
      if (result === "not_found") {
        throw new Error("청구서를 찾을 수 없습니다.");
      }
      if (result === "not_draft") {
        throw new Error("청구서는 초안 상태에서만 수정할 수 있습니다.");
      }
    },

    async approveInvoice(actorId: string, invoiceId: string): Promise<void> {
      const result = await repository.approveInvoice(
        z.string().uuid().parse(actorId),
        z.string().uuid().parse(invoiceId),
      );
      if (result.kind === "not_found") {
        throw new Error("청구서를 찾을 수 없습니다.");
      }
      if (result.kind === "invalid_status") {
        throw new Error("초안 상태의 청구서만 승인할 수 있습니다.");
      }

      await Promise.allSettled(result.deliveries.map(deliver));
    },

    async voidInvoice(
      actorId: string,
      invoiceId: string,
      rawReason: string,
    ): Promise<void> {
      const reason = rawReason.trim();
      if (reason.length < 5 || reason.length > 500) {
        throw new Error("무효 처리 사유는 5자 이상 500자 이하로 입력해 주세요.");
      }
      const result = await repository.voidInvoice(
        z.string().uuid().parse(actorId),
        z.string().uuid().parse(invoiceId),
        reason,
      );
      if (result === "not_found") {
        throw new Error("청구서를 찾을 수 없습니다.");
      }
      if (result === "invalid_status") {
        throw new Error("무효 처리할 수 없는 상태의 청구서입니다.");
      }
    },

    async retryInvoiceDelivery(
      actorId: string,
      deliveryId: string,
    ): Promise<void> {
      const message = await repository.getDeliveryForRetry(
        z.string().uuid().parse(actorId),
        z.string().uuid().parse(deliveryId),
      );
      if (!message) throw new Error("재시도할 이메일 전송을 찾을 수 없습니다.");
      await deliver(message);
    },
  };
}

async function database() {
  const { getDb } = await import("../db");
  return getDb();
}

type MutationResultRow = { prior_status: string; id: string | null };

function draftItemsJson(input: PreparedDraftInvoiceInput): string {
  return JSON.stringify(
    input.items.map((item) => ({
      product_code: item.productCode,
      product_name: item.productName,
      description: item.description,
      quantity: item.quantity,
      unit_supply_amount: item.unitSupplyAmount,
      supply_amount: item.supplyAmount,
      vat_amount: item.vatAmount,
      total_amount: item.totalAmount,
      sort_order: item.sortOrder,
    })),
  );
}

async function loadInvoiceEmail(
  invoiceId: string,
  deliveryId?: string,
): Promise<InvoiceDeliveryMessage[]> {
  const db = await database();
  const [invoice] = await db
    .select({
      customerName: billingCustomers.name,
      siteName: billingSites.name,
      siteOrigin: billingSites.primaryOrigin,
      invoiceNumber: billingInvoices.number,
      periodStart: billingInvoices.periodStart,
      periodEnd: billingInvoices.periodEnd,
      issueDate: billingInvoices.issueDate,
      dueDate: billingInvoices.dueDate,
      supplyAmount: billingInvoices.supplyAmount,
      vatAmount: billingInvoices.vatAmount,
      totalAmount: billingInvoices.totalAmount,
    })
    .from(billingInvoices)
    .innerJoin(
      billingCustomers,
      eq(billingCustomers.id, billingInvoices.customerId),
    )
    .innerJoin(billingSites, eq(billingSites.id, billingInvoices.siteId))
    .where(eq(billingInvoices.id, invoiceId))
    .limit(1);
  if (!invoice) return [];

  const [items, deliveries] = await Promise.all([
    db
      .select({
        productName: billingInvoiceItems.productName,
        description: billingInvoiceItems.description,
        quantity: billingInvoiceItems.quantity,
        unitSupplyAmount: billingInvoiceItems.unitSupplyAmount,
        supplyAmount: billingInvoiceItems.supplyAmount,
        vatAmount: billingInvoiceItems.vatAmount,
        totalAmount: billingInvoiceItems.totalAmount,
        sortOrder: billingInvoiceItems.sortOrder,
      })
      .from(billingInvoiceItems)
      .where(eq(billingInvoiceItems.invoiceId, invoiceId))
      .orderBy(asc(billingInvoiceItems.sortOrder)),
    db
      .select({
        deliveryId: billingInvoiceDeliveries.id,
        recipient: billingInvoiceDeliveries.recipient,
      })
      .from(billingInvoiceDeliveries)
      .where(
        and(
          eq(billingInvoiceDeliveries.invoiceId, invoiceId),
          inArray(billingInvoiceDeliveries.status, ["PENDING", "FAILED"]),
          deliveryId
            ? eq(billingInvoiceDeliveries.id, deliveryId)
            : eq(billingInvoiceDeliveries.status, "PENDING"),
        ),
      ),
  ]);
  return deliveries.map((delivery) => ({
    ...delivery,
    invoice: { ...invoice, items: items as InvoiceEmailItem[] },
  }));
}

const neonBillingInvoiceRepository: BillingInvoiceRepository = {
  async updateDraft(actorId, invoiceId, input) {
    const itemsJson = draftItemsJson(input);
    const result = await (await database()).execute(sql`
      with locked_invoice as (
        select id, status
        from ${billingInvoices}
        where id = ${invoiceId}::uuid
        for update
      ),
      input_items as (
        select *
        from jsonb_to_recordset(${itemsJson}::jsonb) as item(
          product_code text, product_name text, description text,
          quantity integer, unit_supply_amount integer, supply_amount integer,
          vat_amount integer, total_amount integer, sort_order integer
        )
      ),
      totals as (
        select count(*) as item_count,
               coalesce(sum(item.supply_amount), 0)::integer as supply_amount,
               coalesce(sum(item.vat_amount), 0)::integer as vat_amount,
               coalesce(sum(item.total_amount), 0)::integer as total_amount
        from input_items item
      ),
      updated as (
        update ${billingInvoices} as invoice
        set period_start = ${input.periodStart}::date,
            period_end = ${input.periodEnd}::date,
            issue_date = ${input.issueDate}::date,
            due_date = ${input.dueDate}::date,
            supply_amount = totals.supply_amount,
            vat_amount = totals.vat_amount,
            total_amount = totals.total_amount,
            updated_at = now()
        from locked_invoice, totals
        where invoice.id = locked_invoice.id
          and locked_invoice.status = 'DRAFT'
          and totals.item_count > 0
        returning invoice.id
      ),
      removed as (
        delete from ${billingInvoiceItems}
        where invoice_id in (select id from updated)
      ),
      inserted_items as (
        insert into ${billingInvoiceItems}
          (invoice_id, product_code, product_name, description, quantity,
           unit_supply_amount, supply_amount, vat_amount, total_amount,
           sort_order)
        select updated.id, item.product_code, item.product_name,
               item.description, item.quantity, item.unit_supply_amount,
               item.supply_amount, item.vat_amount, item.total_amount,
               item.sort_order
        from updated cross join input_items item
      ),
      audited as (
        insert into ${auditLogs}
          (actor_admin_id, action, entity_type, entity_id, metadata)
        select ${actorId}::uuid, 'billing.invoice.updated',
               'billing_invoice', id, '{}'::jsonb
        from updated
      )
      select locked_invoice.status as prior_status, updated.id
      from locked_invoice left join updated on true
    `);
    const row = result.rows[0] as MutationResultRow | undefined;
    if (!row) return "not_found";
    return row.id ? "updated" : "not_draft";
  },

  async approveInvoice(actorId, invoiceId) {
    const result = await (await database()).execute(sql`
      with locked_invoice as (
        select id, customer_id, status
        from ${billingInvoices}
        where id = ${invoiceId}::uuid
        for update
      ),
      totals as (
        select count(*) as item_count,
               coalesce(sum(supply_amount), 0)::integer as supply_amount,
               coalesce(sum(vat_amount), 0)::integer as vat_amount,
               coalesce(sum(total_amount), 0)::integer as total_amount
        from ${billingInvoiceItems}
        where invoice_id = ${invoiceId}::uuid
      ),
      updated as (
        update ${billingInvoices} as invoice
        set status = 'OPEN',
            supply_amount = totals.supply_amount,
            vat_amount = totals.vat_amount,
            total_amount = totals.total_amount,
            approved_by = ${actorId}::uuid,
            approved_at = now(),
            updated_at = now()
        from locked_invoice, totals
        where invoice.id = locked_invoice.id
          and locked_invoice.status = 'DRAFT'
          and totals.item_count > 0
        returning invoice.id, invoice.customer_id
      ),
      audited as (
        insert into ${auditLogs}
          (actor_admin_id, action, entity_type, entity_id, metadata)
        select ${actorId}::uuid, 'billing.invoice.approved',
               'billing_invoice', id, '{}'::jsonb
        from updated
      ),
      queued as (
        insert into ${billingInvoiceDeliveries}
          (id, invoice_id, recipient, channel, status, attempt_count)
        select gen_random_uuid(), updated.id,
               lower(btrim(contacts.email)), 'EMAIL', 'PENDING', 0
        from updated
        cross join ${billingCustomerContacts} contacts
        where contacts.customer_id = updated.customer_id
          and contacts.receives_billing = true
          and char_length(btrim(contacts.email)) between 3 and 254
      )
      select locked_invoice.status as prior_status, updated.id
      from locked_invoice left join updated on true
    `);
    const row = result.rows[0] as MutationResultRow | undefined;
    if (!row) return { kind: "not_found" };
    if (!row.id) return { kind: "invalid_status" };
    return {
      kind: "approved",
      deliveries: await loadInvoiceEmail(invoiceId),
    };
  },

  async voidInvoice(actorId, invoiceId, reason) {
    const result = await (await database()).execute(sql`
      with locked_invoice as (
        select id, status
        from ${billingInvoices}
        where id = ${invoiceId}::uuid
        for update
      ),
      updated as (
        update ${billingInvoices} as invoice
        set status = 'VOID', voided_by = ${actorId}::uuid,
            voided_at = now(), void_reason = ${reason}, updated_at = now()
        from locked_invoice
        where invoice.id = locked_invoice.id
          and locked_invoice.status in ('DRAFT', 'OPEN', 'OVERDUE')
        returning invoice.id
      ),
      audited as (
        insert into ${auditLogs}
          (actor_admin_id, action, entity_type, entity_id, metadata)
        select ${actorId}::uuid, 'billing.invoice.voided',
               'billing_invoice', id,
               ${JSON.stringify({ reason })}::jsonb
        from updated
      )
      select locked_invoice.status as prior_status, updated.id
      from locked_invoice left join updated on true
    `);
    const row = result.rows[0] as MutationResultRow | undefined;
    if (!row) return "not_found";
    return row.id ? "voided" : "invalid_status";
  },

  async getDeliveryForRetry(_actorId, deliveryId) {
    const [delivery] = await (await database())
      .select({ invoiceId: billingInvoiceDeliveries.invoiceId })
      .from(billingInvoiceDeliveries)
      .innerJoin(
        billingInvoices,
        eq(billingInvoices.id, billingInvoiceDeliveries.invoiceId),
      )
      .where(
        and(
          eq(billingInvoiceDeliveries.id, deliveryId),
          inArray(billingInvoiceDeliveries.status, ["PENDING", "FAILED"]),
          inArray(billingInvoices.status, ["OPEN", "OVERDUE"]),
        ),
      )
      .limit(1);
    if (!delivery) return null;
    return (await loadInvoiceEmail(delivery.invoiceId, deliveryId))[0] ?? null;
  },

  async recordDeliveryAttempt(deliveryId, attempt) {
    const now = new Date();
    await (await database())
      .update(billingInvoiceDeliveries)
      .set(
        attempt.ok
          ? {
              status: "SENT",
              attemptCount: sql`${billingInvoiceDeliveries.attemptCount} + 1`,
              externalId: attempt.externalId,
              errorCode: null,
              sentAt: now,
              nextRetryAt: null,
              updatedAt: now,
            }
          : {
              status: "FAILED",
              attemptCount: sql`${billingInvoiceDeliveries.attemptCount} + 1`,
              externalId: null,
              errorCode: attempt.errorCode,
              nextRetryAt: sql`now() + interval '15 minutes'`,
              updatedAt: now,
            },
      )
      .where(
        and(
          eq(billingInvoiceDeliveries.id, deliveryId),
          inArray(billingInvoiceDeliveries.status, ["PENDING", "FAILED"]),
        ),
      );
  },
};

const defaultInvoiceService = createInvoiceService(
  neonBillingInvoiceRepository,
  async (input) => {
    const { sendTransactionalEmail } = await import(
      "../integrations/cloudflare-email"
    );
    return sendTransactionalEmail(input);
  },
);

export async function updateDraftInvoice(
  actorId: string,
  invoiceId: string,
  input: DraftInvoiceInput,
): Promise<void> {
  return defaultInvoiceService.updateDraftInvoice(actorId, invoiceId, input);
}

export async function approveInvoice(
  actorId: string,
  invoiceId: string,
): Promise<void> {
  return defaultInvoiceService.approveInvoice(actorId, invoiceId);
}

export async function voidInvoice(
  actorId: string,
  invoiceId: string,
  reason: string,
): Promise<void> {
  return defaultInvoiceService.voidInvoice(actorId, invoiceId, reason);
}

export async function retryInvoiceDelivery(
  actorId: string,
  deliveryId: string,
): Promise<void> {
  return defaultInvoiceService.retryInvoiceDelivery(actorId, deliveryId);
}
