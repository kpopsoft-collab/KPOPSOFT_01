import "server-only";

/**
 * Admin email-notification seam (docs/어드민기획.md §7, §8, §11.8).
 *
 * `submitInquiry` (src/lib/inquiry-actions.ts) calls this right after a new
 * inquiry is persisted. Sends a "new inquiry" email via Resend to the
 * operations mailbox (`kpopsoft@gmail.com` by default).
 *
 * Degrades gracefully: with no `RESEND_API_KEY` (e.g. local dev) it just logs,
 * so submission never fails for want of email config. Callers treat this as
 * best-effort — a throw here never rolls back the saved inquiry.
 *
 * Env:
 *   RESEND_API_KEY   — server-only. Absent → log-only.
 *   RESEND_FROM      — verified sender, e.g. "KPOPSOFT <noreply@your-domain>".
 *                      Defaults to Resend's shared onboarding sender.
 *   INQUIRY_NOTIFY_TO — optional comma-separated override for recipients.
 */

import { Resend } from "resend";

import type { Inquiry } from "@/lib/admin/types";
import { buildInquiryEmail } from "@/lib/inquiries/email-message";

const FROM = process.env.RESEND_FROM ?? "KPOPSOFT <onboarding@resend.dev>";

/** Recipients: explicit env override, else the requested operations mailbox. */
function resolveRecipients(): string[] {
  return (process.env.INQUIRY_NOTIFY_TO ?? "kpopsoft@gmail.com")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function notifyNewInquiry(inquiry: Inquiry): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info("[email] 새 문의 알림 (로그 전용 — RESEND_API_KEY 미설정)", {
      id: inquiry.id,
      type: inquiry.type,
      subtype: inquiry.subtype,
      createdAt: inquiry.createdAt,
    });
    return;
  }

  const to = resolveRecipients();
  if (to.length === 0) {
    console.warn("[email] 수신 관리자 주소가 없어 발송을 건너뜁니다", {
      id: inquiry.id,
    });
    return;
  }

  const resend = new Resend(apiKey);
  const { subject, text, replyTo, idempotencyKey } =
    buildInquiryEmail(inquiry);
  const { error } = await resend.emails.send(
    {
      from: FROM,
      to,
      subject,
      text,
      ...(replyTo ? { replyTo } : {}),
    },
    { idempotencyKey },
  );
  if (error) {
    // Surface to the caller's best-effort try/catch; never blocks the save.
    throw new Error(`resend send failed: ${error.message}`);
  }
}
