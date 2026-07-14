import assert from "node:assert/strict";
import test from "node:test";

import { buildInquiryEmail } from "../src/lib/inquiries/email-message.ts";

const inquiry = {
  id: "11111111-2222-3333-4444-555555555555",
  submissionKey: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  type: "교육 문의",
  subtype: "기업 교육",
  sender: "KPOPSOFT",
  contact: "hello@example.com",
  message: "교육 일정과 견적을 요청합니다.",
  status: "new" as const,
  memo: "",
  emailStatus: "pending" as const,
  emailMessageId: null,
  emailSentAt: null,
  emailError: null,
  linearStatus: "pending" as const,
  linearIssueId: null,
  linearIssueUrl: null,
  linearError: null,
  createdAt: "2026-07-12T06:00:00.000Z",
  updatedAt: "2026-07-12T06:00:00.000Z",
};

test("inquiry email includes a stable subject, detail URL, and idempotency key", () => {
  const message = buildInquiryEmail(inquiry, "https://kpopsoft.com/");

  assert.equal(message.subject, "[KPOPSOFT] 새 문의: 교육 문의 · 기업 교육");
  assert.match(
    message.text,
    /https:\/\/kpopsoft\.com\/admin\/inquiries\/11111111-2222-3333-4444-555555555555/,
  );
  assert.equal(message.replyTo, "hello@example.com");
  assert.equal(
    message.idempotencyKey,
    "inquiry-11111111-2222-3333-4444-555555555555",
  );
});

test("phone contacts are included in the body but never used as Reply-To", () => {
  const message = buildInquiryEmail(
    { ...inquiry, contact: "010-1234-5678" },
    "https://kpopsoft.com",
  );

  assert.match(message.text, /연락처: 010-1234-5678/);
  assert.equal(message.replyTo, undefined);
});
