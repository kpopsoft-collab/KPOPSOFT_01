import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  createReconciliationCommands,
  type ReconciliationCandidate,
  type ReconciliationRepository,
} from "../src/lib/billing/payments/reconcile.ts";
import type { TossClient } from "../src/lib/billing/payments/toss-client.ts";

const candidates: ReconciliationCandidate[] = [
  { id: "a", kind: "attempt", paymentKey: "key-a", orderId: "order-a", amount: 100 },
  { id: "w", kind: "webhook", paymentKey: "key-w", orderId: "order-w", amount: 200 },
  { id: "r", kind: "refund", paymentKey: "key-r", orderId: "order-r", amount: 300 },
];

function provider(candidate: ReconciliationCandidate) {
  return {
    mId: "kpopsoft-mid",
    paymentKey: candidate.paymentKey,
    orderId: candidate.orderId,
    status: "DONE",
    totalAmount: candidate.amount,
    balanceAmount: candidate.amount,
    method: "카드",
    approvedAt: "2026-07-16T10:00:00+09:00",
    card: { number: "1234****1234" },
    easyPay: null,
    cancels: null,
  };
}

test("reconciliation caps claims and queries provider before every apply", async () => {
  const calls: string[] = [];
  const repository: ReconciliationRepository = {
    async claim(limit) {
      assert.equal(limit, 100);
      return candidates;
    },
    async apply(candidate) {
      calls.push(`apply:${candidate.id}`);
      return true;
    },
    async markRetry(candidate) {
      calls.push(`retry:${candidate.id}`);
    },
  };
  const client: TossClient = {
    async getPayment(key) {
      const candidate = candidates.find((entry) => entry.paymentKey === key)!;
      calls.push(`query:${candidate.id}`);
      return provider(candidate);
    },
    async confirm() {
      throw new Error("unused");
    },
    async cancel() {
      throw new Error("unused");
    },
  };
  const result = await createReconciliationCommands(repository, {
    client,
    mid: "kpopsoft-mid",
  }).run();
  assert.deepEqual(calls, ["query:a", "apply:a", "query:w", "apply:w", "query:r", "apply:r"]);
  assert.deepEqual(result, { claimed: 3, applied: 3, retry: 0 });
});

test("provider mismatch or lookup failure never applies a candidate", async () => {
  const applied: string[] = [];
  const retried: string[] = [];
  const repository: ReconciliationRepository = {
    async claim() {
      return candidates.slice(0, 2);
    },
    async apply(candidate) {
      applied.push(candidate.id);
      return true;
    },
    async markRetry(candidate) {
      retried.push(candidate.id);
    },
  };
  let call = 0;
  const client: TossClient = {
    async getPayment() {
      call += 1;
      if (call === 1) return { ...provider(candidates[0]), totalAmount: 999 };
      throw new Error("network");
    },
    async confirm() {
      throw new Error("unused");
    },
    async cancel() {
      throw new Error("unused");
    },
  };
  const result = await createReconciliationCommands(repository, {
    client,
    mid: "kpopsoft-mid",
  }).run();
  assert.deepEqual(applied, []);
  assert.deepEqual(retried, ["a", "w"]);
  assert.equal(result.retry, 2);
});

test("candidate SQL includes every recovery class with bounded skip-locked claims", () => {
  const source = readFileSync(
    join(process.cwd(), "src/lib/billing/payments/reconcile.ts"),
    "utf8",
  );
  assert.match(source, /CONFIRMING/);
  assert.match(source, /RETRY/);
  assert.match(source, /PROCESSING/);
  assert.match(source, /for update skip locked/);
  assert.match(source, /limit 100/);
});

test("internal route reuses bearer cron authorization and returns sanitized counts", () => {
  const route = readFileSync(
    join(process.cwd(), "src/app/api/internal/billing/reconcile/route.ts"),
    "utf8",
  );
  assert.match(route, /requireCronSecret/);
  assert.match(route, /isBillingEnabled/);
  assert.match(route, /no-store/);
  assert.doesNotMatch(route, /paymentKey|orderId|error\.message/);
});
