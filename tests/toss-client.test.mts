import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  createTossClient,
  TossClientError,
} from "../src/lib/billing/payments/toss-client.ts";
import { verifyTossPayment } from "../src/lib/billing/payments/provider-verification.ts";
import type { TossServerConfig } from "../src/lib/billing/payments/runtime.ts";

const config: TossServerConfig = {
  secretKey: "test_gsk_this-is-only-a-fixture",
  mid: "kpopsoft-mid",
  apiBase: "https://api.tosspayments.com",
  mode: "test",
};

const providerPayment = {
  mId: "kpopsoft-mid",
  paymentKey: "pay_key/with space",
  orderId: "KPO_20260716_0001",
  status: "DONE",
  totalAmount: 110_000,
  balanceAmount: 110_000,
  method: "카드",
  approvedAt: "2026-07-16T10:00:00+09:00",
  card: {
    number: "12345678****1234",
    approveNo: "12345678",
    cardType: "신용",
    ownerType: "개인",
  },
  easyPay: null,
  cancels: null,
};

test("Toss confirm uses isolated Basic auth, JSON, and exact idempotency", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createTossClient(config, async (url, init) => {
    calls.push({ url: String(url), init: init ?? {} });
    return Response.json(providerPayment);
  });
  const result = await client.confirm({
    paymentKey: providerPayment.paymentKey,
    orderId: providerPayment.orderId,
    amount: providerPayment.totalAmount,
    idempotencyKey: "11111111-1111-4111-8111-111111111111",
  });

  assert.equal(calls[0].url, "https://api.tosspayments.com/v1/payments/confirm");
  assert.equal(calls[0].init.method, "POST");
  const headers = new Headers(calls[0].init.headers);
  assert.equal(headers.get("content-type"), "application/json");
  assert.equal(headers.get("idempotency-key"), "11111111-1111-4111-8111-111111111111");
  assert.equal(
    headers.get("authorization"),
    `Basic ${Buffer.from(`${config.secretKey}:`).toString("base64")}`,
  );
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    paymentKey: providerPayment.paymentKey,
    orderId: providerPayment.orderId,
    amount: providerPayment.totalAmount,
  });
  assert.equal(result.card?.number, "12345678****1234");
  assert.ok(calls[0].init.signal);
});

test("lookup URL-encodes payment keys and cancel sends exact body", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = createTossClient(config, async (url, init) => {
    calls.push({ url: String(url), init: init ?? {} });
    return Response.json({
      ...providerPayment,
      balanceAmount: 55_000,
      cancels: [{
        transactionKey: "cancel_tx_1",
        cancelAmount: 55_000,
        cancelReason: "계약 변경 환불",
        canceledAt: "2026-07-16T11:00:00+09:00",
        cancelStatus: "DONE",
      }],
    });
  });

  await client.getPayment(providerPayment.paymentKey);
  await client.cancel({
    paymentKey: providerPayment.paymentKey,
    cancelAmount: 55_000,
    cancelReason: "계약 변경 환불",
    idempotencyKey: "22222222-2222-4222-8222-222222222222",
  });

  assert.equal(
    calls[0].url,
    "https://api.tosspayments.com/v1/payments/pay_key%2Fwith%20space",
  );
  assert.equal(
    calls[1].url,
    "https://api.tosspayments.com/v1/payments/pay_key%2Fwith%20space/cancel",
  );
  assert.deepEqual(JSON.parse(String(calls[1].init.body)), {
    cancelAmount: 55_000,
    cancelReason: "계약 변경 환불",
  });
});

test("provider errors are sanitized and classified without secrets or raw bodies", async () => {
  const client = createTossClient(config, async () =>
    Response.json(
      { code: "PROVIDER_ERROR", message: `raw ${config.secretKey}` },
      { status: 503 },
    ),
  );
  await assert.rejects(
    client.getPayment("payment-key"),
    (error: unknown) => {
      assert.ok(error instanceof TossClientError);
      assert.equal(error.code, "PROVIDER_ERROR");
      assert.equal(error.retryable, true);
      assert.equal(error.status, 503);
      assert.doesNotMatch(error.message, /raw|test_gsk/);
      return true;
    },
  );
});

test("network and invalid response failures are retryable and sanitized", async () => {
  const network = createTossClient(config, async () => {
    throw new Error(`socket leaked ${config.secretKey}`);
  });
  await assert.rejects(network.getPayment("payment-key"), (error: unknown) => {
    assert.ok(error instanceof TossClientError);
    assert.equal(error.code, "NETWORK_ERROR");
    assert.equal(error.retryable, true);
    assert.doesNotMatch(error.message, /socket|test_gsk/);
    return true;
  });

  const invalid = createTossClient(config, async () => Response.json({ raw: "secret" }));
  await assert.rejects(invalid.getPayment("payment-key"), (error: unknown) => {
    assert.ok(error instanceof TossClientError);
    assert.equal(error.code, "INVALID_PROVIDER_RESPONSE");
    assert.equal(error.retryable, true);
    assert.doesNotMatch(error.message, /secret/);
    return true;
  });
});

test("verification requires exact MID, key, order, amount, and DONE", () => {
  const verified = verifyTossPayment(
    {
      mid: config.mid,
      paymentKey: providerPayment.paymentKey,
      orderId: providerPayment.orderId,
      amount: providerPayment.totalAmount,
      status: "DONE",
    },
    providerPayment,
  );
  assert.equal(verified.method, "CARD");

  for (const actual of [
    { ...providerPayment, mId: "wrong" },
    { ...providerPayment, paymentKey: "wrong" },
    { ...providerPayment, orderId: "wrong" },
    { ...providerPayment, totalAmount: 1 },
    { ...providerPayment, status: "IN_PROGRESS" },
  ]) {
    assert.throws(() =>
      verifyTossPayment(
        {
          mid: config.mid,
          paymentKey: providerPayment.paymentKey,
          orderId: providerPayment.orderId,
          amount: providerPayment.totalAmount,
          status: "DONE",
        },
        actual,
      ),
    );
  }
});

test("adapter fixes a ten-second abort deadline in the source", () => {
  const source = readFileSync(
    join(process.cwd(), "src/lib/billing/payments/toss-client.ts"),
    "utf8",
  );
  assert.match(source, /10_000/);
  assert.match(source, /AbortController/);
});
