import assert from "node:assert/strict";
import test from "node:test";

import {
  PAYMENT_ATTEMPT_TRANSITIONS,
  REFUND_TRANSITIONS,
  canTransitionPaymentAttempt,
  canTransitionRefund,
} from "../src/lib/billing/payments/transitions.ts";

test("payment attempt transitions preserve ambiguous provider outcomes", () => {
  assert.deepEqual(PAYMENT_ATTEMPT_TRANSITIONS, {
    CREATED: ["AUTHENTICATED", "EXPIRED", "CANCELED"],
    AUTHENTICATED: ["CONFIRMING", "EXPIRED", "CANCELED"],
    CONFIRMING: ["DONE", "FAILED"],
    DONE: [],
    FAILED: [],
    EXPIRED: [],
    CANCELED: [],
  });
  assert.equal(canTransitionPaymentAttempt("CREATED", "AUTHENTICATED"), true);
  assert.equal(canTransitionPaymentAttempt("CONFIRMING", "DONE"), true);
  assert.equal(canTransitionPaymentAttempt("CONFIRMING", "AUTHENTICATED"), false);
  assert.equal(canTransitionPaymentAttempt("DONE", "FAILED"), false);
});

test("refund transitions require a processing boundary", () => {
  assert.deepEqual(REFUND_TRANSITIONS, {
    REQUESTED: ["PROCESSING"],
    PROCESSING: ["DONE", "FAILED"],
    DONE: [],
    FAILED: [],
  });
  assert.equal(canTransitionRefund("REQUESTED", "PROCESSING"), true);
  assert.equal(canTransitionRefund("REQUESTED", "DONE"), false);
  assert.equal(canTransitionRefund("PROCESSING", "FAILED"), true);
  assert.equal(canTransitionRefund("DONE", "PROCESSING"), false);
});
