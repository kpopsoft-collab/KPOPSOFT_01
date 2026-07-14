"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAction } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/admin-users";
import { getAdminData } from "@/lib/admin/data";
import { sendInquiryEmail } from "@/lib/integrations/cloudflare-email";
import { createLinearIssue } from "@/lib/integrations/linear";
import { deliveryPatch } from "@/lib/inquiries/delivery";

const INQUIRY_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertInquiryId(id: string): void {
  if (!INQUIRY_ID_PATTERN.test(id)) throw new Error("Invalid inquiry id");
}

export async function retryInquiryEmail(id: string): Promise<void> {
  const actor = await requireAdminAction();
  assertInquiryId(id);
  const data = getAdminData();
  const inquiry = await data.getInquiry(id);
  if (!inquiry) throw new Error("Inquiry not found");

  const attempt = await sendInquiryEmail(inquiry);
  await data.updateInquiryDelivery(id, deliveryPatch("email", attempt));
  await writeAuditLog({
    actorAdminId: actor.id,
    action: "inquiry.email_retried",
    entityType: "inquiry",
    entityId: id,
    metadata: {
      ok: attempt.ok,
      ...(!attempt.ok ? { errorCode: attempt.errorCode } : {}),
    },
  });
  revalidatePath(`/admin/inquiries/${id}`);
}

export async function retryInquiryLinear(id: string): Promise<void> {
  const actor = await requireAdminAction();
  assertInquiryId(id);
  const data = getAdminData();
  const inquiry = await data.getInquiry(id);
  if (!inquiry) throw new Error("Inquiry not found");

  const attempt = await createLinearIssue(inquiry);
  await data.updateInquiryDelivery(id, deliveryPatch("linear", attempt));
  await writeAuditLog({
    actorAdminId: actor.id,
    action: "inquiry.linear_retried",
    entityType: "inquiry",
    entityId: id,
    metadata: {
      ok: attempt.ok,
      ...(attempt.ok
        ? { skipped: attempt.skipped ?? false }
        : { errorCode: attempt.errorCode }),
    },
  });
  revalidatePath(`/admin/inquiries/${id}`);
}
