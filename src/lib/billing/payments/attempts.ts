import { createHash, randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";
import { z } from "zod";

import * as schema from "../../db/schema.ts";
import type { PaymentSessionClaims } from "../widget/payment-session.ts";
import { requirePaySessionRuntime } from "../widget/runtime.ts";
import { tossPublicConfig } from "./runtime.ts";

const invoiceNumberSchema = z
  .string()
  .regex(/^KPB-[0-9]{6}-[0-9A-HJKMNP-TV-Z]{10}$/);

export type PrepareTossAttemptInput = {
  invoiceNumber: string;
  siteId: string;
  customerId: string;
  sessionHash: Uint8Array;
  orderId: string;
  idempotencyKey: string;
  expiresAt: Date;
};

export type PreparedTossAttempt = {
  kind: "ready";
  orderId: string;
  amount: number;
  expiresAt: Date;
  orderName: string;
  customerName: string;
};

export type PrepareTossAttemptResult =
  | PreparedTossAttempt
  | { kind: "not_found" }
  | { kind: "not_payable" }
  | { kind: "already_paid" }
  | { kind: "conflict" };

export type TossAttemptRepository = {
  prepare(input: PrepareTossAttemptInput): Promise<PrepareTossAttemptResult>;
  recordFailure(input: {
    orderId: string;
    siteId: string;
    customerId: string;
    sessionHash: Uint8Array;
    failureCode: string;
    eventId: string;
    correlationId: string;
  }): Promise<boolean>;
};

export type TossAttemptResponse = {
  orderId: string;
  amount: number;
  clientKey: string;
  expiresAt: string;
  orderName: string;
  customerName: string;
  customerKey: string;
  successUrl: string;
  failUrl: string;
};

type TossAttemptOptions = {
  now: () => Date;
  randomUUID: () => string;
  clientKey: string | null;
  payOrigin: string;
};

function hashSession(sessionId: string): Uint8Array {
  return new Uint8Array(createHash("sha256").update(sessionId, "utf8").digest());
}

function customerKey(sessionId: string): string {
  return `anon_${createHash("sha256")
    .update(`toss-customer:${sessionId}`, "utf8")
    .digest("base64url")
    .slice(0, 32)}`;
}

export function createTossAttemptCommands(
  repository: TossAttemptRepository,
  options: TossAttemptOptions,
) {
  return {
    async createTossAttempt(input: {
      invoiceNumber: string;
      session: PaymentSessionClaims;
    }): Promise<TossAttemptResponse> {
      if (!options.clientKey) throw new Error("Toss Payments is not available.");
      const invoiceNumber = invoiceNumberSchema.parse(input.invoiceNumber);
      const uuid = z.string().uuid().parse(options.randomUUID());
      const now = options.now();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
      const result = await repository.prepare({
        invoiceNumber,
        siteId: z.string().uuid().parse(input.session.siteId),
        customerId: z.string().uuid().parse(input.session.customerId),
        sessionHash: hashSession(input.session.sessionId),
        orderId: `KPO_${uuid.replaceAll("-", "")}`,
        idempotencyKey: uuid,
        expiresAt,
      });
      if (result.kind === "not_found") throw new Error("Invoice not found.");
      if (result.kind === "not_payable") throw new Error("Invoice is not payable.");
      if (result.kind === "already_paid") throw new Error("Invoice is already paid.");
      if (result.kind === "conflict") throw new Error("Payment attempt conflict.");

      const encodedNumber = encodeURIComponent(invoiceNumber);
      return {
        orderId: result.orderId,
        amount: result.amount,
        clientKey: options.clientKey,
        expiresAt: result.expiresAt.toISOString(),
        orderName: result.orderName,
        customerName: result.customerName,
        customerKey: customerKey(input.session.sessionId),
        successUrl: `${options.payOrigin}/pay/invoices/${encodedNumber}/success`,
        failUrl: `${options.payOrigin}/pay/invoices/${encodedNumber}/fail`,
      };
    },

    async recordTossAttemptFailure(input: {
      orderId: string;
      failureCode: string;
      session: PaymentSessionClaims;
    }): Promise<boolean> {
      const orderId = z.string().regex(/^[A-Za-z0-9_-]{6,64}$/).parse(input.orderId);
      const failureCode = z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9_-]{1,100}$/)
        .parse(input.failureCode);
      return repository.recordFailure({
        orderId,
        failureCode,
        siteId: z.string().uuid().parse(input.session.siteId),
        customerId: z.string().uuid().parse(input.session.customerId),
        sessionHash: hashSession(input.session.sessionId),
        eventId: options.randomUUID(),
        correlationId: options.randomUUID(),
      });
    },
  };
}

type AttemptRow = {
  kind: PrepareTossAttemptResult["kind"];
  order_id?: string;
  amount?: number;
  expires_at?: Date | string;
  order_name?: string;
  customer_name?: string;
};

async function database() {
  const { getDb } = await import("../../db");
  return getDb();
}

const neonTossAttemptRepository: TossAttemptRepository = {
  async prepare(input) {
    const result = await (await database()).execute(sql`
      with locked_invoice as (
        select invoice.id, invoice.number, invoice.status, invoice.total_amount,
               customer.name as customer_name
        from ${schema.billingInvoices} invoice
        inner join ${schema.billingCustomers} customer
          on customer.id = invoice.customer_id
        inner join ${schema.billingSites} site on site.id = invoice.site_id
        where invoice.number = ${input.invoiceNumber}
          and invoice.site_id = ${input.siteId}::uuid
          and invoice.customer_id = ${input.customerId}::uuid
          and customer.status = 'ACTIVE'
          and site.status = 'ACTIVE'
          and exists (
            select 1 from ${schema.billingPaymentSessions} session
            where session.session_hash = ${input.sessionHash}
              and session.site_id = invoice.site_id
              and session.customer_id = invoice.customer_id
              and session.revoked_at is null
              and session.expires_at > now()
              and session.absolute_expires_at > now()
          )
        for update
      ),
      existing_payment as (
        select payment.id
        from ${schema.billingPayments} payment
        inner join locked_invoice invoice on invoice.id = payment.invoice_id
        limit 1
      ),
      expired_attempts as (
        update ${schema.billingPaymentAttempts} attempt
        set status = 'EXPIRED', updated_at = now()
        from locked_invoice invoice
        where attempt.invoice_id = invoice.id
          and attempt.status in ('CREATED', 'AUTHENTICATED')
          and attempt.expires_at <= now()
        returning attempt.id
      ),
      active_attempt as (
        select attempt.order_id, attempt.amount, attempt.expires_at
        from ${schema.billingPaymentAttempts} attempt
        inner join locked_invoice invoice on invoice.id = attempt.invoice_id
        where attempt.status in ('CREATED', 'AUTHENTICATED', 'CONFIRMING')
          and attempt.expires_at > now()
        order by attempt.created_at desc
        limit 1
      ),
      inserted_attempt as (
        insert into ${schema.billingPaymentAttempts}
          (invoice_id, order_id, amount, status, idempotency_key, expires_at)
        select invoice.id, ${input.orderId}, invoice.total_amount, 'CREATED',
               ${input.idempotencyKey}::uuid, ${input.expiresAt}
        from locked_invoice invoice
        where invoice.status in ('OPEN', 'OVERDUE')
          and invoice.total_amount > 0
          and not exists (select 1 from existing_payment)
          and not exists (select 1 from active_attempt)
        on conflict do nothing
        returning order_id, amount, expires_at
      ),
      candidate as (
        select order_id, amount, expires_at, 1 as priority from inserted_attempt
        union all
        select order_id, amount, expires_at, 2 as priority from active_attempt
        order by priority
        limit 1
      )
      select case
        when not exists (select 1 from locked_invoice) then 'not_found'
        when exists (select 1 from existing_payment) then 'already_paid'
        when (select status from locked_invoice) not in ('OPEN', 'OVERDUE')
          or (select total_amount from locked_invoice) <= 0 then 'not_payable'
        when not exists (select 1 from candidate) then 'conflict'
        else 'ready'
      end as kind,
      candidate.order_id, candidate.amount, candidate.expires_at,
      concat('KPOPSOFT ', (select number from locked_invoice)) as order_name,
      (select customer_name from locked_invoice) as customer_name
      from (select 1) sentinel left join candidate on true
    `);
    const row = result.rows[0] as AttemptRow | undefined;
    if (!row || row.kind !== "ready") {
      return { kind: row?.kind ?? "conflict" } as PrepareTossAttemptResult;
    }
    if (
      !row.order_id ||
      !Number.isSafeInteger(row.amount) ||
      !row.expires_at ||
      !row.order_name ||
      !row.customer_name
    ) {
      return { kind: "conflict" };
    }
    return {
      kind: "ready",
      orderId: row.order_id,
      amount: row.amount as number,
      expiresAt: new Date(row.expires_at),
      orderName: row.order_name,
      customerName: row.customer_name,
    };
  },

  async recordFailure(input) {
    const result = await (await database()).execute(sql`
      with updated as (
        update ${schema.billingPaymentAttempts} attempt
        set status = 'CANCELED', failure_code = ${input.failureCode},
            updated_at = now()
        from ${schema.billingInvoices} invoice
        where attempt.order_id = ${input.orderId}
          and attempt.invoice_id = invoice.id
          and attempt.status in ('CREATED', 'AUTHENTICATED')
          and invoice.site_id = ${input.siteId}::uuid
          and invoice.customer_id = ${input.customerId}::uuid
          and exists (
            select 1 from ${schema.billingPaymentSessions} session
            where session.session_hash = ${input.sessionHash}
              and session.site_id = invoice.site_id
              and session.customer_id = invoice.customer_id
              and session.revoked_at is null
              and session.expires_at > now()
              and session.absolute_expires_at > now()
          )
        returning attempt.id
      ),
      event as (
        insert into ${schema.billingPaymentEvents}
          (id, attempt_id, source, event_type, from_status, to_status,
           correlation_id, metadata)
        select ${input.eventId}::uuid, id, 'CUSTOMER',
               'payment.checkout_failed', 'CREATED', 'CANCELED',
               ${input.correlationId},
               jsonb_build_object('failureCode', ${input.failureCode})
        from updated returning id
      )
      select id from event
    `);
    return Boolean(result.rows[0]);
  },
};

function defaultCommands() {
  const publicConfig = tossPublicConfig();
  const runtime = requirePaySessionRuntime();
  return createTossAttemptCommands(neonTossAttemptRepository, {
    now: () => new Date(),
    randomUUID,
    clientKey: publicConfig?.clientKey ?? null,
    payOrigin: `https://${runtime.host}`,
  });
}

export async function createTossAttempt(input: {
  invoiceNumber: string;
  session: PaymentSessionClaims;
}): Promise<TossAttemptResponse> {
  return defaultCommands().createTossAttempt(input);
}

export async function recordTossAttemptFailure(input: {
  orderId: string;
  failureCode: string;
  session: PaymentSessionClaims;
}): Promise<boolean> {
  return defaultCommands().recordTossAttemptFailure(input);
}
