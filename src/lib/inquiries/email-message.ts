import type { Inquiry } from "../admin/types";

export type InquiryEmailMessage = {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  idempotencyKey: string;
};

function withoutTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
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
  const html = `
    <h1>새 문의가 접수되었습니다.</h1>
    <dl>
      <dt>유형</dt><dd>${escapeHtml(inquiry.type)} / ${escapeHtml(inquiry.subtype)}</dd>
      <dt>보낸 사람</dt><dd>${escapeHtml(inquiry.sender || "(미기재)")}</dd>
      <dt>연락처</dt><dd>${escapeHtml(inquiry.contact || "(미기재)")}</dd>
      <dt>접수 시각</dt><dd>${escapeHtml(inquiry.createdAt)}</dd>
    </dl>
    <h2>문의 내용</h2>
    <p style="white-space:pre-wrap">${escapeHtml(inquiry.message)}</p>
    <p><a href="${escapeHtml(detailUrl)}">관리자 페이지에서 확인하기</a></p>
  `.trim();

  return {
    subject: `[KPOPSOFT] 새 문의: ${inquiry.type} · ${inquiry.subtype}`,
    text,
    html,
    ...(isEmail(inquiry.contact) ? { replyTo: inquiry.contact } : {}),
    idempotencyKey: `inquiry-${inquiry.id}`,
  };
}
