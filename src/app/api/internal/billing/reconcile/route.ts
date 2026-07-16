import { reconcileBillingPayments } from "@/lib/billing/payments/reconcile";
import { isBillingEnabled, requireCronSecret } from "@/lib/billing/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request): Promise<Response> {
  if (!isBillingEnabled()) {
    return Response.json({ ok: false, code: "billing_disabled" }, { status: 503, headers });
  }
  try {
    requireCronSecret(request);
  } catch {
    return Response.json({ ok: false, code: "unauthorized" }, { status: 401, headers });
  }
  try {
    const result = await reconcileBillingPayments();
    return Response.json({ ok: true, ...result }, { status: 200, headers });
  } catch {
    return Response.json({ ok: false, code: "reconciliation_failed" }, { status: 500, headers });
  }
}
