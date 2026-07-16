import {
  createPaymentSessionCookie,
  requirePaymentSession,
  serializePaymentSessionCookie,
} from "../../../../lib/billing/widget/payment-session.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const headers = new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
  });
  try {
    const claims = await requirePaymentSession();
    const cookie = createPaymentSessionCookie(claims);
    headers.set("Set-Cookie", serializePaymentSessionCookie(cookie));
    return Response.json(
      {
        ok: true,
        expiresAt: claims.expiresAt,
        absoluteExpiresAt: claims.absoluteExpiresAt,
      },
      { status: 200, headers },
    );
  } catch {
    return Response.json(
      { ok: false, code: "session_expired" },
      { status: 401, headers },
    );
  }
}
