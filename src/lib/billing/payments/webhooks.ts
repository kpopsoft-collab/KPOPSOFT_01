import { createHash, randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";
import { z } from "zod";

import * as schema from "../../db/schema.ts";
import {
  verifyTossPayment,
  type VerifiedTossPayment,
} from "./provider-verification.ts";
import { tossServerConfig } from "./runtime.ts";
import {
  createTossClient,
  TossClientError,
  type TossClient,
} from "./toss-client.ts";

export type WebhookReceiptResult =
  | {
      kind: "ready";
      receiptId: string;
      attemptId: string;
      invoiceId: string;
      paymentKey: string;
      orderId: string;
      amount: number;
    }
  | { kind: "duplicate_done" }
  | { kind: "rejected" }
  | { kind: "busy" };

export type TossWebhookRepository = {
  receive(input: {
    receiptId: string;
    transmissionId: string;
    eventType: "PAYMENT_STATUS_CHANGED";
    paymentKey: string;
    orderId: string;
    paymentKeyHash: Uint8Array;
    payloadHash: Uint8Array;
  }): Promise<WebhookReceiptResult>;
  apply(input: Extract<WebhookReceiptResult, { kind: "ready" }> & {
    paymentId: string;
    eventId: string;
    correlationId: string;
    payment: VerifiedTossPayment;
  }): Promise<"done" | "retry" | "rejected">;
  markRetry(input: { receiptId: string; code: string }): Promise<void>;
  markRejected(input: { receiptId: string; code: string }): Promise<void>;
};

const webhookSchema = z.object({
  eventType: z.literal("PAYMENT_STATUS_CHANGED"),
  data: z.object({
    paymentKey: z.string().min(1).max(200),
    orderId: z.string().regex(/^[A-Za-z0-9_-]{6,64}$/),
  }),
});

function sha256(value: string): Uint8Array {
  return new Uint8Array(createHash("sha256").update(value, "utf8").digest());
}

export function createTossWebhookCommands(
  repository: TossWebhookRepository,
  options: { client: TossClient; mid: string },
) {
  return {
    async handle(input: {
      transmissionId: string;
      rawPayload: string;
    }): Promise<"DONE" | "RETRY" | "REJECTED"> {
      const transmissionId = z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9_-]{1,200}$/)
        .parse(input.transmissionId);
      const payload = webhookSchema.parse(JSON.parse(input.rawPayload));
      const receipt = await repository.receive({
        receiptId: randomUUID(),
        transmissionId,
        eventType: payload.eventType,
        paymentKey: payload.data.paymentKey,
        orderId: payload.data.orderId,
        paymentKeyHash: sha256(payload.data.paymentKey),
        payloadHash: sha256(input.rawPayload),
      });
      if (receipt.kind === "duplicate_done") return "DONE";
      if (receipt.kind === "rejected") return "REJECTED";
      if (receipt.kind === "busy") return "RETRY";

      let actual;
      try {
        actual = await options.client.getPayment(receipt.paymentKey);
      } catch (error) {
        const retryable = !(error instanceof TossClientError) || error.retryable;
        if (retryable) {
          await repository.markRetry({
            receiptId: receipt.receiptId,
            code: error instanceof TossClientError ? error.code : "LOOKUP_FAILED",
          });
          return "RETRY";
        }
        await repository.markRejected({
          receiptId: receipt.receiptId,
          code: error.code,
        });
        return "REJECTED";
      }

      let payment: VerifiedTossPayment;
      try {
        payment = verifyTossPayment(
          {
            mid: options.mid,
            paymentKey: receipt.paymentKey,
            orderId: receipt.orderId,
            amount: receipt.amount,
            status: "DONE",
          },
          actual,
        );
      } catch {
        await repository.markRejected({
          receiptId: receipt.receiptId,
          code: "PROVIDER_MISMATCH",
        });
        return "REJECTED";
      }

      const result = await repository.apply({
        ...receipt,
        payment,
        paymentId: randomUUID(),
        eventId: randomUUID(),
        correlationId: transmissionId,
      });
      return result === "done" ? "DONE" : result === "retry" ? "RETRY" : "REJECTED";
    },
  };
}

type ReceiptRow = {
  kind: WebhookReceiptResult["kind"];
  receipt_id?: string;
  attempt_id?: string;
  invoice_id?: string;
  amount?: number;
};

async function database() {
  const { getDb } = await import("../../db");
  return getDb();
}

export const neonTossWebhookRepository: TossWebhookRepository = {
  async receive(input) {
    const result = await (await database()).execute(sql`
      with matched_attempt as (
        select attempt.id, attempt.invoice_id, attempt.amount
        from ${schema.billingPaymentAttempts} attempt
        where attempt.order_id = ${input.orderId}
        limit 1
      ),
      inserted_receipt as (
        insert into ${schema.billingWebhookReceipts}
          (id, transmission_id, attempt_id, event_type, payment_key,
           payment_key_hash, order_id, payload_hash, status, attempt_count)
        values (
          ${input.receiptId}::uuid, ${input.transmissionId},
          (select id from matched_attempt), ${input.eventType},
          ${input.paymentKey}, ${input.paymentKeyHash}, ${input.orderId},
          ${input.payloadHash},
          case when exists (select 1 from matched_attempt)
            then 'PROCESSING' else 'REJECTED' end,
          case when exists (select 1 from matched_attempt) then 1 else 0 end
        )
        on conflict do nothing
        returning id, attempt_id, status
      ),
      claimed_existing as (
        update ${schema.billingWebhookReceipts} receipt
        set status = 'PROCESSING', attempt_count = receipt.attempt_count + 1,
            last_error_code = null, updated_at = now()
        where receipt.transmission_id = ${input.transmissionId}
          and not exists (select 1 from inserted_receipt)
          and receipt.status in ('RECEIVED', 'RETRY')
        returning receipt.id, receipt.attempt_id, receipt.status
      ),
      selected as (
        select id, attempt_id, status from inserted_receipt
        union all
        select id, attempt_id, status from claimed_existing
        union all
        select receipt.id, receipt.attempt_id, receipt.status
        from ${schema.billingWebhookReceipts} receipt
        where receipt.transmission_id = ${input.transmissionId}
          and not exists (select 1 from inserted_receipt)
          and not exists (select 1 from claimed_existing)
        limit 1
      )
      select case
        when selected.status = 'DONE' then 'duplicate_done'
        when selected.status = 'REJECTED' or selected.attempt_id is null
          then 'rejected'
        when selected.status <> 'PROCESSING' then 'busy'
        else 'ready'
      end as kind,
      selected.id as receipt_id, attempt.id as attempt_id,
      attempt.invoice_id, attempt.amount
      from selected
      left join ${schema.billingPaymentAttempts} attempt
        on attempt.id = selected.attempt_id
    `);
    const row = result.rows[0] as ReceiptRow | undefined;
    if (!row) return { kind: "busy" };
    if (row.kind !== "ready") return { kind: row.kind } as WebhookReceiptResult;
    if (
      !row.receipt_id ||
      !row.attempt_id ||
      !row.invoice_id ||
      !Number.isSafeInteger(row.amount)
    ) {
      return { kind: "rejected" };
    }
    return {
      kind: "ready",
      receiptId: row.receipt_id,
      attemptId: row.attempt_id,
      invoiceId: row.invoice_id,
      paymentKey: input.paymentKey,
      orderId: input.orderId,
      amount: row.amount as number,
    };
  },

  async apply(input) {
    const maskedMethod = JSON.stringify(input.payment.maskedMethod);
    const result = await (await database()).execute(sql`
      with locked as (
        select receipt.id as receipt_id, receipt.status as receipt_status,
               attempt.id as attempt_id, attempt.status as attempt_status,
               attempt.invoice_id, invoice.status as invoice_status
        from ${schema.billingWebhookReceipts} receipt
        inner join ${schema.billingPaymentAttempts} attempt
          on attempt.id = receipt.attempt_id
        inner join ${schema.billingInvoices} invoice
          on invoice.id = attempt.invoice_id
        where receipt.id = ${input.receiptId}::uuid
          and attempt.id = ${input.attemptId}::uuid
        for update of receipt, attempt, invoice
      ),
      existing_payment as (
        select payment.id, payment.invoice_id, payment.attempt_id
        from ${schema.billingPayments} payment
        inner join locked on locked.invoice_id = payment.invoice_id
        limit 1
      ),
      inserted_payment as (
        insert into ${schema.billingPayments}
          (id, invoice_id, attempt_id, method, amount, approved_at,
           toss_payment_key, toss_mid, approval_number, masked_method,
           refunded_amount)
        select ${input.paymentId}::uuid, locked.invoice_id, locked.attempt_id,
               ${input.payment.method}, ${input.amount},
               ${new Date(input.payment.approvedAt as string)},
               ${input.paymentKey}, ${input.payment.mId},
               ${input.payment.approvalNumber}, ${maskedMethod}::jsonb, 0
        from locked
        where locked.receipt_status = 'PROCESSING'
          and locked.attempt_status in ('CREATED', 'AUTHENTICATED', 'CONFIRMING')
          and locked.invoice_status in ('OPEN', 'OVERDUE')
          and not exists (select 1 from existing_payment)
        on conflict do nothing
        returning id, invoice_id, attempt_id
      ),
      settled_payment as (
        select id, invoice_id, attempt_id from inserted_payment
        union all
        select id, invoice_id, attempt_id from existing_payment
        limit 1
      ),
      updated_attempt as (
        update ${schema.billingPaymentAttempts} attempt
        set status = 'DONE', payment_key = ${input.paymentKey},
            confirmed_at = coalesce(attempt.confirmed_at, now()),
            updated_at = now()
        from settled_payment payment
        where attempt.id = ${input.attemptId}::uuid
        returning attempt.id
      ),
      updated_invoice as (
        update ${schema.billingInvoices} invoice
        set status = 'PAID', updated_at = now()
        from settled_payment payment
        where invoice.id = payment.invoice_id
        returning invoice.id
      ),
      inserted_event as (
        insert into ${schema.billingPaymentEvents}
          (id, payment_id, attempt_id, source, event_type, from_status,
           to_status, correlation_id, metadata)
        select ${input.eventId}::uuid, payment.id, payment.attempt_id,
               'TOSS_WEBHOOK', 'payment.completed', locked.attempt_status,
               'DONE', ${input.correlationId}, '{}'::jsonb
        from inserted_payment payment
        cross join locked
        returning payment_id
      ),
      completed_receipt as (
        update ${schema.billingWebhookReceipts} receipt
        set status = 'DONE', processed_at = now(), last_error_code = null,
            updated_at = now()
        where receipt.id = ${input.receiptId}::uuid
          and exists (select 1 from settled_payment)
          and exists (select 1 from updated_attempt)
          and exists (select 1 from updated_invoice)
        returning receipt.id
      )
      select id from completed_receipt
    `);
    return result.rows[0] ? "done" : "retry";
  },

  async markRetry(input) {
    await (await database())
      .update(schema.billingWebhookReceipts)
      .set({
        status: "RETRY",
        lastErrorCode: input.code.slice(0, 100),
        updatedAt: new Date(),
      })
      .where(sql`${schema.billingWebhookReceipts.id} = ${input.receiptId}::uuid`);
  },

  async markRejected(input) {
    await (await database())
      .update(schema.billingWebhookReceipts)
      .set({
        status: "REJECTED",
        lastErrorCode: input.code.slice(0, 100),
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(sql`${schema.billingWebhookReceipts.id} = ${input.receiptId}::uuid`);
  },
};

function defaultCommands() {
  const config = tossServerConfig();
  if (!config) throw new Error("Toss Payments is not configured.");
  return createTossWebhookCommands(neonTossWebhookRepository, {
    client: createTossClient(config),
    mid: config.mid,
  });
}

export async function handleTossWebhook(input: {
  transmissionId: string;
  rawPayload: string;
}): Promise<"DONE" | "RETRY" | "REJECTED"> {
  return defaultCommands().handle(input);
}
