import type { NewInquiry } from "../admin/types";

export const INQUIRY_LIMITS = {
  type: 80,
  subtype: 120,
  sender: 120,
  contact: 254,
  message: 5_000,
} as const satisfies Record<keyof NewInquiry, number>;

type InquiryCandidate = Partial<Record<keyof NewInquiry, unknown>>;

export type InquiryValidationResult =
  | { ok: true; value: NewInquiry }
  | { ok: false; error: string };

function trimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isPlausibleContact(value: string): boolean {
  if (value.includes("@")) return value.length >= 5;
  return value.replace(/\D/g, "").length >= 7;
}

export function validateInquiry(
  input: InquiryCandidate,
): InquiryValidationResult {
  const value: NewInquiry = {
    type: trimmedString(input.type),
    subtype: trimmedString(input.subtype),
    sender: trimmedString(input.sender),
    contact: trimmedString(input.contact),
    message: trimmedString(input.message),
  };

  for (const field of Object.keys(INQUIRY_LIMITS) as (keyof NewInquiry)[]) {
    if (value[field].length > INQUIRY_LIMITS[field]) {
      return {
        ok: false,
        error: "입력 내용이 허용된 길이를 초과했습니다.",
      };
    }
  }

  if (!value.type || !value.subtype || !value.message) {
    return {
      ok: false,
      error: "유형, 세부 유형, 문의 내용을 입력해 주세요.",
    };
  }

  if (value.contact && !isPlausibleContact(value.contact)) {
    return { ok: false, error: "연락처 형식을 다시 확인해 주세요." };
  }

  return { ok: true, value };
}
