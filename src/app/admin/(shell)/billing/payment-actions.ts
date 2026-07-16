"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  BillingReauthenticationRequiredError,
  requireRecentBillingAuth,
} from "@/lib/billing/permissions";
import { requestTossRefund } from "@/lib/billing/payments/refunds";
import type { RefundStatus } from "@/lib/billing/payments/types";

function handleReauthentication(error: unknown): never {
  if (error instanceof BillingReauthenticationRequiredError) {
    redirect(error.redirectTo);
  }
  throw error;
}

export async function requestBillingTossRefund(input: {
  paymentId: string;
  amount: number;
  reason: string;
}): Promise<{ refundId: string; status: RefundStatus }> {
  let actor;
  try {
    actor = await requireRecentBillingAuth("BILLING_REFUND");
  } catch (error) {
    handleReauthentication(error);
  }
  const result = await requestTossRefund(actor.id, input);
  revalidatePath(`/admin/billing/payments/${input.paymentId}`);
  revalidatePath("/admin/billing/payments");
  return result;
}
