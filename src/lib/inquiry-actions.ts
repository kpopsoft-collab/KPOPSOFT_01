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

/**
 * What the public form actually posts (수정 요청서 §15).
 *
 * 폼이 받는 항목이 늘었지만 `inquiries` 테이블 스키마는 그대로 둔다 —
 * 이번 작업은 홈 개편이지 어드민 개편이 아니고, 컬럼을 늘리면 어드민 목록·
 * 상세·필터까지 함께 손봐야 하기 때문이다. 대신 아래 규칙으로 기존 두 칸에
 * 정리해 담는다.
 *  - `contact` ← 이메일(필수). 연락처를 적었으면 ` / `로 이어 붙인다.
 *  - `message` ← 프로젝트 내용 + 예상 일정·예산을 끝에 한 블록으로 덧붙인다.
 * 어드민에서 문의를 열면 두 값이 모두 보인다.
 */
export type SubmitInquiryInput = Omit<NewInquiry, "contact"> & {
  /** 필수 — 회신용 이메일. */
  email: string;
  /** 선택 — 전화번호 등. */
  phone?: string;
  /** 선택 — 예상 일정. */
  schedule?: string;
  /** 선택 — 예상 예산. */
  budget?: string;
  /** Hidden field real visitors never fill. Non-empty => treat as spam. */
  honeypot?: string;
};

/** 이메일은 형식까지 검증한다(§15) — 회신이 불가능하면 문의가 무의미하다. */
function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** 선택 항목을 본문 뒤에 붙일 한 블록으로 정리한다. 빈 값은 줄 자체를 뺀다. */
function composeMessage(input: SubmitInquiryInput): string {
  const extras = [
    ["예상 일정", input.schedule],
    ["예상 예산", input.budget],
  ].filter(([, value]) => !isBlank(value as string));

  const body = input.message.trim();
  if (extras.length === 0) return body;

  const block = extras
    .map(([label, value]) => `- ${label}: ${(value as string).trim()}`)
    .join("\n");
  return `${body}\n\n${block}`;
}

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

  /*
   * 필수 항목 (수정 요청서 §15) — 문의 분야, 이름 또는 회사명, 이메일,
   * 프로젝트 내용. `subtype`(세부 유형)은 요청서의 필수 목록에 없어서 선택으로
   * 둔다 — 분야만 고르고 바로 보낼 수 있어야 한다.
   */
  if (
    isBlank(input.type) ||
    isBlank(input.sender) ||
    isBlank(input.email) ||
    isBlank(input.message)
  ) {
    return {
      ok: false,
      error: "문의 분야, 이름/회사명, 이메일, 프로젝트 내용을 입력해 주세요.",
    };
  }

  if (!isValidEmail(input.email)) {
    return { ok: false, error: "이메일 형식을 다시 확인해 주세요." };
  }

  if (input.phone && !isBlank(input.phone) && !isPlausibleContact(input.phone)) {
    return { ok: false, error: "연락처 형식을 다시 확인해 주세요." };
  }

  let created;
  try {
    const phone = input.phone?.trim();
    created = await getAdminData().createInquiry({
      type: input.type,
      subtype: input.subtype,
      sender: input.sender.trim(),
      contact: phone
        ? `${input.email.trim()} / ${phone}`
        : input.email.trim(),
      message: composeMessage(input),
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
