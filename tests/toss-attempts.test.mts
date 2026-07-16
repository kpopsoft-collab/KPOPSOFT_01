import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  createTossAttemptCommands,
  type TossAttemptRepository,
} from "../src/lib/billing/payments/attempts.ts";

const session = {
  sessionId: "s".repeat(43),
  siteId: "11111111-1111-4111-8111-111111111111",
  customerId: "22222222-2222-4222-8222-222222222222",
  issuedAt: "2026-07-16T00:00:00.000Z",
  expiresAt: "2026-07-16T00:30:00.000Z",
  absoluteExpiresAt: "2026-07-16T02:00:00.000Z",
};

test("attempt scope and amount come from the repository, with ten-minute expiry", async () => {
  const captured: Array<Parameters<TossAttemptRepository["prepare"]>[0]> = [];
  const repository: TossAttemptRepository = {
    async prepare(input) {
      captured.push(input);
      return {
        kind: "ready",
        orderId: input.orderId,
        amount: 110_000,
        expiresAt: input.expiresAt,
        orderName: "KPOPSOFT 유지보수",
        customerName: "테스트 고객사",
      };
    },
    async recordFailure() {
      return true;
    },
  };
  const now = new Date("2026-07-16T00:00:00.000Z");
  const commands = createTossAttemptCommands(repository, {
    now: () => now,
    randomUUID: () => "33333333-3333-4333-8333-333333333333",
    clientKey: "test_gck_public-fixture",
    payOrigin: "https://pay.kpopsoft.kr",
  });
  const result = await commands.createTossAttempt({
    invoiceNumber: "KPB-202607-0123456789",
    session,
  });

  assert.equal(captured[0].siteId, session.siteId);
  assert.equal(captured[0].customerId, session.customerId);
  assert.equal("amount" in captured[0], false);
  assert.equal(captured[0].expiresAt.toISOString(), "2026-07-16T00:10:00.000Z");
  assert.match(captured[0].orderId, /^[A-Za-z0-9_-]{6,64}$/);
  assert.match(captured[0].idempotencyKey, /^[0-9a-f-]{36}$/);
  assert.equal(result.amount, 110_000);
  assert.equal(result.clientKey, "test_gck_public-fixture");
  assert.equal(result.successUrl, "https://pay.kpopsoft.kr/pay/invoices/KPB-202607-0123456789/success");
  assert.equal(result.failUrl, "https://pay.kpopsoft.kr/pay/invoices/KPB-202607-0123456789/fail");
  assert.match(result.customerKey, /^anon_[A-Za-z0-9_-]{32}$/);
  assert.equal(JSON.stringify(result).includes("idempotency"), false);
});

test("attempt creation fails closed for disabled Toss and non-payable outcomes", async () => {
  let called = false;
  const repository: TossAttemptRepository = {
    async prepare() {
      called = true;
      return { kind: "not_found" };
    },
    async recordFailure() {
      return false;
    },
  };
  const disabled = createTossAttemptCommands(repository, {
    now: () => new Date(),
    randomUUID: () => "33333333-3333-4333-8333-333333333333",
    clientKey: null,
    payOrigin: "https://pay.kpopsoft.kr",
  });
  await assert.rejects(
    disabled.createTossAttempt({ invoiceNumber: "KPB-202607-0123456789", session }),
    /disabled|available/i,
  );
  assert.equal(called, false);

  for (const kind of ["not_found", "not_payable", "already_paid", "conflict"] as const) {
    const commands = createTossAttemptCommands(
      {
        async prepare() {
          return { kind };
        },
        async recordFailure() {
          return false;
        },
      },
      {
        now: () => new Date(),
        randomUUID: () => "33333333-3333-4333-8333-333333333333",
        clientKey: "test_gck_public-fixture",
        payOrigin: "https://pay.kpopsoft.kr",
      },
    );
    await assert.rejects(
      commands.createTossAttempt({ invoiceNumber: "KPB-202607-0123456789", session }),
    );
  }
});

test("attempt SQL locks scope, rejects completed payment, and persists idempotency", () => {
  const source = readFileSync(
    join(process.cwd(), "src/lib/billing/payments/attempts.ts"),
    "utf8",
  );
  assert.match(source, /for update/);
  assert.match(source, /billingPaymentSessions/);
  assert.match(source, /billingPayments/);
  assert.match(source, /insert into \$\{schema\.billingPaymentAttempts\}/);
  assert.match(source, /idempotency_key/);
  assert.match(source, /interval '10 minutes'|10 \* 60 \* 1000/);
  assert.match(source, /on conflict do nothing/);
});
