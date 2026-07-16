import { desc, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import * as schema from "../../db/schema.ts";
import type { RefundInspection, RefundRepository } from "./refunds.ts";

async function database() {
  const { getDb } = await import("../../db");
  return getDb();
}

type InspectionRow = {
  kind: RefundInspection["kind"];
  refund_id?: string;
  payment_id?: string;
  invoice_id?: string;
  payment_key?: string;
  order_id?: string;
  amount?: number;
  refunded_amount?: number;
};

export const neonRefundRepository: RefundRepository = {
  async inspect(input) {
    const result = await (await database()).execute(sql`
      with locked_payment as (
        select payment.id, payment.invoice_id, payment.method, payment.amount,
               payment.refunded_amount, payment.toss_payment_key,
               payment.attempt_id, attempt.order_id
        from ${schema.billingPayments} payment
        left join ${schema.billingPaymentAttempts} attempt
          on attempt.id = payment.attempt_id
        where payment.id = ${input.paymentId}::uuid
        for update of payment
      ),
      active_refund as (
        select refund.id
        from ${schema.billingRefunds} refund
        inner join locked_payment payment on payment.id = refund.payment_id
        where refund.status in ('REQUESTED', 'PROCESSING')
        order by refund.created_at
        limit 1
      )
      select case
        when not exists (select 1 from locked_payment) then 'not_found'
        when exists (select 1 from active_refund) then 'in_progress'
        when (select method from locked_payment) not in ('CARD', 'EASY_PAY')
          or (select toss_payment_key from locked_payment) is null
          or (select attempt_id from locked_payment) is null then 'non_toss'
        when (select refunded_amount + ${input.amount} from locked_payment)
          > (select amount from locked_payment) then 'amount_exceeds'
        else 'ready'
      end as kind,
      (select id from active_refund) as refund_id,
      payment.id as payment_id, payment.invoice_id,
      payment.toss_payment_key as payment_key, payment.order_id,
      payment.amount, payment.refunded_amount
      from (select 1) sentinel left join locked_payment payment on true
    `);
    const row = result.rows[0] as InspectionRow | undefined;
    if (!row) return { kind: "not_found" };
    if (row.kind === "in_progress" && row.refund_id) {
      return { kind: "in_progress", refundId: row.refund_id };
    }
    if (row.kind !== "ready") return { kind: row.kind } as RefundInspection;
    if (
      !row.payment_id ||
      !row.invoice_id ||
      !row.payment_key ||
      !row.order_id ||
      !Number.isSafeInteger(row.amount) ||
      !Number.isSafeInteger(row.refunded_amount)
    ) {
      return { kind: "not_found" };
    }
    return {
      kind: "ready",
      paymentId: row.payment_id,
      invoiceId: row.invoice_id,
      paymentKey: row.payment_key,
      orderId: row.order_id,
      amount: row.amount as number,
      refundedAmount: row.refunded_amount as number,
    };
  },

  async begin(input) {
    const inserted = await (await database()).execute(sql`
      with locked_payment as (
        select payment.id, payment.amount, payment.refunded_amount
        from ${schema.billingPayments} payment
        where payment.id = ${input.paymentId}::uuid
        for update
      ),
      active_refund as (
        select refund.id
        from ${schema.billingRefunds} refund
        inner join locked_payment payment on payment.id = refund.payment_id
        where refund.status in ('REQUESTED', 'PROCESSING')
        order by refund.created_at
        limit 1
      ),
      requested as (
        insert into ${schema.billingRefunds}
          (id, payment_id, amount, reason, status, idempotency_key,
           requested_by)
        select ${input.refundId}::uuid, payment.id, ${input.amount},
               ${input.reason}, 'REQUESTED', ${input.idempotencyKey}::uuid,
               ${input.actorId}::uuid
        from locked_payment payment
        where payment.refunded_amount + ${input.amount} <= payment.amount
          and not exists (select 1 from active_refund)
        on conflict do nothing
        returning id
      )
      select case
        when exists (select 1 from requested) then 'requested'
        when exists (select 1 from active_refund) then 'existing'
        else 'conflict'
      end as kind,
      coalesce((select id from requested), (select id from active_refund)) as id
    `);
    const row = inserted.rows[0] as
      | { kind?: "requested" | "existing" | "conflict"; id?: string }
      | undefined;
    if (row?.kind === "existing" && row.id) {
      return { kind: "existing", refundId: row.id };
    }
    if (row?.kind !== "requested" || row.id !== input.refundId) {
      return { kind: "conflict" };
    }

    const processing = await (await database()).execute(sql`
      with updated as (
        update ${schema.billingRefunds}
        set status = 'PROCESSING', updated_at = now()
        where id = ${input.refundId}::uuid
          and payment_id = ${input.paymentId}::uuid
          and status = 'REQUESTED'
          and idempotency_key = ${input.idempotencyKey}::uuid
        returning id
      ),
      events as (
        insert into ${schema.billingPaymentEvents}
          (id, refund_id, source, event_type, from_status, to_status,
           correlation_id, metadata)
        select gen_random_uuid(), id, 'ADMIN', event.event_type,
               event.from_status, event.to_status, ${input.correlationId},
               jsonb_build_object('amount', ${input.amount})
        from updated
        cross join (values
          ('refund.requested', null::text, 'REQUESTED'),
          ('refund.processing', 'REQUESTED', 'PROCESSING')
        ) event(event_type, from_status, to_status)
        returning refund_id
      )
      select id from updated
    `);
    return processing.rows[0] ? { kind: "ready" } : { kind: "conflict" };
  },

  async complete(input) {
    const result = await (await database()).execute(sql`
      with locked as (
        select refund.id, refund.payment_id, refund.amount,
               payment.invoice_id, payment.amount as payment_amount,
               payment.refunded_amount
        from ${schema.billingRefunds} refund
        inner join ${schema.billingPayments} payment
          on payment.id = refund.payment_id
        where refund.id = ${input.refundId}::uuid
          and payment.id = ${input.paymentId}::uuid
        for update of refund, payment
      ),
      completed_refund as (
        update ${schema.billingRefunds} refund
        set status = 'DONE', processed_by = ${input.actorId}::uuid,
            toss_transaction_key = ${input.transactionKey},
            completed_at = now(), updated_at = now()
        from locked
        where refund.id = locked.id
          and refund.status = 'PROCESSING'
          and locked.amount = ${input.amount}
          and locked.refunded_amount + locked.amount <= locked.payment_amount
        returning refund.id, refund.payment_id, refund.amount
      ),
      updated_payment as (
        update ${schema.billingPayments} payment
        set refunded_amount = payment.refunded_amount + refund.amount,
            updated_at = now()
        from completed_refund refund
        where payment.id = refund.payment_id
        returning payment.id, payment.invoice_id, payment.amount,
                  payment.refunded_amount
      ),
      updated_invoice as (
        update ${schema.billingInvoices} invoice
        set status = case when payment.refunded_amount = payment.amount
          then 'REFUNDED' else 'PARTIALLY_REFUNDED' end,
          updated_at = now()
        from updated_payment payment
        where invoice.id = payment.invoice_id
        returning invoice.id
      ),
      event as (
        insert into ${schema.billingPaymentEvents}
          (id, payment_id, refund_id, source, event_type, from_status,
           to_status, correlation_id, metadata)
        select ${input.eventId}::uuid, payment.id, refund.id, 'ADMIN',
               'refund.completed', 'PROCESSING', 'DONE',
               ${input.correlationId},
               jsonb_build_object('amount', refund.amount)
        from completed_refund refund
        inner join updated_payment payment on payment.id = refund.payment_id
        where exists (select 1 from updated_invoice)
        returning refund_id
      ),
      audited as (
        insert into ${schema.auditLogs}
          (actor_admin_id, action, entity_type, entity_id, metadata)
        select ${input.actorId}::uuid, 'billing.refund.completed',
               'billing_refund', refund_id,
               jsonb_build_object('amount', ${input.amount})
        from event returning entity_id
      )
      select entity_id from audited
    `);
    return Boolean(result.rows[0]);
  },

  async fail(input) {
    await (await database()).execute(sql`
      with updated as (
        update ${schema.billingRefunds}
        set status = 'FAILED', provider_code = ${input.failureCode},
            updated_at = now()
        where id = ${input.refundId}::uuid and status = 'PROCESSING'
        returning id
      )
      insert into ${schema.billingPaymentEvents}
        (id, refund_id, source, event_type, from_status, to_status,
         correlation_id, metadata)
      select ${input.eventId}::uuid, id, 'ADMIN', 'refund.failed',
             'PROCESSING', 'FAILED', ${input.correlationId},
             jsonb_build_object('providerCode', ${input.failureCode})
      from updated
    `);
  },
};

export async function getBillingPaymentForAdmin(id: string) {
  const result = await (await database()).execute(sql`
    select payment.id, payment.method, payment.amount, payment.refunded_amount,
           payment.approved_at, payment.masked_method,
           invoice.number as invoice_number, invoice.status as invoice_status,
           customer.name as customer_name, site.name as site_name
    from ${schema.billingPayments} payment
    inner join ${schema.billingInvoices} invoice on invoice.id = payment.invoice_id
    inner join ${schema.billingCustomers} customer on customer.id = invoice.customer_id
    inner join ${schema.billingSites} site on site.id = invoice.site_id
    where payment.id = ${id}::uuid
    limit 1
  `);
  const payment = result.rows[0] as
    | {
        id: string;
        method: "BANK_TRANSFER" | "CARD" | "EASY_PAY";
        amount: number;
        refunded_amount: number;
        approved_at: Date | string;
        masked_method: Record<string, string | number | null>;
        invoice_number: string;
        invoice_status: string;
        customer_name: string;
        site_name: string;
      }
    | undefined;
  if (!payment) return null;
  const [refunds, events] = await Promise.all([
    (await database())
      .select({
        id: schema.billingRefunds.id,
        amount: schema.billingRefunds.amount,
        reason: schema.billingRefunds.reason,
        status: schema.billingRefunds.status,
        createdAt: schema.billingRefunds.createdAt,
        completedAt: schema.billingRefunds.completedAt,
      })
      .from(schema.billingRefunds)
      .where(sql`${schema.billingRefunds.paymentId} = ${id}::uuid`)
      .orderBy(schema.billingRefunds.createdAt),
    (await database())
      .select({
        id: schema.billingPaymentEvents.id,
        eventType: schema.billingPaymentEvents.eventType,
        fromStatus: schema.billingPaymentEvents.fromStatus,
        toStatus: schema.billingPaymentEvents.toStatus,
        source: schema.billingPaymentEvents.source,
        occurredAt: schema.billingPaymentEvents.occurredAt,
      })
      .from(schema.billingPaymentEvents)
      .where(sql`${schema.billingPaymentEvents.paymentId} = ${id}::uuid`)
      .orderBy(schema.billingPaymentEvents.occurredAt),
  ]);
  return {
    id: payment.id,
    method: payment.method,
    amount: payment.amount,
    refundedAmount: payment.refunded_amount,
    approvedAt: new Date(payment.approved_at),
    maskedMethod: payment.masked_method,
    invoiceNumber: payment.invoice_number,
    invoiceStatus: payment.invoice_status,
    customerName: payment.customer_name,
    siteName: payment.site_name,
    refunds,
    events,
  };
}

export async function listBillingPaymentOperations() {
  const db = await database();
  const [payments, attempts, webhooks, refunds] = await Promise.all([
    db
      .select({
        id: schema.billingPayments.id,
        method: schema.billingPayments.method,
        amount: schema.billingPayments.amount,
        refundedAmount: schema.billingPayments.refundedAmount,
        approvedAt: schema.billingPayments.approvedAt,
        maskedMethod: schema.billingPayments.maskedMethod,
        invoiceNumber: schema.billingInvoices.number,
        customerName: schema.billingCustomers.name,
      })
      .from(schema.billingPayments)
      .innerJoin(
        schema.billingInvoices,
        sql`${schema.billingInvoices.id} = ${schema.billingPayments.invoiceId}`,
      )
      .innerJoin(
        schema.billingCustomers,
        sql`${schema.billingCustomers.id} = ${schema.billingInvoices.customerId}`,
      )
      .orderBy(desc(schema.billingPayments.approvedAt))
      .limit(100),
    db
      .select({
        id: schema.billingPaymentAttempts.id,
        orderId: schema.billingPaymentAttempts.orderId,
        amount: schema.billingPaymentAttempts.amount,
        status: schema.billingPaymentAttempts.status,
        updatedAt: schema.billingPaymentAttempts.updatedAt,
        invoiceNumber: schema.billingInvoices.number,
      })
      .from(schema.billingPaymentAttempts)
      .innerJoin(
        schema.billingInvoices,
        sql`${schema.billingInvoices.id} = ${schema.billingPaymentAttempts.invoiceId}`,
      )
      .where(sql`${schema.billingPaymentAttempts.status} = 'CONFIRMING'
        and ${schema.billingPaymentAttempts.updatedAt} <= now() - interval '2 minutes'`)
      .orderBy(schema.billingPaymentAttempts.updatedAt)
      .limit(100),
    db
      .select({
        id: schema.billingWebhookReceipts.id,
        transmissionId: schema.billingWebhookReceipts.transmissionId,
        eventType: schema.billingWebhookReceipts.eventType,
        status: schema.billingWebhookReceipts.status,
        attemptCount: schema.billingWebhookReceipts.attemptCount,
        lastErrorCode: schema.billingWebhookReceipts.lastErrorCode,
        updatedAt: schema.billingWebhookReceipts.updatedAt,
      })
      .from(schema.billingWebhookReceipts)
      .where(
        inArray(schema.billingWebhookReceipts.status, ["RETRY", "REJECTED"]),
      )
      .orderBy(schema.billingWebhookReceipts.updatedAt)
      .limit(100),
    db
      .select({
        id: schema.billingRefunds.id,
        paymentId: schema.billingRefunds.paymentId,
        amount: schema.billingRefunds.amount,
        reason: schema.billingRefunds.reason,
        status: schema.billingRefunds.status,
        providerCode: schema.billingRefunds.providerCode,
        updatedAt: schema.billingRefunds.updatedAt,
        invoiceNumber: schema.billingInvoices.number,
        customerName: schema.billingCustomers.name,
      })
      .from(schema.billingRefunds)
      .innerJoin(
        schema.billingPayments,
        sql`${schema.billingPayments.id} = ${schema.billingRefunds.paymentId}`,
      )
      .innerJoin(
        schema.billingInvoices,
        sql`${schema.billingInvoices.id} = ${schema.billingPayments.invoiceId}`,
      )
      .innerJoin(
        schema.billingCustomers,
        sql`${schema.billingCustomers.id} = ${schema.billingInvoices.customerId}`,
      )
      .where(inArray(schema.billingRefunds.status, ["PROCESSING", "FAILED"]))
      .orderBy(schema.billingRefunds.updatedAt)
      .limit(100),
  ]);
  return { payments, attempts, webhooks, refunds };
}

export async function requeryBillingPayment(
  actorId: string,
  paymentId: string,
): Promise<{
  providerStatus: string;
  balanceAmount: number;
  checkedAt: string;
}> {
  const parsedActorId = z.string().uuid().parse(actorId);
  const parsedPaymentId = z.string().uuid().parse(paymentId);
  const result = await (await database()).execute(sql`
    select payment.toss_payment_key, payment.amount, payment.refunded_amount,
           attempt.order_id
    from ${schema.billingPayments} payment
    inner join ${schema.billingPaymentAttempts} attempt
      on attempt.id = payment.attempt_id
    where payment.id = ${parsedPaymentId}::uuid
      and payment.method in ('CARD', 'EASY_PAY')
    limit 1
  `);
  const row = result.rows[0] as
    | {
        toss_payment_key: string;
        amount: number;
        refunded_amount: number;
        order_id: string;
      }
    | undefined;
  if (!row) throw new Error("Toss payment not found.");

  const [{ tossServerConfig }, { createTossClient }, { verifyTossPayment }] =
    await Promise.all([
      import("./runtime.ts"),
      import("./toss-client.ts"),
      import("./provider-verification.ts"),
    ]);
  const config = tossServerConfig();
  if (!config) throw new Error("Toss Payments is not configured.");
  const actual = await createTossClient(config).getPayment(row.toss_payment_key);
  const expectedStatus =
    row.refunded_amount === 0
      ? "DONE"
      : row.refunded_amount === row.amount
        ? "CANCELED"
        : "PARTIAL_CANCELED";
  const verified = verifyTossPayment(
    {
      mid: config.mid,
      paymentKey: row.toss_payment_key,
      orderId: row.order_id,
      amount: row.amount,
      status: expectedStatus,
    },
    actual,
  );
  await (await database()).insert(schema.auditLogs).values({
    actorAdminId: parsedActorId,
    action: "billing.payment.provider_requeried",
    entityType: "billing_payment",
    entityId: parsedPaymentId,
    metadata: { providerStatus: verified.status },
  });
  return {
    providerStatus: verified.status,
    balanceAmount: verified.balanceAmount,
    checkedAt: new Date().toISOString(),
  };
}
