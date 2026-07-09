import "server-only";

/**
 * Admin email-notification seam (docs/어드민기획.md §7, §8, §11.8).
 *
 * `submitInquiry` (src/lib/inquiry-actions.ts) calls this right after a new
 * inquiry is persisted. Sends a "new inquiry" email via Resend to every
 * admin (recipients pulled from `admin_users`, per §9 결정 9).
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
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const FROM = process.env.RESEND_FROM ?? "KPOPSOFT <onboarding@resend.dev>";

/** Recipients: explicit env override, else every admin_users email. */
async function resolveRecipients(): Promise<string[]> {
  const override = process.env.INQUIRY_NOTIFY_TO;
  if (override) {
    return override
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  try {
    const db = createSupabaseAdminClient();
    const { data } = await db.from("admin_users").select("email");
    return (data ?? []).map((r) => r.email as string).filter(Boolean);
  } catch {
    return [];
  }
}

function renderBody(inquiry: Inquiry): string {
  const lines = [
    `유형: ${inquiry.type} / ${inquiry.subtype}`,
    `보낸 사람: ${inquiry.sender || "(미기재)"}`,
    `연락처: ${inquiry.contact || "(미기재)"}`,
    `접수 시각: ${inquiry.createdAt}`,
    "",
    "문의 내용:",
    inquiry.message,
  ];
  return lines.join("\n");
}

export async function notifyNewInquiry(inquiry: Inquiry): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info("[email] 새 문의 알림 (로그 전용 — RESEND_API_KEY 미설정)", {
      id: inquiry.id,
      type: inquiry.type,
      subtype: inquiry.subtype,
      sender: inquiry.sender,
      contact: inquiry.contact,
      createdAt: inquiry.createdAt,
    });
    return;
  }

  const to = await resolveRecipients();
  if (to.length === 0) {
    console.warn("[email] 수신 관리자 주소가 없어 발송을 건너뜁니다", {
      id: inquiry.id,
    });
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `[KPOPSOFT] 새 문의: ${inquiry.type} · ${inquiry.subtype}`,
    text: renderBody(inquiry),
    ...(inquiry.contact.includes("@")
      ? { replyTo: inquiry.contact }
      : {}),
  });
  if (error) {
    // Surface to the caller's best-effort try/catch; never blocks the save.
    throw new Error(`resend send failed: ${error.message}`);
  }
}
