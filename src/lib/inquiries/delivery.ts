import type {
  DeliveryAttempt,
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
        linearIssueUrl: attempt.url ?? null,
        linearError: null,
      }
    : { linearStatus: "failed", linearError: attempt.errorCode };
}

async function unavailableAttempt(): Promise<DeliveryAttempt> {
  return { ok: false, errorCode: "provider_not_configured" };
}

export async function deliverInquiry(inquiryId: string): Promise<void> {
  const { getAdminData } = await import("../admin/data");
  const data = getAdminData();
  const inquiry = await data.getInquiry(inquiryId);
  if (!inquiry) throw new Error("inquiry not found");

  const attempts = await Promise.allSettled([
    unavailableAttempt(),
    unavailableAttempt(),
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
