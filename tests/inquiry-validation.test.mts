import assert from "node:assert/strict";
import test from "node:test";

import {
  INQUIRY_LIMITS,
  validateInquiry,
} from "../src/lib/inquiries/validation.ts";

const valid = {
  type: " 프로젝트 문의 ",
  subtype: " 웹 프로젝트 ",
  sender: " KPOPSOFT ",
  contact: " hello@example.com ",
  message: " 상담을 요청합니다. ",
};

test("valid inquiry values are trimmed and returned", () => {
  assert.deepEqual(validateInquiry(valid), {
    ok: true,
    value: {
      type: "프로젝트 문의",
      subtype: "웹 프로젝트",
      sender: "KPOPSOFT",
      contact: "hello@example.com",
      message: "상담을 요청합니다.",
    },
  });
});

test("type, subtype, and message are required", () => {
  for (const field of ["type", "subtype", "message"] as const) {
    assert.equal(validateInquiry({ ...valid, [field]: " " }).ok, false, field);
  }
});

test("an entered contact must look like an email or phone number", () => {
  assert.deepEqual(validateInquiry({ ...valid, contact: "abc" }), {
    ok: false,
    error: "연락처 형식을 다시 확인해 주세요.",
  });
  assert.equal(validateInquiry({ ...valid, contact: "" }).ok, true);
  assert.equal(validateInquiry({ ...valid, contact: "02-123-4567" }).ok, true);
});

test("every public inquiry field has a hard length limit", () => {
  for (const [field, limit] of Object.entries(INQUIRY_LIMITS)) {
    const result = validateInquiry({ ...valid, [field]: "가".repeat(limit + 1) });
    assert.deepEqual(result, {
      ok: false,
      error: "입력 내용이 허용된 길이를 초과했습니다.",
    });
  }
});

test("non-string values are rejected without throwing", () => {
  assert.doesNotThrow(() =>
    validateInquiry({ ...valid, message: { injected: true } }),
  );
  assert.equal(validateInquiry({ ...valid, message: null }).ok, false);
});
