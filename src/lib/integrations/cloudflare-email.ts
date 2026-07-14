import type { DeliveryAttempt, Inquiry } from "../admin/types";
import { buildInquiryEmail } from "../inquiries/email-message.ts";

type CloudflareEmailResponse = {
  message_id: string;
  delivered: string[];
  queued: string[];
  permanent_bounces: string[];
};

export function mapCloudflareEmailResponse(
  response: CloudflareEmailResponse,
): DeliveryAttempt {
  if (response.delivered.length > 0) {
    return { ok: true, externalId: response.message_id };
  }
  if (response.permanent_bounces.length > 0) {
    return { ok: false, errorCode: "permanent_bounce" };
  }
  if (response.queued.length > 0) {
    return { ok: false, errorCode: "queued" };
  }
  return { ok: false, errorCode: "provider_error" };
}

function providerErrorCode(error: unknown): string {
  const status =
    typeof error === "object" && error && "status" in error
      ? Number(error.status)
      : 0;
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 429) return "throttled";
  return "provider_error";
}

export async function sendInquiryEmail(
  inquiry: Inquiry,
): Promise<DeliveryAttempt> {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const from = process.env.INQUIRY_NOTIFICATION_FROM?.trim();
  const to = (process.env.INQUIRY_NOTIFICATION_TO ?? "kpopsoft@gmail.com")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  if (!apiToken || !accountId || !from || to.length === 0) {
    return { ok: false, errorCode: "configuration_error" };
  }

  const { default: Cloudflare } = await import("cloudflare");
  const client = new Cloudflare({ apiToken });
  const { subject, text, html, replyTo } = buildInquiryEmail(inquiry);

  try {
    const response = await client.emailSending.send({
      account_id: accountId,
      from,
      to,
      subject,
      text,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    });
    return mapCloudflareEmailResponse(response);
  } catch (error) {
    return { ok: false, errorCode: providerErrorCode(error) };
  }
}
