import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  createRefundCommands,
  type RefundRepository,
} from "../src/lib/billing/payments/refunds.ts";
import { TossClientError, type TossClient } from "../src/lib/billing/payments/toss-client.ts";
import { findAdminActionGuardViolations } from "./helpers/admin-action-policy.mts";

const actorId = "11111111-1111-4111-8111-111111111111";
const paymentId = "22222222-2222-4222-8222-222222222222";
const inspected = {
  kind: "ready" as const,
  paymentId,
  invoiceId: "33333333-3333-4333-8333-333333333333",
  paymentKey: "payment-key-1",
  orderId: "KPO_order_1",
  amount: 110_000,
  refundedAmount: 0,
};
const before = {
  mId: "kpopsoft-mid",
  paymentKey: inspected.paymentKey,
  orderId: inspected.orderId,
  status: "DONE",
  totalAmount: inspected.amount,
  balanceAmount: inspected.amount,
  method: "카드",
  approvedAt: "2026-07-16T10:00:00+09:00",
  card: { number: "1234****1234" },
  easyPay: null,
  cancels: null,
};
const after = {
  ...before,
  status: "PARTIAL_CANCELED",
  balanceAmount: 55_000,
  lastTransactionKey: "cancel-transaction-1",
  cancels: [{
    transactionKey: "cancel-transaction-1",
    cancelAmount: 55_000,
    cancelReason: "계약 범위 변경 환불",
    canceledAt: "2026-07-16T11:00:00+09:00",
    cancelStatus: "DONE",
  }],
};

function harness(overrides: Partial<RefundRepository> = {}, toss: Partial<TossClient> = {}) {
  const calls = { begin: [] as unknown[], complete: [] as unknown[], fail: [] as unknown[] };
  const repository: RefundRepository = {
    async inspect() {
      return inspected;
    },
    async begin(input) {
      calls.begin.push(input);
      return { kind: "ready" };
    },
    async complete(input) {
      calls.complete.push(input);
      return true;
    },
    async fail(input) {
      calls.fail.push(input);
    },
    ...overrides,
  };
  const client: TossClient = {
    async getPayment() {
      return before;
    },
    async cancel() {
      return after;
    },
    async confirm() {
      return before;
    },
    ...toss,
  };
  return {
    calls,
    commands: createRefundCommands(repository, { client, mid: "kpopsoft-mid" }),
  };
}

test("refund validates actor, amount, and reason before any repository/provider call", async () => {
  let inspectedCalls = 0;
  const h = harness({ async inspect() { inspectedCalls += 1; return inspected; } });
  for (const input of [
    { amount: 0 },
    { amount: -1 },
    { amount: 1.5 },
    { reason: "짧음" },
    { reason: "a".repeat(201) },
  ]) {
    await assert.rejects(h.commands.requestTossRefund(actorId, {
      paymentId,
      amount: 55_000,
      reason: "계약 범위 변경 환불",
      ...input,
    }));
  }
  assert.equal(inspectedCalls, 0);
});

test("non-Toss, over-balance, missing, and active refunds never call provider", async () => {
  for (const outcome of [
    { kind: "not_found" as const },
    { kind: "non_toss" as const },
    { kind: "amount_exceeds" as const },
  ]) {
    let providerCalls = 0;
    const h = harness(
      { async inspect() { return outcome; } },
      { async getPayment() { providerCalls += 1; return before; } },
    );
    await assert.rejects(h.commands.requestTossRefund(actorId, {
      paymentId,
      amount: 55_000,
      reason: "계약 범위 변경 환불",
    }));
    assert.equal(providerCalls, 0);
  }

  const existing = harness({
    async inspect() {
      return { kind: "in_progress", refundId: "44444444-4444-4444-8444-444444444444" };
    },
  });
  assert.deepEqual(await existing.commands.requestTossRefund(actorId, {
    paymentId,
    amount: 55_000,
    reason: "계약 범위 변경 환불",
  }), { refundId: "44444444-4444-4444-8444-444444444444", status: "PROCESSING" });
});

test("provider balance must match internal balance before request persistence", async () => {
  const h = harness({}, {
    async getPayment() {
      return { ...before, balanceAmount: 100_000 };
    },
  });
  await assert.rejects(h.commands.requestTossRefund(actorId, {
    paymentId,
    amount: 55_000,
    reason: "계약 범위 변경 환불",
  }), /balance/i);
  assert.equal(h.calls.begin.length, 0);
});

test("successful partial cancel uses persisted idempotency and completes exact balance", async () => {
  const cancelCalls: unknown[] = [];
  const h = harness({}, {
    async cancel(input) {
      cancelCalls.push(input);
      return after;
    },
  });
  const result = await h.commands.requestTossRefund(actorId, {
    paymentId,
    amount: 55_000,
    reason: "계약 범위 변경 환불",
  });
  assert.equal(result.status, "DONE");
  assert.match(result.refundId, /^[0-9a-f-]{36}$/);
  const begun = h.calls.begin[0] as { idempotencyKey: string };
  assert.deepEqual(cancelCalls, [{
    paymentKey: inspected.paymentKey,
    cancelAmount: 55_000,
    cancelReason: "계약 범위 변경 환불",
    idempotencyKey: begun.idempotencyKey,
  }]);
  assert.equal(h.calls.complete.length, 1);
  assert.match(JSON.stringify(h.calls.complete), /cancel-transaction-1/);
});

test("timeout remains PROCESSING while terminal rejection becomes FAILED", async () => {
  const pending = harness({}, {
    async cancel() {
      throw new TossClientError({ code: "NETWORK_ERROR", retryable: true });
    },
  });
  assert.equal((await pending.commands.requestTossRefund(actorId, {
    paymentId,
    amount: 55_000,
    reason: "계약 범위 변경 환불",
  })).status, "PROCESSING");
  assert.equal(pending.calls.fail.length, 0);

  const failed = harness({}, {
    async cancel() {
      throw new TossClientError({ code: "NOT_CANCELABLE_AMOUNT", retryable: false, status: 400 });
    },
  });
  assert.equal((await failed.commands.requestTossRefund(actorId, {
    paymentId,
    amount: 55_000,
    reason: "계약 범위 변경 환불",
  })).status, "FAILED");
  assert.equal(failed.calls.fail.length, 1);
});

test("mismatched cancel response stays recoverable without false completion", async () => {
  const h = harness({}, {
    async cancel() {
      return { ...after, balanceAmount: 54_999 };
    },
  });
  assert.equal((await h.commands.requestTossRefund(actorId, {
    paymentId,
    amount: 55_000,
    reason: "계약 범위 변경 환불",
  })).status, "PROCESSING");
  assert.equal(h.calls.complete.length, 0);
});

test("refund repository locks, persists idempotency, updates totals, invoice, event, and audit", () => {
  const source = readFileSync(
    join(process.cwd(), "src/lib/billing/payments/repository.ts"),
    "utf8",
  );
  assert.match(source, /for update/);
  assert.match(source, /idempotency_key/);
  assert.match(source, /billingRefunds/);
  assert.match(source, /refunded_amount/);
  assert.match(source, /PARTIALLY_REFUNDED/);
  assert.match(source, /REFUNDED/);
  assert.match(source, /refund\.completed/);
  assert.match(source, /billing\.refund\.completed/);
});

test("refund action requires recent BILLING_REFUND before service", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/admin/(shell)/billing/payment-actions.ts"),
    "utf8",
  );
  assert.deepEqual(findAdminActionGuardViolations(source), []);
  assert.ok(source.indexOf('requireRecentBillingAuth("BILLING_REFUND")') < source.indexOf("requestTossRefund("));
});
