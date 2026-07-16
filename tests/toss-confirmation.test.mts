import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  createTossConfirmationCommands,
  type TossConfirmationRepository,
} from "../src/lib/billing/payments/confirm.ts";
import { TossClientError, type TossClient } from "../src/lib/billing/payments/toss-client.ts";

const session = {
  sessionId: "s".repeat(43),
  siteId: "11111111-1111-4111-8111-111111111111",
  customerId: "22222222-2222-4222-8222-222222222222",
  issuedAt: "2026-07-16T00:00:00.000Z",
  expiresAt: "2026-07-16T00:30:00.000Z",
  absoluteExpiresAt: "2026-07-16T02:00:00.000Z",
};
const request = {
  session,
  paymentKey: "payment-key-1",
  orderId: "KPO_33333333333343338333333333333333",
  amount: 110_000,
};
const ready = {
  kind: "ready" as const,
  attemptId: "33333333-3333-4333-8333-333333333333",
  invoiceId: "44444444-4444-4444-8444-444444444444",
  paymentKey: request.paymentKey,
  orderId: request.orderId,
  amount: request.amount,
  idempotencyKey: "55555555-5555-4555-8555-555555555555",
};
const payment = {
  mId: "kpopsoft-mid",
  paymentKey: request.paymentKey,
  orderId: request.orderId,
  status: "DONE",
  totalAmount: request.amount,
  balanceAmount: request.amount,
  method: "카드",
  approvedAt: "2026-07-16T10:00:00+09:00",
  card: { number: "12345678****1234", approveNo: "12345678" },
  easyPay: null,
  cancels: null,
};

function repository(
  outcome: Awaited<ReturnType<TossConfirmationRepository["authenticate"]>> = ready,
) {
  const calls: { completed: unknown[]; failed: unknown[] } = {
    completed: [],
    failed: [],
  };
  const value: TossConfirmationRepository = {
    async authenticate() {
      return outcome;
    },
    async complete(input) {
      calls.completed.push(input);
      return { kind: "done", paymentId: "66666666-6666-4666-8666-666666666666" };
    },
    async fail(input) {
      calls.failed.push(input);
    },
  };
  return { value, calls };
}

function client(confirm: TossClient["confirm"]): TossClient {
  return {
    confirm,
    async getPayment() {
      return payment;
    },
    async cancel() {
      return payment;
    },
  };
}

test("invalid scope, order, amount, expiry, state, and existing payment never call Toss", async () => {
  for (const kind of [
    "not_found",
    "scope_mismatch",
    "amount_mismatch",
    "payment_key_mismatch",
    "expired",
    "invalid_status",
    "already_paid",
  ] as const) {
    let providerCalls = 0;
    const repo = repository({ kind });
    const commands = createTossConfirmationCommands(repo.value, {
      client: client(async () => {
        providerCalls += 1;
        return payment;
      }),
      mid: "kpopsoft-mid",
    });
    await assert.rejects(commands.confirmTossPayment(request));
    assert.equal(providerCalls, 0, kind);
  }
});

test("confirmation uses only the stored attempt and original idempotency key", async () => {
  const repo = repository();
  const providerCalls: unknown[] = [];
  const commands = createTossConfirmationCommands(repo.value, {
    mid: "kpopsoft-mid",
    client: client(async (input) => {
      providerCalls.push(input);
      return payment;
    }),
  });
  const result = await commands.confirmTossPayment(request);
  assert.deepEqual(providerCalls, [{
    paymentKey: ready.paymentKey,
    orderId: ready.orderId,
    amount: ready.amount,
    idempotencyKey: ready.idempotencyKey,
  }]);
  assert.deepEqual(result, {
    status: "DONE",
    paymentId: "66666666-6666-4666-8666-666666666666",
  });
  assert.equal(repo.calls.completed.length, 1);
});

test("duplicate completed confirmation is idempotent and skips provider", async () => {
  const repo = repository({
    kind: "done",
    paymentId: "66666666-6666-4666-8666-666666666666",
  });
  const commands = createTossConfirmationCommands(repo.value, {
    mid: "kpopsoft-mid",
    client: client(async () => {
      throw new Error("must not call");
    }),
  });
  assert.deepEqual(await commands.confirmTossPayment(request), {
    status: "DONE",
    paymentId: "66666666-6666-4666-8666-666666666666",
  });
});

test("provider mismatch and unknown outcomes stay recoverable", async () => {
  const mismatch = repository();
  const mismatchCommands = createTossConfirmationCommands(mismatch.value, {
    mid: "kpopsoft-mid",
    client: client(async () => ({ ...payment, totalAmount: 1 })),
  });
  assert.deepEqual(await mismatchCommands.confirmTossPayment(request), { status: "PENDING" });
  assert.equal(mismatch.calls.completed.length, 0);
  assert.equal(mismatch.calls.failed.length, 0);

  const network = repository();
  const networkCommands = createTossConfirmationCommands(network.value, {
    mid: "kpopsoft-mid",
    client: client(async () => {
      throw new TossClientError({ code: "NETWORK_ERROR", retryable: true });
    }),
  });
  assert.deepEqual(await networkCommands.confirmTossPayment(request), { status: "PENDING" });
  assert.equal(network.calls.failed.length, 0);
});

test("known terminal provider rejection marks the matching attempt failed", async () => {
  const repo = repository();
  const commands = createTossConfirmationCommands(repo.value, {
    mid: "kpopsoft-mid",
    client: client(async () => {
      throw new TossClientError({ code: "REJECT_CARD_PAYMENT", retryable: false, status: 400 });
    }),
  });
  assert.deepEqual(await commands.confirmTossPayment(request), { status: "FAILED" });
  assert.equal(repo.calls.failed.length, 1);
  assert.doesNotMatch(JSON.stringify(repo.calls.failed), /payment-key-1/);
});

test("SQL persists CONFIRMING before provider and atomically completes payment", () => {
  const source = readFileSync(
    join(process.cwd(), "src/lib/billing/payments/confirm.ts"),
    "utf8",
  );
  assert.match(source, /for update/);
  assert.match(source, /payment_key/);
  assert.match(source, /'AUTHENTICATED'/);
  assert.match(source, /'CONFIRMING'/);
  assert.match(source, /insert into \$\{schema\.billingPayments\}/);
  assert.match(source, /update \$\{schema\.billingInvoices\}/);
  assert.match(source, /'PAID'/);
  assert.match(source, /payment\.completed/);
});
