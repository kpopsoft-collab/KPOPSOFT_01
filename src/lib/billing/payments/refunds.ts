import { randomUUID } from "node:crypto";

import { z } from "zod";

import { verifyTossPayment } from "./provider-verification.ts";
import { neonRefundRepository } from "./repository.ts";
import { tossServerConfig } from "./runtime.ts";
import {
  createTossClient,
  TossClientError,
  type TossClient,
} from "./toss-client.ts";
import type { RefundStatus } from "./types.ts";

export type RefundInspection =
  | {
      kind: "ready";
      paymentId: string;
      invoiceId: string;
      paymentKey: string;
      orderId: string;
      amount: number;
      refundedAmount: number;
    }
  | { kind: "in_progress"; refundId: string }
  | { kind: "not_found" }
  | { kind: "non_toss" }
  | { kind: "amount_exceeds" };

export type RefundRepository = {
  inspect(input: {
    actorId: string;
    paymentId: string;
    amount: number;
  }): Promise<RefundInspection>;
  begin(input: {
    actorId: string;
    paymentId: string;
    refundId: string;
    amount: number;
    reason: string;
    idempotencyKey: string;
    eventId: string;
    correlationId: string;
  }): Promise<
    | { kind: "ready" }
    | { kind: "existing"; refundId: string }
    | { kind: "conflict" }
  >;
  complete(input: {
    actorId: string;
    paymentId: string;
    refundId: string;
    amount: number;
    transactionKey: string;
    eventId: string;
    correlationId: string;
  }): Promise<boolean>;
  fail(input: {
    refundId: string;
    failureCode: string;
    eventId: string;
    correlationId: string;
  }): Promise<void>;
};

const refundInputSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().int().positive().safe(),
  reason: z.string().trim().min(5).max(200),
});

function throwInspection(kind: Exclude<RefundInspection["kind"], "ready" | "in_progress">): never {
  const messages: Record<typeof kind, string> = {
    not_found: "Payment not found.",
    non_toss: "Only Toss payments can be refunded here.",
    amount_exceeds: "Refund amount exceeds the available balance.",
  };
  throw new Error(messages[kind]);
}

export function createRefundCommands(
  repository: RefundRepository,
  options: { client: TossClient; mid: string },
) {
  return {
    async requestTossRefund(
      rawActorId: string,
      rawInput: { paymentId: string; amount: number; reason: string },
    ): Promise<{ refundId: string; status: RefundStatus }> {
      const actorId = z.string().uuid().parse(rawActorId);
      const input = refundInputSchema.parse(rawInput);
      const inspected = await repository.inspect({
        actorId,
        paymentId: input.paymentId,
        amount: input.amount,
      });
      if (inspected.kind === "in_progress") {
        return { refundId: inspected.refundId, status: "PROCESSING" };
      }
      if (inspected.kind !== "ready") return throwInspection(inspected.kind);

      const expectedBalance = inspected.amount - inspected.refundedAmount;
      const before = await options.client.getPayment(inspected.paymentKey);
      const verifiedBefore = verifyTossPayment(
        {
          mid: options.mid,
          paymentKey: inspected.paymentKey,
          orderId: inspected.orderId,
          amount: inspected.amount,
          status: inspected.refundedAmount > 0 ? "PARTIAL_CANCELED" : "DONE",
        },
        before,
      );
      if (
        verifiedBefore.balanceAmount !== expectedBalance ||
        input.amount > verifiedBefore.balanceAmount
      ) {
        throw new Error("Provider and internal refundable balance do not match.");
      }

      const refundId = randomUUID();
      const idempotencyKey = randomUUID();
      const begun = await repository.begin({
        actorId,
        paymentId: inspected.paymentId,
        refundId,
        amount: input.amount,
        reason: input.reason,
        idempotencyKey,
        eventId: randomUUID(),
        correlationId: randomUUID(),
      });
      if (begun.kind === "existing") {
        return { refundId: begun.refundId, status: "PROCESSING" };
      }
      if (begun.kind === "conflict") {
        throw new Error("Refund request conflict. Please try again.");
      }

      let after;
      try {
        after = await options.client.cancel({
          paymentKey: inspected.paymentKey,
          cancelAmount: input.amount,
          cancelReason: input.reason,
          idempotencyKey,
        });
      } catch (error) {
        if (error instanceof TossClientError && !error.retryable) {
          await repository.fail({
            refundId,
            failureCode: error.code,
            eventId: randomUUID(),
            correlationId: randomUUID(),
          });
          return { refundId, status: "FAILED" };
        }
        return { refundId, status: "PROCESSING" };
      }

      const nextBalance = expectedBalance - input.amount;
      try {
        const verifiedAfter = verifyTossPayment(
          {
            mid: options.mid,
            paymentKey: inspected.paymentKey,
            orderId: inspected.orderId,
            amount: inspected.amount,
            status: nextBalance === 0 ? "CANCELED" : "PARTIAL_CANCELED",
          },
          after,
        );
        if (verifiedAfter.balanceAmount !== nextBalance) {
          return { refundId, status: "PROCESSING" };
        }
        const transactionKey = verifiedAfter.lastTransactionKey;
        const matchingCancel = verifiedAfter.cancels?.find(
          (cancel) =>
            cancel.transactionKey === transactionKey &&
            cancel.cancelAmount === input.amount &&
            (!cancel.cancelStatus || cancel.cancelStatus === "DONE"),
        );
        if (!transactionKey || !matchingCancel) {
          return { refundId, status: "PROCESSING" };
        }
        const completed = await repository.complete({
          actorId,
          paymentId: inspected.paymentId,
          refundId,
          amount: input.amount,
          transactionKey,
          eventId: randomUUID(),
          correlationId: randomUUID(),
        });
        return { refundId, status: completed ? "DONE" : "PROCESSING" };
      } catch {
        return { refundId, status: "PROCESSING" };
      }
    },
  };
}

export async function requestTossRefund(
  actorId: string,
  input: { paymentId: string; amount: number; reason: string },
  client?: TossClient,
): Promise<{ refundId: string; status: RefundStatus }> {
  const config = tossServerConfig();
  if (!config) throw new Error("Toss Payments is not configured.");
  return createRefundCommands(neonRefundRepository, {
    client: client ?? createTossClient(config),
    mid: config.mid,
  }).requestTossRefund(actorId, input);
}
