import { createDefaultPayStartHandler } from "@/lib/billing/widget/handoffs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await context.params;
  return createDefaultPayStartHandler()(request, token);
}
