import { createDefaultWidgetSummaryHandler } from "../../../../../lib/billing/widget/summary.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createDefaultWidgetSummaryHandler();

export const GET = handler;
export const OPTIONS = handler;
