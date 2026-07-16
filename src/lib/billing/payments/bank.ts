import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";
import { z } from "zod";

import * as schema from "../../db/schema.ts";
import type { InvoiceStatus } from "../types.ts";
import { bankTransferConfig, type PaymentEnv } from "./runtime.ts";

export type PayableInvoice = {
  id?: string;
  status: InvoiceStatus;
  totalAmount: number;
};

export type BankTransferInstructions = {
  bank: string;
  accountNumber: string;
  holder: string;
  amount: number;
};

export type ConfirmBankReceiptInput = {
  invoiceId: string;
  amount: number;
  depositorName: string;
  depositedOn: string;
  evidenceNote: string;
};

type PreparedBankReceipt = ConfirmBankReceiptInput & {
  actorId: string;
  paymentId: string;
  receiptId: string;
  eventId: string;
  correlationId: string;
};

export type BankConfirmationOutcome =
  | "confirmed"
  | "amount_mismatch"
  | "not_payable"
  | "already_paid"
  | "conflict"
  | "not_found";

export type BankTransferRepository = {
  confirm(input: PreparedBankReceipt): Promise<BankConfirmationOutcome>;
};

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
  }, "Invalid deposited date.");

const confirmBankReceiptSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().int().positive().safe(),
  depositorName: z.string().trim().min(1).max(100),
  depositedOn: calendarDateSchema,
  evidenceNote: z.string().trim().min(5).max(500),
});

export function getBankTransferInstructions(
  invoice: PayableInvoice,
  env: PaymentEnv = process.env,
): BankTransferInstructions | null {
  if (
    !["OPEN", "OVERDUE"].includes(invoice.status) ||
    !Number.isSafeInteger(invoice.totalAmount) ||
    invoice.totalAmount <= 0
  ) {
    return null;
  }
  const config = bankTransferConfig(env);
  return config ? { ...config, amount: invoice.totalAmount } : null;
}

export function createBankTransferCommands(repository: BankTransferRepository) {
  return {
    async confirmBankReceipt(
      rawActorId: string,
      rawInput: ConfirmBankReceiptInput,
    ): Promise<string> {
      const actorId = z.string().uuid().parse(rawActorId);
      const input = confirmBankReceiptSchema.parse(rawInput);
      const paymentId = randomUUID();
      const result = await repository.confirm({
        actorId,
        ...input,
        paymentId,
        receiptId: randomUUID(),
        eventId: randomUUID(),
        correlationId: randomUUID(),
      });

      if (result === "confirmed") return paymentId;
      if (result === "amount_mismatch") {
        throw new Error("Bank transfer amount must exactly match the invoice amount.");
      }
      if (result === "not_payable") {
        throw new Error("Invoice status is not payable.");
      }
      if (result === "already_paid") {
        throw new Error("Invoice already has a completed payment.");
      }
      if (result === "conflict") {
        throw new Error("Payment confirmation conflict. Please try again.");
      }
      throw new Error("Invoice not found.");
    },
  };
}

type ConfirmationResultRow = {
  outcome: BankConfirmationOutcome;
};

async function database() {
  const { getDb } = await import("../../db");
  return getDb();
}

const neonBankTransferRepository: BankTransferRepository = {
  async confirm(input) {
    const metadata = JSON.stringify({
      invoiceId: input.invoiceId,
      amount: input.amount,
      depositedOn: input.depositedOn,
    });
    const result = await (await database()).execute(sql`
      with locked_invoice as (
        select id, status, total_amount
        from ${schema.billingInvoices}
        where id = ${input.invoiceId}::uuid
        for update
      ),
      existing_payment as (
        select payment.id
        from ${schema.billingPayments} payment
        inner join locked_invoice invoice on invoice.id = payment.invoice_id
        limit 1
      ),
      inserted_payment as (
        insert into ${schema.billingPayments}
          (id, invoice_id, attempt_id, method, amount, approved_at,
           toss_payment_key, toss_mid, approval_number, masked_method,
           refunded_amount)
        select ${input.paymentId}::uuid, invoice.id, null, 'BANK_TRANSFER',
               ${input.amount}, now(), null, null, null, '{}'::jsonb, 0
        from locked_invoice invoice
        where invoice.status in ('OPEN', 'OVERDUE')
          and invoice.total_amount = ${input.amount}
          and not exists (select 1 from existing_payment)
        on conflict do nothing
        returning id, invoice_id
      ),
      inserted_receipt as (
        insert into ${schema.billingBankReceipts}
          (id, payment_id, depositor_name, amount, deposited_on,
           confirmed_by, evidence_note, confirmed_at)
        select ${input.receiptId}::uuid, payment.id, ${input.depositorName},
               ${input.amount}, ${input.depositedOn}::date,
               ${input.actorId}::uuid, ${input.evidenceNote}, now()
        from inserted_payment payment
        returning payment_id
      ),
      updated_invoice as (
        update ${schema.billingInvoices} invoice
        set status = 'PAID', updated_at = now()
        from inserted_payment payment, inserted_receipt receipt
        where invoice.id = payment.invoice_id
          and receipt.payment_id = payment.id
        returning invoice.id
      ),
      inserted_event as (
        insert into ${schema.billingPaymentEvents}
          (id, payment_id, source, event_type, from_status, to_status,
           correlation_id, occurred_at, metadata)
        select ${input.eventId}::uuid, payment.id, 'ADMIN',
               'payment.completed', invoice.status, 'PAID',
               ${input.correlationId}, now(), ${metadata}::jsonb
        from inserted_payment payment
        inner join locked_invoice invoice on invoice.id = payment.invoice_id
        inner join updated_invoice updated on updated.id = invoice.id
        returning payment_id
      ),
      audited as (
        insert into ${schema.auditLogs}
          (actor_admin_id, action, entity_type, entity_id, metadata)
        select ${input.actorId}::uuid, 'billing.bank_receipt.confirmed',
               'billing_payment', payment.id, ${metadata}::jsonb
        from inserted_payment payment
        inner join inserted_event event on event.payment_id = payment.id
        returning entity_id
      )
      select case
        when not exists (select 1 from locked_invoice) then 'not_found'
        when exists (select 1 from existing_payment) then 'already_paid'
        when (select status from locked_invoice) not in ('OPEN', 'OVERDUE')
          then 'not_payable'
        when (select total_amount from locked_invoice) <> ${input.amount}
          then 'amount_mismatch'
        when not exists (select 1 from audited) then 'conflict'
        else 'confirmed'
      end as outcome
    `);
    const row = result.rows[0] as ConfirmationResultRow | undefined;
    return row?.outcome ?? "conflict";
  },
};

const defaultBankTransferCommands = createBankTransferCommands(
  neonBankTransferRepository,
);

export async function confirmBankReceipt(
  actorId: string,
  input: ConfirmBankReceiptInput,
): Promise<string> {
  return defaultBankTransferCommands.confirmBankReceipt(actorId, input);
}
