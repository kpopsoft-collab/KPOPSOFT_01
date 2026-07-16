import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";

import * as schema from "../../db/schema.ts";
import { verifyTossPayment, type VerifiedTossPayment } from "./provider-verification.ts";
import { tossServerConfig } from "./runtime.ts";
import { createTossClient, type TossClient } from "./toss-client.ts";
import { neonTossWebhookRepository } from "./webhooks.ts";

export type ReconciliationCandidate = {
  id: string;
  kind: "attempt" | "webhook" | "refund";
  paymentKey: string;
  orderId: string;
  amount: number;
  attemptId?: string;
  invoiceId?: string;
  operationAmount?: number;
};

export type ReconciliationRepository = {
  claim(limit: number): Promise<ReconciliationCandidate[]>;
  apply(
    candidate: ReconciliationCandidate,
    payment: VerifiedTossPayment,
  ): Promise<boolean>;
  markRetry(candidate: ReconciliationCandidate, code: string): Promise<void>;
};

export function createReconciliationCommands(
  repository: ReconciliationRepository,
  options: { client: TossClient; mid: string },
) {
  return {
    async run(): Promise<{ claimed: number; applied: number; retry: number }> {
      const candidates = await repository.claim(100);
      let applied = 0;
      let retry = 0;
      for (const candidate of candidates) {
        try {
          const actual = await options.client.getPayment(candidate.paymentKey);
          const payment = verifyTossPayment(
            {
              mid: options.mid,
              paymentKey: candidate.paymentKey,
              orderId: candidate.orderId,
              amount: candidate.amount,
              status: "DONE",
            },
            actual,
          );
          if (await repository.apply(candidate, payment)) {
            applied += 1;
          } else {
            retry += 1;
            await repository.markRetry(candidate, "APPLY_CONFLICT");
          }
        } catch {
          retry += 1;
          await repository.markRetry(candidate, "PROVIDER_LOOKUP_PENDING");
        }
      }
      return { claimed: candidates.length, applied, retry };
    },
  };
}

type CandidateRow = {
  id: string;
  kind: ReconciliationCandidate["kind"];
  payment_key: string;
  order_id: string;
  amount: number;
  attempt_id?: string;
  invoice_id?: string;
  operation_amount?: number;
};

async function database() {
  const { getDb } = await import("../../db");
  return getDb();
}

async function applyAttempt(
  candidate: ReconciliationCandidate,
  payment: VerifiedTossPayment,
): Promise<boolean> {
  const maskedMethod = JSON.stringify(payment.maskedMethod);
  const result = await (await database()).execute(sql`
    with locked as (
      select attempt.id, attempt.invoice_id, attempt.status
      from ${schema.billingPaymentAttempts} attempt
      where attempt.id = ${candidate.id}::uuid
        and attempt.status = 'CONFIRMING'
        and attempt.payment_key = ${candidate.paymentKey}
      for update
    ),
    inserted_payment as (
      insert into ${schema.billingPayments}
        (id, invoice_id, attempt_id, method, amount, approved_at,
         toss_payment_key, toss_mid, approval_number, masked_method,
         refunded_amount)
      select ${randomUUID()}::uuid, locked.invoice_id, locked.id,
             ${payment.method}, ${candidate.amount},
             ${new Date(payment.approvedAt as string)}, ${candidate.paymentKey},
             ${payment.mId}, ${payment.approvalNumber}, ${maskedMethod}::jsonb, 0
      from locked
      on conflict do nothing
      returning id, invoice_id, attempt_id
    ),
    updated_attempt as (
      update ${schema.billingPaymentAttempts} attempt
      set status = 'DONE', confirmed_at = now(), updated_at = now()
      from inserted_payment payment
      where attempt.id = payment.attempt_id
      returning attempt.id
    ),
    updated_invoice as (
      update ${schema.billingInvoices} invoice
      set status = 'PAID', updated_at = now()
      from inserted_payment payment
      where invoice.id = payment.invoice_id
      returning invoice.id
    ),
    event as (
      insert into ${schema.billingPaymentEvents}
        (id, payment_id, attempt_id, source, event_type, from_status,
         to_status, correlation_id, metadata)
      select ${randomUUID()}::uuid, payment.id, payment.attempt_id,
             'RECONCILIATION', 'payment.completed', 'CONFIRMING', 'DONE',
             ${randomUUID()}, '{}'::jsonb
      from inserted_payment payment
      where exists (select 1 from updated_attempt)
        and exists (select 1 from updated_invoice)
      returning payment_id
    )
    select payment_id from event
  `);
  return Boolean(result.rows[0]);
}

async function applyRefund(
  candidate: ReconciliationCandidate,
  payment: VerifiedTossPayment,
): Promise<boolean> {
  const operationAmount = candidate.operationAmount ?? 0;
  const providerCanceled = payment.totalAmount - payment.balanceAmount;
  const transactionKey =
    payment.lastTransactionKey ?? payment.cancels?.at(-1)?.transactionKey ?? null;
  if (!transactionKey || operationAmount <= 0) return false;
  const result = await (await database()).execute(sql`
    with locked as (
      select refund.id, refund.payment_id, refund.amount,
             refund.requested_by, payment.refunded_amount,
             payment.invoice_id, payment.amount as payment_amount
      from ${schema.billingRefunds} refund
      inner join ${schema.billingPayments} payment
        on payment.id = refund.payment_id
      where refund.id = ${candidate.id}::uuid
        and refund.status = 'PROCESSING'
      for update of refund, payment
    ),
    completed_refund as (
      update ${schema.billingRefunds} refund
      set status = 'DONE', processed_by = locked.requested_by,
          toss_transaction_key = ${transactionKey}, completed_at = now(),
          updated_at = now()
      from locked
      where refund.id = locked.id
        and locked.amount = ${operationAmount}
        and locked.refunded_amount + locked.amount = ${providerCanceled}
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
      select ${randomUUID()}::uuid, payment.id, refund.id,
             'RECONCILIATION', 'refund.completed', 'PROCESSING', 'DONE',
             ${randomUUID()}, jsonb_build_object('amount', refund.amount)
      from completed_refund refund
      inner join updated_payment payment on payment.id = refund.payment_id
      where exists (select 1 from updated_invoice)
      returning refund_id
    )
    select refund_id from event
  `);
  return Boolean(result.rows[0]);
}

const neonReconciliationRepository: ReconciliationRepository = {
  async claim(limit) {
    const capped = Math.min(Math.max(limit, 1), 100);
    const result = await (await database()).execute(sql`
      with attempt_candidates as (
        select attempt.id::text as id, 'attempt'::text as kind,
               attempt.payment_key, attempt.order_id, attempt.amount,
               attempt.id::text as attempt_id,
               attempt.invoice_id::text as invoice_id,
               null::integer as operation_amount
        from ${schema.billingPaymentAttempts} attempt
        where attempt.status = 'CONFIRMING'
          and attempt.payment_key is not null
          and attempt.updated_at <= now() - interval '2 minutes'
        order by attempt.updated_at
        limit 100 for update skip locked
      ),
      webhook_candidates as (
        select receipt.id::text as id, 'webhook'::text as kind,
               receipt.payment_key, receipt.order_id, attempt.amount,
               attempt.id::text as attempt_id,
               attempt.invoice_id::text as invoice_id,
               null::integer as operation_amount
        from ${schema.billingWebhookReceipts} receipt
        inner join ${schema.billingPaymentAttempts} attempt
          on attempt.id = receipt.attempt_id
        where receipt.status = 'RETRY'
        order by receipt.updated_at
        limit 100 for update of receipt skip locked
      ),
      refund_candidates as (
        select refund.id::text as id, 'refund'::text as kind,
               payment.toss_payment_key as payment_key, attempt.order_id,
               payment.amount, attempt.id::text as attempt_id,
               payment.invoice_id::text as invoice_id,
               refund.amount as operation_amount
        from ${schema.billingRefunds} refund
        inner join ${schema.billingPayments} payment
          on payment.id = refund.payment_id
        inner join ${schema.billingPaymentAttempts} attempt
          on attempt.id = payment.attempt_id
        where refund.status = 'PROCESSING'
          and refund.updated_at <= now() - interval '2 minutes'
          and payment.toss_payment_key is not null
        order by refund.updated_at
        limit 100 for update of refund skip locked
      )
      select * from (
        select * from attempt_candidates
        union all select * from webhook_candidates
        union all select * from refund_candidates
      ) candidates
      limit ${capped}
    `);
    return (result.rows as CandidateRow[]).map((row) => ({
      id: row.id,
      kind: row.kind,
      paymentKey: row.payment_key,
      orderId: row.order_id,
      amount: row.amount,
      attemptId: row.attempt_id,
      invoiceId: row.invoice_id,
      operationAmount: row.operation_amount,
    }));
  },

  async apply(candidate, payment) {
    if (candidate.kind === "attempt") return applyAttempt(candidate, payment);
    if (candidate.kind === "refund") return applyRefund(candidate, payment);
    if (!candidate.attemptId || !candidate.invoiceId) return false;
    return (
      (await neonTossWebhookRepository.apply({
        kind: "ready",
        receiptId: candidate.id,
        attemptId: candidate.attemptId,
        invoiceId: candidate.invoiceId,
        paymentKey: candidate.paymentKey,
        orderId: candidate.orderId,
        amount: candidate.amount,
        payment,
        paymentId: randomUUID(),
        eventId: randomUUID(),
        correlationId: randomUUID(),
      })) === "done"
    );
  },

  async markRetry(candidate, code) {
    if (candidate.kind === "webhook") {
      await neonTossWebhookRepository.markRetry({ receiptId: candidate.id, code });
      return;
    }
    if (candidate.kind === "refund") {
      await (await database())
        .update(schema.billingRefunds)
        .set({ providerCode: code, updatedAt: new Date() })
        .where(sql`${schema.billingRefunds.id} = ${candidate.id}::uuid`);
    }
  },
};

export async function reconcileBillingPayments(): Promise<{
  claimed: number;
  applied: number;
  retry: number;
}> {
  const config = tossServerConfig();
  if (!config) throw new Error("Toss Payments is not configured.");
  return createReconciliationCommands(neonReconciliationRepository, {
    client: createTossClient(config),
    mid: config.mid,
  }).run();
}
