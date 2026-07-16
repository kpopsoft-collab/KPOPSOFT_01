"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  changeContractStatus,
  createCustomerWithSite,
  saveContract,
  type ContractInput,
  type CustomerWithSiteInput,
} from "@/lib/billing/contracts";
import {
  approveInvoice,
  retryInvoiceDelivery,
  updateDraftInvoice,
  voidInvoice,
  type DraftInvoiceInput,
} from "@/lib/billing/invoices";
import {
  BillingReauthenticationRequiredError,
  requireBillingPermission,
  requireRecentBillingAuth,
} from "@/lib/billing/permissions";
import type { ContractStatus } from "@/lib/billing/types";

const BILLING_ROOT = "/admin/billing";

function revalidateBilling(): void {
  revalidatePath(BILLING_ROOT, "layout");
}

function handleReauthentication(error: unknown): never {
  if (error instanceof BillingReauthenticationRequiredError) {
    redirect(error.redirectTo);
  }
  throw error;
}

export async function createBillingCustomer(
  input: CustomerWithSiteInput,
): Promise<void> {
  const actor = await requireBillingPermission("BILLING_EDIT");
  const id = await createCustomerWithSite(actor.id, input);
  revalidateBilling();
  redirect(`${BILLING_ROOT}/customers/${id}`);
}

export async function saveBillingContract(
  input: ContractInput,
): Promise<void> {
  const actor = await requireBillingPermission("BILLING_EDIT");
  const id = await saveContract(actor.id, input);
  revalidateBilling();
  redirect(`${BILLING_ROOT}/contracts/${id}`);
}

export async function changeBillingContractState(
  id: string,
  status: ContractStatus,
): Promise<void> {
  const actor = await requireBillingPermission("BILLING_EDIT");
  await changeContractStatus(actor.id, id, status);
  revalidateBilling();
}

export async function updateBillingInvoiceDraft(
  invoiceId: string,
  input: DraftInvoiceInput,
): Promise<void> {
  const actor = await requireBillingPermission("BILLING_EDIT");
  await updateDraftInvoice(actor.id, invoiceId, input);
  revalidateBilling();
}

export async function approveBillingInvoice(invoiceId: string): Promise<void> {
  let actor;
  try {
    actor = await requireRecentBillingAuth("BILLING_APPROVE");
  } catch (error) {
    handleReauthentication(error);
  }
  await approveInvoice(actor.id, invoiceId);
  revalidateBilling();
}

export async function voidBillingInvoice(
  invoiceId: string,
  reason: string,
): Promise<void> {
  let actor;
  try {
    actor = await requireRecentBillingAuth("BILLING_APPROVE");
  } catch (error) {
    handleReauthentication(error);
  }
  await voidInvoice(actor.id, invoiceId, reason);
  revalidateBilling();
}

export async function retryBillingInvoiceDelivery(
  deliveryId: string,
): Promise<void> {
  const actor = await requireBillingPermission("BILLING_EDIT");
  await retryInvoiceDelivery(actor.id, deliveryId);
  revalidateBilling();
}
