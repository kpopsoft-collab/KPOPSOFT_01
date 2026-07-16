import { createDefaultWidgetHandoffHandler } from "../../../../../lib/billing/widget/handoffs.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createDefaultWidgetHandoffHandler();

export const POST = handler;
export const OPTIONS = handler;
