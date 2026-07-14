import assert from "node:assert/strict";
import test from "node:test";

import {
  toInquiry,
  toInquiryTypeOption,
  toWorkItem,
} from "../src/lib/admin/neon-mappers.ts";

test("Neon inquiry rows map dates and domain fields without leaking DB names", () => {
  const createdAt = new Date("2026-07-14T00:00:00.000Z");
  const updatedAt = new Date("2026-07-14T01:00:00.000Z");
  assert.deepEqual(
    toInquiry({
      id: "inquiry-1",
      submissionKey: "submission-1",
      type: "교육 문의",
      subtype: "바이브 코딩",
      sender: "홍길동",
      contact: "hello@example.com",
      message: "문의합니다",
      status: "new",
      memo: "",
      emailStatus: "pending",
      emailMessageId: null,
      emailSentAt: null,
      emailError: null,
      linearStatus: "pending",
      linearIssueId: null,
      linearIssueUrl: null,
      linearError: null,
      createdAt,
      updatedAt,
    }),
    {
      id: "inquiry-1",
      submissionKey: "submission-1",
      type: "교육 문의",
      subtype: "바이브 코딩",
      sender: "홍길동",
      contact: "hello@example.com",
      message: "문의합니다",
      status: "new",
      memo: "",
      emailStatus: "pending",
      emailMessageId: null,
      emailSentAt: null,
      emailError: null,
      linearStatus: "pending",
      linearIssueId: null,
      linearIssueUrl: null,
      linearError: null,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    },
  );
});

test("Neon content mapping omits a null optional image", () => {
  assert.deepEqual(
    toWorkItem({
      id: "work-1",
      sortOrder: 0,
      isPublished: true,
      client: "고객",
      title: "프로젝트",
      category: "Web",
      accent: "blue",
      summary: "요약",
      challenge: "문제",
      solution: "해결",
      results: ["성과"],
      imageUrl: null,
    }),
    {
      id: "work-1",
      sortOrder: 0,
      isPublished: true,
      client: "고객",
      title: "프로젝트",
      category: "Web",
      accent: "blue",
      summary: "요약",
      challenge: "문제",
      solution: "해결",
      results: ["성과"],
    },
  );
});

test("Neon inquiry options keep active state and ordered placeholders", () => {
  assert.deepEqual(
    toInquiryTypeOption(
      {
        id: "type-1",
        label: "교육 문의",
        sortOrder: 0,
        isActive: true,
      },
      [
        {
          id: "sub-2",
          typeId: "type-1",
          label: "업무용 AI",
          placeholder: "두 번째",
          sortOrder: 1,
          isActive: true,
        },
        {
          id: "sub-1",
          typeId: "type-1",
          label: "AI 기초교육",
          placeholder: "첫 번째",
          sortOrder: 0,
          isActive: true,
        },
      ],
    ),
    {
      id: "type-1",
      label: "교육 문의",
      sortOrder: 0,
      isActive: true,
      subtypes: [
        {
          id: "sub-1",
          label: "AI 기초교육",
          placeholder: "첫 번째",
          sortOrder: 0,
          isActive: true,
        },
        {
          id: "sub-2",
          label: "업무용 AI",
          placeholder: "두 번째",
          sortOrder: 1,
          isActive: true,
        },
      ],
    },
  );
});
