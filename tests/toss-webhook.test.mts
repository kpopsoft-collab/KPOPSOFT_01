import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  createTossWebhookCommands,
  type TossWebhookRepository,
} from "../src/lib/billing/payments/webhooks.ts";
import { TossClientError, type TossClient } from "../src/lib/billing/payments/toss-client.ts";

const raw = JSON.stringify({
  eventType: "PAYMENT_STATUS_CHANGED",
  createdAt: "2026-07-16T10:00:00+09:00",
  data: { paymentKey: "payment-key-1", orderId: "KPO_order_1" },
});
const ready = {
  kind: "ready" as const,
  receiptId: "11111111-1111-4111-8111-111111111111",
  attemptId: "22222222-2222-4222-8222-222222222222",
  invoiceId: "33333333-3333-4333-8333-333333333333",
  paymentKey: "payment-key-1",
  orderId: "KPO_order_1",
  amount: 110_000,
};
const payment = {
  mId: "kpopsoft-mid",
  paymentKey: ready.paymentKey,
  orderId: ready.orderId,
  status: "DONE",
  totalAmount: ready.amount,
  balanceAmount: ready.amount,
  method: "카드",
  approvedAt: "2026-07-16T10:00:00+09:00",
  card: { number: "12345678****1234", approveNo: "12345678" },
  easyPay: null,
  cancels: null,
};

function harness(receive: TossWebhookRepository["receive"], getPayment: TossClient["getPayment"]) {
  const calls = { received: [] as unknown[], applied: [] as unknown[], retry: [] as unknown[], rejected: [] as unknown[] };
  const repository: TossWebhookRepository = {
    async receive(input) {
      calls.received.push(input);
      return receive(input);
    },
    async apply(input) {
      calls.applied.push(input);
      return "done";
    },
    async markRetry(input) {
      calls.retry.push(input);
    },
    async markRejected(input) {
      calls.rejected.push(input);
    },
  };
  const client: TossClient = {
    async getPayment(key) {
      return getPayment(key);
    },
    async confirm() {
      return payment;
    },
    async cancel() {
      return payment;
    },
  };
  return {
    calls,
    commands: createTossWebhookCommands(repository, { client, mid: "kpopsoft-mid" }),
  };
}

test("receipt is stored with hashes before mandatory provider lookup", async () => {
  const order: string[] = [];
  const h = harness(
    async () => {
      order.push("receipt");
      return ready;
    },
    async () => {
      order.push("provider");
      return payment;
    },
  );
  const result = await h.commands.handle({ transmissionId: "tx-1", rawPayload: raw });
  assert.equal(result, "DONE");
  assert.deepEqual(order, ["receipt", "provider"]);
  assert.equal(h.calls.applied.length, 1);
  const stored = h.calls.received[0] as { paymentKeyHash: Uint8Array; payloadHash: Uint8Array };
  assert.equal(stored.paymentKeyHash.byteLength, 32);
  assert.equal(stored.payloadHash.byteLength, 32);
});

test("completed duplicates and unknown attempts never call provider", async () => {
  for (const kind of ["duplicate_done", "rejected", "busy"] as const) {
    let calls = 0;
    const h = harness(
      async () => ({ kind }),
      async () => {
        calls += 1;
        return payment;
      },
    );
    const result = await h.commands.handle({ transmissionId: `tx-${kind}`, rawPayload: raw });
    assert.equal(calls, 0);
    assert.equal(result, kind === "busy" ? "RETRY" : kind === "rejected" ? "REJECTED" : "DONE");
  }
});

test("MID, key, order, amount, and status mismatch is rejected", async () => {
  const mismatches = [
    { ...payment, mId: "wrong" },
    { ...payment, paymentKey: "wrong" },
    { ...payment, orderId: "wrong" },
    { ...payment, totalAmount: 1 },
    { ...payment, status: "IN_PROGRESS" },
  ];
  for (const [index, actual] of mismatches.entries()) {
    const h = harness(async () => ready, async () => actual);
    assert.equal(
      await h.commands.handle({ transmissionId: `tx-mismatch-${index}`, rawPayload: raw }),
      "REJECTED",
    );
    assert.equal(h.calls.applied.length, 0);
    assert.equal(h.calls.rejected.length, 1);
  }
});

test("temporary provider lookup failure is retryable and sanitized", async () => {
  const h = harness(async () => ready, async () => {
    throw new TossClientError({ code: "NETWORK_ERROR", retryable: true });
  });
  assert.equal(await h.commands.handle({ transmissionId: "tx-retry", rawPayload: raw }), "RETRY");
  assert.equal(h.calls.retry.length, 1);
  assert.doesNotMatch(JSON.stringify(h.calls.retry), /payment-key-1/);
});

test("webhook route enforces HTTPS, JSON, transmission id, size, and safe responses", () => {
  const route = readFileSync(
    join(process.cwd(), "src/app/api/payments/toss/webhook/route.ts"),
    "utf8",
  );
  assert.match(route, /x-forwarded-proto/);
  assert.match(route, /application\/json/);
  assert.match(route, /64 \* 1024/);
  assert.match(route, /tosspayments-webhook-transmission-id/);
  assert.match(route, /no-store/);
  assert.doesNotMatch(route, /signature/i);
});

test("receipt SQL deduplicates and applies only normalized payment state", () => {
  const source = readFileSync(
    join(process.cwd(), "src/lib/billing/payments/webhooks.ts"),
    "utf8",
  );
  assert.match(source, /on conflict do nothing/);
  assert.match(source, /billingWebhookReceipts/);
  assert.match(source, /billingPayments/);
  assert.match(source, /billingPaymentEvents/);
  assert.match(source, /TOSS_WEBHOOK/);
});
