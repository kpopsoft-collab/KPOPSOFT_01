import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  createBankTransferCommands,
  getBankTransferInstructions,
  type BankTransferRepository,
  type PayableInvoice,
} from "../src/lib/billing/payments/bank.ts";
import { findAdminActionGuardViolations } from "./helpers/admin-action-policy.mts";

const actorId = "11111111-1111-4111-8111-111111111111";
const invoiceId = "22222222-2222-4222-8222-222222222222";
const bankEnv = {
  BANK_TRANSFER_ENABLED: "true",
  BANK_ACCOUNT_BANK: "국민은행",
  BANK_ACCOUNT_NUMBER: "123-456-789012",
  BANK_ACCOUNT_HOLDER: "케이팝소프트",
};

function invoice(overrides: Partial<PayableInvoice> = {}): PayableInvoice {
  return {
    id: invoiceId,
    status: "OPEN",
    totalAmount: 110_000,
    ...overrides,
  };
}

test("bank instructions are server-derived and hidden when disabled or non-payable", () => {
  assert.deepEqual(getBankTransferInstructions(invoice(), bankEnv), {
    bank: "국민은행",
    accountNumber: "123-456-789012",
    holder: "케이팝소프트",
    amount: 110_000,
  });
  assert.equal(
    getBankTransferInstructions(invoice(), {
      ...bankEnv,
      BANK_TRANSFER_ENABLED: "false",
    }),
    null,
  );
  assert.equal(getBankTransferInstructions(invoice({ status: "DRAFT" }), bankEnv), null);
  assert.equal(getBankTransferInstructions(invoice({ status: "PAID" }), bankEnv), null);
});

test("bank confirmation validates exact input before the repository boundary", async () => {
  const captured: Array<Parameters<BankTransferRepository["confirm"]>[0]> = [];
  const repository: BankTransferRepository = {
    async confirm(input) {
      captured.push(input);
      return "confirmed";
    },
  };
  const commands = createBankTransferCommands(repository);
  const paymentId = await commands.confirmBankReceipt(actorId, {
    invoiceId,
    amount: 110_000,
    depositorName: "홍길동",
    depositedOn: "2026-07-16",
    evidenceNote: "국민은행 거래내역에서 입금 확인",
  });
  assert.match(paymentId, /^[0-9a-f-]{36}$/);
  assert.equal(captured[0].actorId, actorId);
  assert.equal(captured[0].invoiceId, invoiceId);
  assert.equal(captured[0].amount, 110_000);
  assert.equal(captured[0].depositorName, "홍길동");

  for (const input of [
    { amount: 0 },
    { amount: -1 },
    { amount: 1.5 },
    { depositorName: " " },
    { depositedOn: "2026-02-30" },
    { evidenceNote: "짧음" },
    { evidenceNote: "a".repeat(501) },
  ]) {
    await assert.rejects(
      commands.confirmBankReceipt(actorId, {
        invoiceId,
        amount: 110_000,
        depositorName: "홍길동",
        depositedOn: "2026-07-16",
        evidenceNote: "국민은행 거래내역에서 입금 확인",
        ...input,
      }),
    );
  }
});

test("repository outcomes distinguish amount, state, existing payment, and concurrency", async () => {
  const outcomes = [
    ["amount_mismatch", /exact|amount/i],
    ["not_payable", /payable|status/i],
    ["already_paid", /already|payment/i],
    ["conflict", /again|conflict/i],
    ["not_found", /not found/i],
  ] as const;
  for (const [outcome, message] of outcomes) {
    const commands = createBankTransferCommands({
      async confirm() {
        return outcome;
      },
    });
    await assert.rejects(
      commands.confirmBankReceipt(actorId, {
        invoiceId,
        amount: outcome === "amount_mismatch" ? 109_999 : 110_000,
        depositorName: "홍길동",
        depositedOn: "2026-07-16",
        evidenceNote: "입금 거래 내역 확인 완료",
      }),
      message,
    );
  }
});

test("bank SQL locks and atomically writes payment, receipt, event, invoice, and audit", () => {
  const source = readFileSync(
    join(process.cwd(), "src/lib/billing/payments/bank.ts"),
    "utf8",
  );
  assert.match(source, /for update/);
  assert.match(source, /insert into \$\{schema\.billingPayments\}/);
  assert.match(source, /insert into \$\{schema\.billingBankReceipts\}/);
  assert.match(source, /update \$\{schema\.billingInvoices\}/);
  assert.match(source, /insert into \$\{schema\.billingPaymentEvents\}/);
  assert.match(source, /insert into \$\{schema\.auditLogs\}/);
  assert.match(source, /billing\.bank_receipt\.confirmed/);
  assert.match(source, /payment\.completed/);
});

test("bank admin action requires recent BILLING_APPROVE before confirmation", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/admin/(shell)/billing/actions.ts"),
    "utf8",
  );
  assert.deepEqual(findAdminActionGuardViolations(source), []);
  const start = source.indexOf("export async function confirmBillingBankReceipt");
  assert.notEqual(start, -1);
  const body = source.slice(start);
  assert.ok(
    body.indexOf('requireRecentBillingAuth("BILLING_APPROVE")') <
      body.indexOf("confirmBankReceipt("),
  );
});
