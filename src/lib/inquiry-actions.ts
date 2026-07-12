"use server";

/**
 * Public contact-form Server Action (docs/어드민기획.md §7, §11.8).
 *
 * Replaces the old `mailto:` submission: validates the payload, persists it
 * through the admin data seam (`getAdminData().createInquiry`), then fires an
 * admin notification (best-effort — a failed notification never fails the
 * user-facing submission). Both `getAdminData()` and `notifyNewInquiry()` are
 * seams; today they're mock/stub, and wiring day swaps their internals only.
 */

import { getAdminData } from "@/lib/admin/data";
import type { NewInquiry } from "@/lib/admin/types";
import { notifyNewInquiry } from "@/lib/email";
import { validateInquiry } from "@/lib/inquiries/validation";

/** What the public form actually posts — `NewInquiry` plus an anti-spam honeypot. */
export type SubmitInquiryInput = NewInquiry & {
  /** Hidden field real visitors never fill. Non-empty => treat as spam. */
  honeypot?: unknown;
};

export type SubmitInquiryResult = { ok: true } | { ok: false; error: string };

export async function submitInquiry(
  input: SubmitInquiryInput,
): Promise<SubmitInquiryResult> {
  // Honeypot filled -> silently succeed without saving anything (docs §7).
  const honeypotFilled =
    typeof input.honeypot === "string"
      ? input.honeypot.trim().length > 0
      : input.honeypot != null;
  if (honeypotFilled) {
    return { ok: true };
  }

  const validated = validateInquiry(input);
  if (!validated.ok) return validated;

  let created;
  try {
    created = await getAdminData().createInquiry(validated.value);
  } catch {
    console.error("[inquiry] createInquiry failed", { category: "storage" });
    return {
      ok: false,
      error: "문의 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  // Notification is best-effort — a failure here must not undo the save.
  try {
    await notifyNewInquiry(created);
  } catch {
    console.error("[inquiry] notifyNewInquiry failed", {
      category: "notification",
      id: created.id,
    });
  }

  return { ok: true };
}
