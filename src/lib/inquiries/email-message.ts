import type { Inquiry } from "../admin/types";

export type InquiryEmailMessage = {
  subject: string;
  text: string;
  replyTo?: string;
  idempotencyKey: string;
};

function withoutTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function buildInquiryEmail(
  inquiry: Inquiry,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kpopsoft.com",
): InquiryEmailMessage {
  const detailUrl = `${withoutTrailingSlash(siteUrl)}/admin/inquiries/${inquiry.id}`;
  const text = [
    `유형: ${inquiry.type} / ${inquiry.subtype}`,
    `보낸 사람: ${inquiry.sender || "(미기재)"}`,
    `연락처: ${inquiry.contact || "(미기재)"}`,
    `접수 시각: ${inquiry.createdAt}`,
    `문의 관리: ${detailUrl}`,
    "",
    "문의 내용:",
    inquiry.message,
  ].join("\n");

  return {
    subject: `[KPOPSOFT] 새 문의: ${inquiry.type} · ${inquiry.subtype}`,
    text,
    ...(isEmail(inquiry.contact) ? { replyTo: inquiry.contact } : {}),
    idempotencyKey: `inquiry-${inquiry.id}`,
  };
}
