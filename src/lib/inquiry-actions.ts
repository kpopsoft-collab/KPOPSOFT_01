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
import { deliverInquiry } from "@/lib/inquiries/delivery";
import { validateInquiry } from "@/lib/inquiries/validation";

/** What the public form actually posts — `NewInquiry` plus an anti-spam honeypot. */
export type SubmitInquiryInput = NewInquiry & {
  /** Hidden field real visitors never fill. Non-empty => treat as spam. */
  honeypot?: unknown;
  startedAt?: unknown;
  submissionKey?: unknown;
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

  if (
    typeof input.submissionKey !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.submissionKey,
    )
  ) {
    return { ok: false, error: "문의 요청을 다시 시작해 주세요." };
  }

  let created;
  try {
    created = await getAdminData().createInquiry(
      validated.value,
      input.submissionKey,
    );
  } catch {
    console.error("[inquiry] createInquiry failed", { category: "storage" });
    return {
      ok: false,
      error: "문의 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  if (created.created) {
    try {
      await deliverInquiry(created.inquiry.id);
    } catch {
      console.error("[inquiry] delivery failed", {
        category: "delivery",
        id: created.inquiry.id,
      });
    }
  }

  return { ok: true };
}
