import { z } from "zod";

import type { TossPayment } from "./types.ts";
import type { TossServerConfig } from "./runtime.ts";

export type TossConfirmInput = {
  paymentKey: string;
  orderId: string;
  amount: number;
  idempotencyKey: string;
};

export type TossCancelInput = {
  paymentKey: string;
  cancelAmount: number;
  cancelReason: string;
  idempotencyKey: string;
};

export interface TossClient {
  confirm(input: TossConfirmInput): Promise<TossPayment>;
  getPayment(paymentKey: string): Promise<TossPayment>;
  cancel(input: TossCancelInput): Promise<TossPayment>;
}

export class TossClientError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly status: number | null;

  constructor(input: { code: string; retryable: boolean; status?: number }) {
    super(`Toss request failed (${input.code}).`);
    this.name = "TossClientError";
    this.code = input.code;
    this.retryable = input.retryable;
    this.status = input.status ?? null;
  }
}

const idempotencyKeySchema = z.string().uuid();
const paymentKeySchema = z.string().min(1).max(200);
const orderIdSchema = z.string().regex(/^[A-Za-z0-9_-]{6,64}$/);

const tossCancelSchema = z.object({
  transactionKey: z.string().min(1).max(200),
  cancelAmount: z.number().int().positive().safe(),
  cancelReason: z.string().max(200),
  canceledAt: z.string().datetime({ offset: true }),
  cancelStatus: z.string().max(100).optional(),
});

const tossPaymentSchema = z.object({
  mId: z.string().min(1).max(100),
  paymentKey: paymentKeySchema,
  orderId: orderIdSchema,
  status: z.string().min(1).max(100),
  totalAmount: z.number().int().nonnegative().safe(),
  balanceAmount: z.number().int().nonnegative().safe(),
  method: z.string().max(100).nullable(),
  approvedAt: z.string().datetime({ offset: true }).nullable(),
  lastTransactionKey: z.string().max(200).nullable().optional(),
  card: z
    .object({
      number: z.string().max(64).optional(),
      approveNo: z.string().max(100).optional(),
      cardType: z.string().max(100).optional(),
      ownerType: z.string().max(100).optional(),
    })
    .nullable()
    .optional(),
  easyPay: z
    .object({
      provider: z.string().max(100).optional(),
      amount: z.number().int().nonnegative().safe().optional(),
    })
    .nullable()
    .optional(),
  cancels: z.array(tossCancelSchema).max(1000).nullable().optional(),
});

const tossErrorSchema = z.object({
  code: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
});

function retryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

export function createTossClient(
  config: TossServerConfig,
  fetchImpl: typeof fetch = fetch,
): TossClient {
  const authorization = `Basic ${Buffer.from(`${config.secretKey}:`).toString("base64")}`;

  async function request(
    path: string,
    init: { method?: "GET" | "POST"; body?: unknown; idempotencyKey?: string },
  ): Promise<TossPayment> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const headers = new Headers({ Authorization: authorization });
      if (init.body !== undefined) headers.set("Content-Type", "application/json");
      if (init.idempotencyKey) {
        headers.set("Idempotency-Key", idempotencyKeySchema.parse(init.idempotencyKey));
      }
      const response = await fetchImpl(`${config.apiBase}${path}`, {
        method: init.method ?? "GET",
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        cache: "no-store",
        signal: controller.signal,
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new TossClientError({
          code: "INVALID_PROVIDER_RESPONSE",
          retryable: true,
          status: response.status,
        });
      }
      if (!response.ok) {
        const parsedError = tossErrorSchema.safeParse(payload);
        throw new TossClientError({
          code: parsedError.success ? parsedError.data.code : "PROVIDER_ERROR",
          retryable: retryableStatus(response.status),
          status: response.status,
        });
      }
      const parsed = tossPaymentSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TossClientError({
          code: "INVALID_PROVIDER_RESPONSE",
          retryable: true,
          status: response.status,
        });
      }
      return parsed.data;
    } catch (error) {
      if (error instanceof TossClientError) throw error;
      throw new TossClientError({ code: "NETWORK_ERROR", retryable: true });
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    confirm(input) {
      const paymentKey = paymentKeySchema.parse(input.paymentKey);
      const orderId = orderIdSchema.parse(input.orderId);
      const amount = z.number().int().positive().safe().parse(input.amount);
      return request("/v1/payments/confirm", {
        method: "POST",
        idempotencyKey: input.idempotencyKey,
        body: { paymentKey, orderId, amount },
      });
    },

    getPayment(rawPaymentKey) {
      const paymentKey = paymentKeySchema.parse(rawPaymentKey);
      return request(`/v1/payments/${encodeURIComponent(paymentKey)}`, {});
    },

    cancel(input) {
      const paymentKey = paymentKeySchema.parse(input.paymentKey);
      const cancelAmount = z
        .number()
        .int()
        .positive()
        .safe()
        .parse(input.cancelAmount);
      const cancelReason = z.string().trim().min(5).max(200).parse(input.cancelReason);
      return request(
        `/v1/payments/${encodeURIComponent(paymentKey)}/cancel`,
        {
          method: "POST",
          idempotencyKey: input.idempotencyKey,
          body: { cancelAmount, cancelReason },
        },
      );
    },
  };
}
