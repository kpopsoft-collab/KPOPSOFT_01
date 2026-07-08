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

/** What the public form actually posts — `NewInquiry` plus an anti-spam honeypot. */
export type SubmitInquiryInput = NewInquiry & {
  /** Hidden field real visitors never fill. Non-empty => treat as spam. */
  honeypot?: string;
};

export type SubmitInquiryResult = { ok: true } | { ok: false; error: string };

function isBlank(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Loose contact check: an email needs an "@", a phone number needs enough
 * digits. Not a hard gate — just catches empty-ish junk, per the "느슨히"
 * requirement in docs/어드민기획.md §7.
 */
function isPlausibleContact(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return trimmed.length >= 5;
  return trimmed.replace(/\D/g, "").length >= 7;
}

export async function submitInquiry(
  input: SubmitInquiryInput,
): Promise<SubmitInquiryResult> {
  // Honeypot filled -> silently succeed without saving anything (docs §7).
  if (!isBlank(input.honeypot)) {
    return { ok: true };
  }

  if (isBlank(input.type) || isBlank(input.subtype) || isBlank(input.message)) {
    return { ok: false, error: "유형, 세부 유형, 문의 내용을 입력해 주세요." };
  }

  if (!isBlank(input.contact) && !isPlausibleContact(input.contact)) {
    return { ok: false, error: "연락처 형식을 다시 확인해 주세요." };
  }

  let created;
  try {
    created = await getAdminData().createInquiry({
      type: input.type,
      subtype: input.subtype,
      sender: input.sender.trim(),
      contact: input.contact.trim(),
      message: input.message.trim(),
    });
  } catch (error) {
    console.error("[inquiry] createInquiry failed", error);
    return {
      ok: false,
      error: "문의 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  // Notification is best-effort — a failure here must not undo the save.
  try {
    await notifyNewInquiry(created);
  } catch (error) {
    console.error("[inquiry] notifyNewInquiry failed", error);
  }

  return { ok: true };
}
