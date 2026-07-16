export const PAYMENT_ATTEMPT_STATUSES = [
  "CREATED",
  "AUTHENTICATED",
  "CONFIRMING",
  "DONE",
  "FAILED",
  "EXPIRED",
  "CANCELED",
] as const;

export const PAYMENT_METHODS = ["BANK_TRANSFER", "CARD", "EASY_PAY"] as const;
export const REFUND_STATUSES = [
  "REQUESTED",
  "PROCESSING",
  "DONE",
  "FAILED",
] as const;
export const WEBHOOK_STATUSES = [
  "RECEIVED",
  "PROCESSING",
  "DONE",
  "RETRY",
  "REJECTED",
] as const;
export const PAYMENT_EVENT_SOURCES = [
  "CUSTOMER",
  "ADMIN",
  "TOSS_REDIRECT",
  "TOSS_WEBHOOK",
  "RECONCILIATION",
  "SYSTEM",
] as const;

export type PaymentAttemptStatus = (typeof PAYMENT_ATTEMPT_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type RefundStatus = (typeof REFUND_STATUSES)[number];
export type WebhookStatus = (typeof WEBHOOK_STATUSES)[number];
export type PaymentEventSource = (typeof PAYMENT_EVENT_SOURCES)[number];

export type TossCancel = {
  transactionKey: string;
  cancelAmount: number;
  cancelReason: string;
  canceledAt: string;
  cancelStatus?: string;
};

export type TossPayment = {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  balanceAmount: number;
  mId: string;
  method: string | null;
  approvedAt: string | null;
  lastTransactionKey?: string | null;
  card?: {
    number?: string;
    approveNo?: string;
    cardType?: string;
    ownerType?: string;
  } | null;
  easyPay?: {
    provider?: string;
    amount?: number;
  } | null;
  cancels?: TossCancel[] | null;
};

export type TossError = {
  code: string;
  message: string;
};
