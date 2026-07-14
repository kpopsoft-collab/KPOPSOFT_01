/**
 * In-memory mock inquiries — stand-in for the DB until Supabase is wired
 * (docs/어드민기획.md §11.8). Module-level array persists across requests within
 * a running dev server, so status/memo edits stick during a session.
 *
 * Values mirror the real form options in src/lib/site.ts (`inquiryOptions`).
 */

import type { Inquiry } from "./types";

function daysAgo(n: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function deliveryFields(index: number) {
  return {
    submissionKey: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    emailStatus: "sent" as const,
    emailMessageId: `mock-email-${index}`,
    emailSentAt: daysAgo(index - 1),
    emailError: null,
    linearStatus: "created" as const,
    linearIssueId: `mock-linear-${index}`,
    linearIssueUrl: null,
    linearError: null,
  };
}

export const mockInquiries: Inquiry[] = [
  {
    id: "inq_0001",
    ...deliveryFields(1),
    type: "프로젝트 문의",
    subtype: "웹 프로젝트",
    sender: "커머스랩 / 박지훈",
    contact: "jihoon@commercelab.co.kr",
    message:
      "회사 소개 홈페이지 리뉴얼이 필요합니다. 참고 사이트는 몇 개 정리해뒀고, 9월 오픈을 목표로 하고 있습니다. 예산 범위 상담 가능할까요?",
    status: "new",
    memo: "",
    createdAt: daysAgo(0, 9),
    updatedAt: daysAgo(0, 9),
  },
  {
    id: "inq_0002",
    ...deliveryFields(2),
    type: "교육 문의",
    subtype: "Vibe Coding",
    sender: "스튜디오K / 이서연",
    contact: "010-2345-6789",
    message:
      "비개발자 팀원 6명 대상으로 AI로 직접 만들어보는 실습 교육을 찾습니다. 희망 일정은 8월 중순입니다.",
    status: "in_progress",
    memo: "1차 미팅 완료. 커리큘럼 초안 전달 예정(7/10).",
    createdAt: daysAgo(1, 14),
    updatedAt: daysAgo(0, 11),
  },
  {
    id: "inq_0003",
    ...deliveryFields(3),
    type: "AI 솔루션 문의",
    subtype: "AI 챗봇",
    sender: "핀테크컴퍼니 / 운영팀",
    contact: "ops@fintechco.io",
    message:
      "고객 문의에 답하는 AI 챗봇이 필요합니다. 참고 데이터는 FAQ와 약관 문서가 있고, 상담 인입량은 하루 300건 정도입니다.",
    status: "in_progress",
    memo: "PoC 범위 논의 중.",
    createdAt: daysAgo(3, 16),
    updatedAt: daysAgo(2, 10),
  },
  {
    id: "inq_0004",
    ...deliveryFields(4),
    type: "프로젝트 문의",
    subtype: "내부 운영 도구",
    sender: "메이커스 / 김도현",
    contact: "dohyun@makers.team",
    message:
      "지금 엑셀·수기로 처리하는 주문 관리 업무를 사내 도구로 옮기고 싶습니다. 사용 인원은 12명입니다.",
    status: "done",
    memo: "MVP 납품 완료. 유지보수 계약 검토 중.",
    createdAt: daysAgo(9, 13),
    updatedAt: daysAgo(4, 15),
  },
  {
    id: "inq_0005",
    ...deliveryFields(5),
    type: "AI 솔루션 문의",
    subtype: "AI 업무 자동화",
    sender: "제조데이터 / 안수민",
    contact: "sumin@mfgdata.kr",
    message:
      "반복되는 문서·데이터 처리를 자동화하고 싶습니다. 현재는 담당자가 매일 수작업으로 리포트를 만들고 있습니다.",
    status: "new",
    memo: "",
    createdAt: daysAgo(0, 15),
    updatedAt: daysAgo(0, 15),
  },
];
