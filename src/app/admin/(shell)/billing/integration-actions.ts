"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createWidgetIntegration as createWidgetIntegrationCredential,
  rotateWidgetIntegration as rotateWidgetIntegrationCredential,
  setWidgetIntegrationEnabled as setWidgetIntegrationCredentialEnabled,
} from "@/lib/billing/widget/integrations";
import {
  BillingReauthenticationRequiredError,
  requireRecentBillingAuth,
} from "@/lib/billing/permissions";

export type WidgetCredentialActionState =
  | {
      ok: true;
      publicId?: string;
      secret?: string;
      keyVersion?: number;
    }
  | { ok: false; error: string };

function revalidateIntegrations(): void {
  revalidatePath("/admin/billing/integrations", "layout");
}

function handleReauthentication(error: unknown): never {
  if (error instanceof BillingReauthenticationRequiredError) {
    redirect(error.redirectTo);
  }
  throw error;
}

export async function createWidgetIntegration(
  siteId: string,
  allowedOrigin: string,
): Promise<WidgetCredentialActionState> {
  let actor;
  try {
    actor = await requireRecentBillingAuth("BILLING_ADMIN");
  } catch (error) {
    handleReauthentication(error);
  }
  const result = await createWidgetIntegrationCredential(
    actor.id,
    siteId,
    allowedOrigin,
  );
  revalidateIntegrations();
  return { ok: true, ...result, keyVersion: 1 };
}

export async function rotateWidgetIntegration(
  integrationId: string,
): Promise<WidgetCredentialActionState> {
  let actor;
  try {
    actor = await requireRecentBillingAuth("BILLING_ADMIN");
  } catch (error) {
    handleReauthentication(error);
  }
  const result = await rotateWidgetIntegrationCredential(
    actor.id,
    integrationId,
  );
  revalidateIntegrations();
  return { ok: true, ...result };
}

export async function setWidgetIntegrationEnabled(
  integrationId: string,
  enabled: boolean,
): Promise<WidgetCredentialActionState> {
  let actor;
  try {
    actor = await requireRecentBillingAuth("BILLING_ADMIN");
  } catch (error) {
    handleReauthentication(error);
  }
  await setWidgetIntegrationCredentialEnabled(
    actor.id,
    integrationId,
    enabled,
  );
  revalidateIntegrations();
  return { ok: true };
}
