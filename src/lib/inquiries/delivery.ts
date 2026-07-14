import type {
  DeliveryAttempt,
  Inquiry,
  InquiryDeliveryPatch,
} from "../admin/types";

export function deliveryPatch(
  channel: "email" | "linear",
  attempt: DeliveryAttempt,
): InquiryDeliveryPatch {
  if (channel === "email") {
    return attempt.ok
      ? {
          emailStatus: "sent",
          emailMessageId: attempt.externalId,
          emailError: null,
        }
      : { emailStatus: "failed", emailError: attempt.errorCode };
  }

  return attempt.ok
    ? {
        linearStatus: "created",
        linearIssueId: attempt.externalId,
        ...(attempt.url !== undefined
          ? { linearIssueUrl: attempt.url }
          : {}),
        linearError: null,
      }
    : { linearStatus: "failed", linearError: attempt.errorCode };
}

async function emailAttempt(
  inquiry: Inquiry | null,
): Promise<DeliveryAttempt> {
  if (!inquiry) return { ok: false, errorCode: "not_found" };
  const { sendInquiryEmail } = await import("../integrations/cloudflare-email");
  return sendInquiryEmail(inquiry);
}

async function linearAttempt(inquiry: Inquiry): Promise<DeliveryAttempt> {
  const { createLinearIssue } = await import("../integrations/linear");
  return createLinearIssue(inquiry);
}

export async function deliverInquiry(inquiryId: string): Promise<void> {
  const { getAdminData } = await import("../admin/data");
  const data = getAdminData();
  const inquiry = await data.getInquiry(inquiryId);
  if (!inquiry) throw new Error("inquiry not found");

  const attempts = await Promise.allSettled([
    emailAttempt(inquiry),
    linearAttempt(inquiry),
  ]);
  const channels = ["email", "linear"] as const;

  await Promise.allSettled(
    attempts.map((result, index) => {
      const attempt: DeliveryAttempt =
        result.status === "fulfilled"
          ? result.value
          : { ok: false, errorCode: "provider_error" };
      return data.updateInquiryDelivery(
        inquiry.id,
        deliveryPatch(channels[index], attempt),
      );
    }),
  );
}
