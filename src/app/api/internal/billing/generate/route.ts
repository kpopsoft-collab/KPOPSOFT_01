import {
  generateDueInvoices,
} from "../../../../../lib/billing/invoice-generator.ts";
import { createBillingGenerateHandler } from "../../../../../lib/billing/generate-route-handler.ts";
import { cleanupExpiredWidgetRateLimits } from "../../../../../lib/billing/widget/rate-limit.ts";
import {
  isBillingEnabled,
  requireCronSecret,
} from "../../../../../lib/billing/runtime.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function todayInSeoul(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export const GET = createBillingGenerateHandler({
  isBillingEnabled,
  requireCronSecret,
  generateDueInvoices,
  todayInSeoul,
  cleanupExpiredWidgetRateLimits,
});
