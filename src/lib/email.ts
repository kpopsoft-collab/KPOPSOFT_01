/**
 * Admin email-notification seam (docs/어드민기획.md §7, §8, §11.8).
 *
 * `submitInquiry` (src/lib/inquiry-actions.ts) calls this right after a new
 * inquiry is persisted. Today it only logs — no real mail is sent — but the
 * signature is the one wiring day will keep, so callers never change.
 *
 * TODO(wiring day): send via Resend (`RESEND_API_KEY`, server-only env).
 * Recipients should come from `admin_users` (or a settings value) rather than
 * a hardcoded address — see docs/어드민기획.md §9 결정 9 / 남은 이슈.
 */

import type { Inquiry } from "@/lib/admin/types";

export async function notifyNewInquiry(inquiry: Inquiry): Promise<void> {
  console.info("[email] 새 문의 알림", {
    id: inquiry.id,
    type: inquiry.type,
    subtype: inquiry.subtype,
    sender: inquiry.sender,
    contact: inquiry.contact,
    createdAt: inquiry.createdAt,
  });
}
