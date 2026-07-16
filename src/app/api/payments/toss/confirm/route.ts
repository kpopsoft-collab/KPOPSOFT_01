import { confirmTossPayment } from "@/lib/billing/payments/confirm";
import {
  PaymentSessionError,
  requirePaymentSession,
} from "@/lib/billing/widget/payment-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(request: Request): Promise<Response> {
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 16 * 1024) throw new Error("size");
    const body = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof body.paymentKey !== "string" ||
      typeof body.orderId !== "string" ||
      typeof body.amount !== "number"
    ) {
      throw new Error("shape");
    }
    const session = await requirePaymentSession();
    const result = await confirmTossPayment({
      session,
      paymentKey: body.paymentKey,
      orderId: body.orderId,
      amount: body.amount,
    });
    return Response.json(result, {
      status: result.status === "FAILED" ? 422 : 200,
      headers,
    });
  } catch (error) {
    const status = error instanceof PaymentSessionError ? 401 : 400;
    return Response.json(
      { status: "REJECTED", code: status === 401 ? "session_expired" : "invalid_confirmation" },
      { status, headers },
    );
  }
}
