import type { PaymentMethod, TossPayment } from "./types.ts";

export type ExpectedTossPayment = {
  mid: string;
  paymentKey: string;
  orderId: string;
  amount: number;
  status: "DONE" | "PARTIAL_CANCELED" | "CANCELED";
};

export type VerifiedTossPayment = Omit<TossPayment, "method"> & {
  method: Extract<PaymentMethod, "CARD" | "EASY_PAY">;
  approvalNumber: string | null;
  maskedMethod: Record<string, string | number | null>;
};

export class TossPaymentVerificationError extends Error {
  constructor() {
    super("Toss payment verification failed.");
    this.name = "TossPaymentVerificationError";
  }
}

export function verifyTossPayment(
  expected: ExpectedTossPayment,
  actual: TossPayment,
): VerifiedTossPayment {
  if (
    actual.mId !== expected.mid ||
    actual.paymentKey !== expected.paymentKey ||
    actual.orderId !== expected.orderId ||
    actual.totalAmount !== expected.amount ||
    actual.status !== expected.status ||
    !actual.approvedAt
  ) {
    throw new TossPaymentVerificationError();
  }

  if (actual.easyPay?.provider) {
    return {
      ...actual,
      method: "EASY_PAY",
      approvalNumber: actual.card?.approveNo ?? null,
      maskedMethod: {
        provider: actual.easyPay.provider,
        cardNumber: actual.card?.number ?? null,
      },
    };
  }
  if (actual.card?.number || actual.method === "카드") {
    return {
      ...actual,
      method: "CARD",
      approvalNumber: actual.card?.approveNo ?? null,
      maskedMethod: {
        cardNumber: actual.card?.number ?? null,
        cardType: actual.card?.cardType ?? null,
        ownerType: actual.card?.ownerType ?? null,
      },
    };
  }
  throw new TossPaymentVerificationError();
}
