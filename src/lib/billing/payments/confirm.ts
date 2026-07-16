import { createHash, randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";
import { z } from "zod";

import * as schema from "../../db/schema.ts";
import type { PaymentSessionClaims } from "../widget/payment-session.ts";
import { verifyTossPayment, type VerifiedTossPayment } from "./provider-verification.ts";
import { tossServerConfig } from "./runtime.ts";
import {
  createTossClient,
  TossClientError,
  type TossClient,
} from "./toss-client.ts";

export type AuthenticatedAttempt = {
  kind: "ready";
  attemptId: string;
  invoiceId: string;
  paymentKey: string;
  orderId: string;
  amount: number;
  idempotencyKey: string;
};

export type AuthenticateAttemptResult =
  | AuthenticatedAttempt
  | { kind: "done"; paymentId: string }
  | { kind: "not_found" }
  | { kind: "scope_mismatch" }
  | { kind: "amount_mismatch" }
  | { kind: "payment_key_mismatch" }
  | { kind: "expired" }
  | { kind: "invalid_status" }
  | { kind: "already_paid" }
  | { kind: "conflict" };

type CompletePaymentInput = AuthenticatedAttempt & {
  paymentId: string;
  eventId: string;
  correlationId: string;
  payment: VerifiedTossPayment;
};

export type TossConfirmationRepository = {
  authenticate(input: {
    siteId: string;
    customerId: string;
    sessionHash: Uint8Array;
    paymentKey: string;
    orderId: string;
    amount: number;
    eventId: string;
    correlationId: string;
  }): Promise<AuthenticateAttemptResult>;
  complete(
    input: CompletePaymentInput,
  ): Promise<{ kind: "done"; paymentId: string } | { kind: "conflict" }>;
  fail(input: {
    attemptId: string;
    failureCode: string;
    eventId: string;
    correlationId: string;
  }): Promise<void>;
};

export type ConfirmPaymentResult =
  | { status: "DONE"; paymentId: string }
  | { status: "PENDING" }
  | { status: "FAILED" };

type ConfirmationOptions = {
  client: TossClient;
  mid: string;
};

const confirmInputSchema = z.object({
  paymentKey: z.string().min(1).max(200),
  orderId: z.string().regex(/^[A-Za-z0-9_-]{6,64}$/),
  amount: z.number().int().positive().safe(),
});

function hashSession(sessionId: string): Uint8Array {
  return new Uint8Array(createHash("sha256").update(sessionId, "utf8").digest());
}

function throwAttemptError(kind: Exclude<AuthenticateAttemptResult["kind"], "ready" | "done">): never {
  const messages: Record<typeof kind, string> = {
    not_found: "Payment attempt not found.",
    scope_mismatch: "Payment session scope mismatch.",
    amount_mismatch: "Payment amount mismatch.",
    payment_key_mismatch: "Payment key mismatch.",
    expired: "Payment attempt expired.",
    invalid_status: "Payment attempt status is invalid.",
    already_paid: "Invoice is already paid.",
    conflict: "Payment confirmation conflict.",
  };
  throw new Error(messages[kind]);
}

export function createTossConfirmationCommands(
  repository: TossConfirmationRepository,
  options: ConfirmationOptions,
) {
  return {
    async confirmTossPayment(input: {
      session: PaymentSessionClaims;
      paymentKey: string;
      orderId: string;
      amount: number;
    }): Promise<ConfirmPaymentResult> {
      const parsed = confirmInputSchema.parse(input);
      const authenticated = await repository.authenticate({
        siteId: z.string().uuid().parse(input.session.siteId),
        customerId: z.string().uuid().parse(input.session.customerId),
        sessionHash: hashSession(input.session.sessionId),
        ...parsed,
        eventId: randomUUID(),
        correlationId: randomUUID(),
      });
      if (authenticated.kind === "done") {
        return { status: "DONE", paymentId: authenticated.paymentId };
      }
      if (authenticated.kind !== "ready") {
        return throwAttemptError(authenticated.kind);
      }

      let actual;
      try {
        actual = await options.client.confirm({
          paymentKey: authenticated.paymentKey,
          orderId: authenticated.orderId,
          amount: authenticated.amount,
          idempotencyKey: authenticated.idempotencyKey,
        });
      } catch (error) {
        if (error instanceof TossClientError && !error.retryable) {
          await repository.fail({
            attemptId: authenticated.attemptId,
            failureCode: error.code,
            eventId: randomUUID(),
            correlationId: randomUUID(),
          });
          return { status: "FAILED" };
        }
        return { status: "PENDING" };
      }

      let payment: VerifiedTossPayment;
      try {
        payment = verifyTossPayment(
          {
            mid: options.mid,
            paymentKey: authenticated.paymentKey,
            orderId: authenticated.orderId,
            amount: authenticated.amount,
            status: "DONE",
          },
          actual,
        );
      } catch {
        return { status: "PENDING" };
      }

      const completed = await repository.complete({
        ...authenticated,
        payment,
        paymentId: randomUUID(),
        eventId: randomUUID(),
        correlationId: randomUUID(),
      });
      return completed.kind === "done"
        ? { status: "DONE", paymentId: completed.paymentId }
        : { status: "PENDING" };
    },
  };
}

type AuthenticationRow = {
  kind: AuthenticateAttemptResult["kind"];
  attempt_id?: string;
  invoice_id?: string;
  payment_id?: string;
  payment_key?: string;
  order_id?: string;
  amount?: number;
  idempotency_key?: string;
};

async function database() {
  const { getDb } = await import("../../db");
  return getDb();
}

const neonTossConfirmationRepository: TossConfirmationRepository = {
  async authenticate(input) {
    const result = await (await database()).execute(sql`
      with locked_attempt as (
        select attempt.id as attempt_id, attempt.invoice_id,
               attempt.order_id, attempt.amount, attempt.status,
               attempt.idempotency_key, attempt.expires_at,
               attempt.payment_key, invoice.status as invoice_status
        from ${schema.billingPaymentAttempts} attempt
        inner join ${schema.billingInvoices} invoice
          on invoice.id = attempt.invoice_id
        where attempt.order_id = ${input.orderId}
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
        for update of attempt, invoice
      ),
      existing_payment as (
        select payment.id, payment.attempt_id
        from ${schema.billingPayments} payment
        inner join locked_attempt attempt on attempt.invoice_id = payment.invoice_id
        limit 1
      ),
      transitioned as (
        update ${schema.billingPaymentAttempts} attempt
        set status = 'CONFIRMING', payment_key = ${input.paymentKey},
            failure_code = null, updated_at = now()
        from locked_attempt locked
        where attempt.id = locked.attempt_id
          and locked.status in ('CREATED', 'AUTHENTICATED')
          and locked.expires_at > now()
          and locked.invoice_status in ('OPEN', 'OVERDUE')
          and locked.amount = ${input.amount}
          and (locked.payment_key is null or locked.payment_key = ${input.paymentKey})
          and not exists (select 1 from existing_payment)
        returning attempt.id as attempt_id, attempt.invoice_id,
                  attempt.order_id, attempt.amount, attempt.idempotency_key,
                  attempt.payment_key, locked.status as prior_status
      ),
      transition_events as (
        insert into ${schema.billingPaymentEvents}
          (id, attempt_id, source, event_type, from_status, to_status,
           correlation_id, metadata)
        select gen_random_uuid(), transitioned.attempt_id, 'TOSS_REDIRECT',
               event.event_type, event.from_status, event.to_status,
               ${input.correlationId}, '{}'::jsonb
        from transitioned
        cross join lateral (
          values
            ('payment.authenticated', 'CREATED', 'AUTHENTICATED', 1),
            ('payment.confirming', 'AUTHENTICATED', 'CONFIRMING', 2)
        ) event(event_type, from_status, to_status, sequence)
        where transitioned.prior_status = 'CREATED' or event.sequence = 2
        returning attempt_id
      ),
      retry_candidate as (
        select attempt_id, invoice_id, order_id, amount, idempotency_key,
               payment_key
        from locked_attempt
        where status = 'CONFIRMING'
          and payment_key = ${input.paymentKey}
          and amount = ${input.amount}
      ),
      candidate as (
        select attempt_id, invoice_id, order_id, amount, idempotency_key,
               payment_key from transitioned
        union all
        select attempt_id, invoice_id, order_id, amount, idempotency_key,
               payment_key from retry_candidate
        limit 1
      )
      select case
        when not exists (select 1 from locked_attempt) then 'not_found'
        when (select status from locked_attempt) = 'DONE'
          and exists (select 1 from existing_payment) then 'done'
        when exists (select 1 from existing_payment) then 'already_paid'
        when (select amount from locked_attempt) <> ${input.amount}
          then 'amount_mismatch'
        when (select payment_key from locked_attempt) is not null
          and (select payment_key from locked_attempt) <> ${input.paymentKey}
          then 'payment_key_mismatch'
        when (select expires_at from locked_attempt) <= now() then 'expired'
        when (select status from locked_attempt) not in
          ('CREATED', 'AUTHENTICATED', 'CONFIRMING') then 'invalid_status'
        when (select invoice_status from locked_attempt) not in ('OPEN', 'OVERDUE')
          then 'invalid_status'
        when not exists (select 1 from candidate) then 'conflict'
        else 'ready'
      end as kind,
      candidate.attempt_id, candidate.invoice_id, candidate.payment_key,
      candidate.order_id, candidate.amount, candidate.idempotency_key,
      (select id from existing_payment) as payment_id
      from (select 1) sentinel left join candidate on true
    `);
    const row = result.rows[0] as AuthenticationRow | undefined;
    if (!row) return { kind: "conflict" };
    if (row.kind === "done" && row.payment_id) {
      return { kind: "done", paymentId: row.payment_id };
    }
    if (row.kind !== "ready") return { kind: row.kind } as AuthenticateAttemptResult;
    if (
      !row.attempt_id ||
      !row.invoice_id ||
      !row.payment_key ||
      !row.order_id ||
      !Number.isSafeInteger(row.amount) ||
      !row.idempotency_key
    ) {
      return { kind: "conflict" };
    }
    return {
      kind: "ready",
      attemptId: row.attempt_id,
      invoiceId: row.invoice_id,
      paymentKey: row.payment_key,
      orderId: row.order_id,
      amount: row.amount as number,
      idempotencyKey: row.idempotency_key,
    };
  },

  async complete(input) {
    const maskedMethod = JSON.stringify(input.payment.maskedMethod);
    const result = await (await database()).execute(sql`
      with locked_attempt as (
        select attempt.id, attempt.invoice_id, attempt.status,
               attempt.payment_key, attempt.order_id, attempt.amount
        from ${schema.billingPaymentAttempts} attempt
        where attempt.id = ${input.attemptId}::uuid
        for update
      ),
      inserted_payment as (
        insert into ${schema.billingPayments}
          (id, invoice_id, attempt_id, method, amount, approved_at,
           toss_payment_key, toss_mid, approval_number, masked_method,
           refunded_amount)
        select ${input.paymentId}::uuid, attempt.invoice_id, attempt.id,
               ${input.payment.method}, attempt.amount,
               ${new Date(input.payment.approvedAt as string)},
               attempt.payment_key, ${input.payment.mId},
               ${input.payment.approvalNumber}, ${maskedMethod}::jsonb, 0
        from locked_attempt attempt
        where attempt.status = 'CONFIRMING'
          and attempt.payment_key = ${input.paymentKey}
          and attempt.order_id = ${input.orderId}
          and attempt.amount = ${input.amount}
        on conflict do nothing
        returning id, invoice_id, attempt_id
      ),
      updated_attempt as (
        update ${schema.billingPaymentAttempts} attempt
        set status = 'DONE', confirmed_at = now(), updated_at = now()
        from inserted_payment payment
        where attempt.id = ${input.attemptId}::uuid
          and payment.attempt_id = attempt.id
        returning attempt.id
      ),
      updated_invoice as (
        update ${schema.billingInvoices} invoice
        set status = 'PAID', updated_at = now()
        from inserted_payment payment, updated_attempt attempt
        where invoice.id = payment.invoice_id
        returning invoice.id
      ),
      inserted_event as (
        insert into ${schema.billingPaymentEvents}
          (id, payment_id, attempt_id, source, event_type, from_status,
           to_status, correlation_id, metadata)
        select ${input.eventId}::uuid, payment.id, ${input.attemptId}::uuid,
               'TOSS_REDIRECT', 'payment.completed', 'CONFIRMING', 'DONE',
               ${input.correlationId}, '{}'::jsonb
        from inserted_payment payment
        inner join updated_invoice invoice on invoice.id = payment.invoice_id
        returning payment_id
      )
      select payment_id from inserted_event
    `);
    const paymentId = (result.rows[0] as { payment_id?: string } | undefined)?.payment_id;
    return paymentId ? { kind: "done", paymentId } : { kind: "conflict" };
  },

  async fail(input) {
    await (await database()).execute(sql`
      with updated as (
        update ${schema.billingPaymentAttempts}
        set status = 'FAILED', failure_code = ${input.failureCode},
            updated_at = now()
        where id = ${input.attemptId}::uuid and status = 'CONFIRMING'
        returning id
      )
      insert into ${schema.billingPaymentEvents}
        (id, attempt_id, source, event_type, from_status, to_status,
         correlation_id, metadata)
      select ${input.eventId}::uuid, id, 'TOSS_REDIRECT',
             'payment.failed', 'CONFIRMING', 'FAILED', ${input.correlationId},
             jsonb_build_object('failureCode', ${input.failureCode})
      from updated
    `);
  },
};

function defaultCommands() {
  const config = tossServerConfig();
  if (!config) throw new Error("Toss Payments is not configured.");
  return createTossConfirmationCommands(neonTossConfirmationRepository, {
    client: createTossClient(config),
    mid: config.mid,
  });
}

export async function confirmTossPayment(input: {
  session: PaymentSessionClaims;
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<ConfirmPaymentResult> {
  return defaultCommands().confirmTossPayment(input);
}
