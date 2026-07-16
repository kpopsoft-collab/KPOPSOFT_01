import "server-only";

import { notFound } from "next/navigation";

import { requireBillingPermission, type BillingAdminIdentity } from "./permissions";

export async function requireBillingPageView(): Promise<BillingAdminIdentity> {
  try {
    return await requireBillingPermission("BILLING_VIEW");
  } catch {
    notFound();
  }
}
