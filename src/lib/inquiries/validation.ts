import type { NewInquiry } from "../admin/types";
import { z } from "zod";

export const INQUIRY_LIMITS = {
  type: 80,
  subtype: 120,
  sender: 120,
  contact: 254,
  message: 5_000,
} as const satisfies Record<keyof NewInquiry, number>;

type InquiryCandidate = Partial<Record<keyof NewInquiry | "startedAt", unknown>>;

export type InquiryValidationResult =
  | { ok: true; value: NewInquiry }
  | { ok: false; error: string };

function isPlausibleContact(value: string): boolean {
  if (value.includes("@")) return z.string().email().safeParse(value).success;
  return value.replace(/\D/g, "").length >= 7;
}

const inquirySchema = z.object({
  type: z.string().trim().min(1).max(INQUIRY_LIMITS.type),
  subtype: z.string().trim().min(1).max(INQUIRY_LIMITS.subtype),
  sender: z.string().trim().max(INQUIRY_LIMITS.sender),
  contact: z
    .string()
    .trim()
    .max(INQUIRY_LIMITS.contact)
    .refine((value) => !value || isPlausibleContact(value)),
  message: z.string().trim().min(1).max(INQUIRY_LIMITS.message),
  startedAt: z.number().finite(),
});

export function validateInquiry(
  input: InquiryCandidate,
  now = Date.now(),
): InquiryValidationResult {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues;
    if (issues.some((issue) => issue.code === "too_big")) {
      return { ok: false, error: "입력 내용이 허용된 길이를 초과했습니다." };
    }
    if (issues.some((issue) => issue.path[0] === "contact")) {
      return { ok: false, error: "연락처 형식을 다시 확인해 주세요." };
    }
    return {
      ok: false,
      error: "유형, 세부 유형, 문의 내용을 입력해 주세요.",
    };
  }
  if (now - parsed.data.startedAt < 800) {
    return { ok: false, error: "잠시 후 다시 시도해 주세요." };
  }
  const { startedAt: _startedAt, ...value } = parsed.data;
  void _startedAt;
  return { ok: true, value };
}
