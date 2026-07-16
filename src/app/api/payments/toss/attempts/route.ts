import {
  createTossAttempt,
  recordTossAttemptFailure,
} from "@/lib/billing/payments/attempts";
import {
  PaymentSessionError,
  requirePaymentSession,
} from "@/lib/billing/widget/payment-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(request: Request): Promise<Response> {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (!Number.isSafeInteger(contentLength) || contentLength !== 0) {
      return Response.json(
        { ok: false, code: "invalid_request" },
        { status: 400, headers: responseHeaders },
      );
    }
    const invoiceNumber = new URL(request.url).searchParams.get("invoiceNumber") ?? "";
    const session = await requirePaymentSession();
    const attempt = await createTossAttempt({ invoiceNumber, session });
    return Response.json(
      { ok: true, ...attempt },
      { status: 201, headers: responseHeaders },
    );
  } catch (error) {
    const status = error instanceof PaymentSessionError ? 401 : 409;
    return Response.json(
      { ok: false, code: status === 401 ? "session_expired" : "payment_unavailable" },
      { status, headers: responseHeaders },
    );
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 4096) throw new Error("size");
    const body = JSON.parse(raw) as { orderId?: unknown; code?: unknown };
    if (typeof body.orderId !== "string" || typeof body.code !== "string") {
      throw new Error("shape");
    }
    const session = await requirePaymentSession();
    await recordTossAttemptFailure({
      orderId: body.orderId,
      failureCode: body.code,
      session,
    });
    return Response.json({ ok: true }, { status: 200, headers: responseHeaders });
  } catch (error) {
    const status = error instanceof PaymentSessionError ? 401 : 400;
    return Response.json(
      { ok: false, code: status === 401 ? "session_expired" : "invalid_request" },
      { status, headers: responseHeaders },
    );
  }
}
