import { handleTossWebhook } from "@/lib/billing/payments/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
};

function isHttps(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return (forwarded || new URL(request.url).protocol.replace(":", "")) === "https";
}

export async function POST(request: Request): Promise<Response> {
  if (!isHttps(request)) {
    return Response.json({ ok: false, code: "https_required" }, { status: 400, headers });
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return Response.json({ ok: false, code: "invalid_content_type" }, { status: 415, headers });
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isSafeInteger(declared) || declared > 64 * 1024) {
    return Response.json({ ok: false, code: "payload_too_large" }, { status: 413, headers });
  }
  const transmissionId =
    request.headers.get("tosspayments-webhook-transmission-id") ?? "";
  try {
    const rawPayload = await request.text();
    if (Buffer.byteLength(rawPayload, "utf8") > 64 * 1024) {
      return Response.json({ ok: false, code: "payload_too_large" }, { status: 413, headers });
    }
    const result = await handleTossWebhook({ transmissionId, rawPayload });
    return Response.json(
      { ok: result !== "RETRY", status: result },
      { status: result === "RETRY" ? 503 : 200, headers },
    );
  } catch {
    return Response.json({ ok: false, code: "invalid_webhook" }, { status: 400, headers });
  }
}
