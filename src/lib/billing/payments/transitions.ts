import type {
  PaymentAttemptStatus,
  RefundStatus,
} from "./types.ts";

export const PAYMENT_ATTEMPT_TRANSITIONS = {
  CREATED: ["AUTHENTICATED", "EXPIRED", "CANCELED"],
  AUTHENTICATED: ["CONFIRMING", "EXPIRED", "CANCELED"],
  CONFIRMING: ["DONE", "FAILED"],
  DONE: [],
  FAILED: [],
  EXPIRED: [],
  CANCELED: [],
} as const satisfies Record<PaymentAttemptStatus, readonly PaymentAttemptStatus[]>;

export const REFUND_TRANSITIONS = {
  REQUESTED: ["PROCESSING"],
  PROCESSING: ["DONE", "FAILED"],
  DONE: [],
  FAILED: [],
} as const satisfies Record<RefundStatus, readonly RefundStatus[]>;

export function canTransitionPaymentAttempt(
  from: PaymentAttemptStatus,
  to: PaymentAttemptStatus,
): boolean {
  return (PAYMENT_ATTEMPT_TRANSITIONS[from] as readonly PaymentAttemptStatus[]).includes(to);
}

export function canTransitionRefund(
  from: RefundStatus,
  to: RefundStatus,
): boolean {
  return (REFUND_TRANSITIONS[from] as readonly RefundStatus[]).includes(to);
}
