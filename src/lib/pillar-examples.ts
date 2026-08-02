/**
 * What We Do 카드에서 여는 "예시 사례" 슬라이드 데이터.
 *
 * 실제 제작 사례가 있는 유형은 그 사례를 그대로 쓰고(`client` 표기), 아직
 * 없는 유형은 "이런 걸 만듭니다" 수준의 예시로 둔다. 예시에는 회사명이나 성과
 * 수치를 넣지 않는다 — 지어낸 레퍼런스가 되기 때문이다. 화면에서도 실제 사례와
 * 예시를 배지로 구분해 보여준다.
 *
 * `name`은 카드 하단 태그 문자열과 정확히 같게 유지한다. 카드에서 본 단어와
 * 모달에서 보는 제목이 다르면 같은 대상이라는 걸 알아채기 어렵다.
 */

import type { Accent } from "@/lib/site";

export type PillarExample = {
  id: string;
  /** 사례 유형명 — 카드의 태그 문자열과 동일하게 둔다. */
  name: string;
  /** 실제 제작 사례일 때만 고객사명. 없으면 "예시"로 표기한다. */
  client?: string;
  headline: string;
  description: string;
  /** 이 유형에서 실제로 하는 일. 3개 고정. */
  highlights: string[];
  image: { src: string; alt: string };
  accent: Accent;
};

/** Software 카드 — 웹 서비스 · 모바일 앱 · 관리자 시스템 · 내부 운영 도구. */
export const softwareExamples: PillarExample[] = [
  {
    // 실제 제작 사례 — sindohr.com. 내용은 site.ts의 selectedWork[0]과 같은 사실을 쓴다.
    id: "web",
    name: "웹 서비스",
    client: "신도H렌탈",
    headline: "사용자가 직접 쓰는 화면을 만듭니다.",
    description:
      "사무용 복합기 렌탈 전문 기업의 랜딩페이지를 기획부터 개발까지 제작했습니다. 업종별 추천 솔루션을 구성해, 방문자가 자신에게 맞는 상품을 바로 확인할 수 있게 설계했습니다.",
    highlights: [
      "기획 · 화면 설계 → 개발 → 배포까지 한 팀에서 진행",
      "업종별 추천 구성으로 원하는 상품에 바로 도달",
      "데스크톱과 모바일 모두 대응하는 반응형 구현",
    ],
    image: {
      src: "/work/software-web-sindohr-v2.png",
      alt: "신도H렌탈 랜딩페이지 화면 — 데스크톱과 모바일 목업",
    },
    accent: "blue",
  },
  {
    id: "app",
    name: "모바일 앱",
    headline: "손 안에서 매일 쓰이는 앱을 만듭니다.",
    description:
      "iOS와 안드로이드에서 함께 동작하는 앱을 만듭니다. 웹 서비스와 데이터를 공유해 하나의 서비스로 이어지도록 설계합니다.",
    highlights: [
      "iOS·안드로이드 동시 대응",
      "푸시 알림·소셜 로그인·결제 연동",
      "스토어 등록과 이후 업데이트 운영까지",
    ],
    image: {
      src: "/work/software-mobile-app-v2.png",
      alt: "모바일 앱 화면 예시 — 스마트폰 크기에 맞춘 목록과 상세 화면",
    },
    accent: "sky",
  },
  {
    id: "admin",
    name: "관리자 시스템",
    headline: "운영하는 사람을 위한 화면도 함께 만듭니다.",
    description:
      "회원, 주문, 콘텐츠를 직접 관리하는 어드민을 서비스와 같이 설계합니다. 개발자를 거치지 않아도 운영이 돌아가게 만드는 것이 목표입니다.",
    highlights: [
      "회원·주문·콘텐츠 관리와 권한 분리",
      "통계 화면으로 현황을 한눈에 확인",
      "엑셀 업로드·다운로드 같은 실무 흐름 반영",
    ],
    image: {
      src: "/work/software-admin-system-v2.png",
      alt: "관리자 시스템 화면 예시 — 목록 테이블과 필터가 놓인 백오피스 레이아웃",
    },
    accent: "navy",
  },
  {
    id: "internal",
    name: "내부 운영 도구",
    headline: "흩어진 업무를 한곳으로 모읍니다.",
    description:
      "엑셀과 메신저에 흩어져 있던 업무를 하나의 도구로 정리합니다. 팀이 실제로 일하는 흐름에 맞춰, 필요한 만큼만 만듭니다.",
    highlights: [
      "반복 작업 자동화와 알림 연동",
      "부서별 권한과 승인 흐름 설계",
      "기존 사내 시스템·스프레드시트와 연결",
    ],
    image: {
      src: "/work/software-internal-tool-v2.png",
      alt: "내부 운영 도구 화면 예시 — 업무 현황을 모아 보여주는 대시보드",
    },
    accent: "mint",
  },
];

/** AI Solutions 카드 — AI 챗봇 · AI 에이전트 · 업무 자동화 · 사내 AI Tool. */
export const aiExamples: PillarExample[] = [
  {
    // 실제 운영 사례 — 카카오톡 오픈채팅 AI 비서 '헤르메스'(WORK 섹션과 동일).
    id: "chatbot",
    name: "AI 챗봇",
    client: "헤르메스",
    headline: "묻는 자리에서 바로 답하게 만듭니다.",
    description:
      "카카오톡 오픈채팅, 웹사이트, 사내 메신저 등 사람들이 이미 쓰는 곳에 챗봇을 붙입니다. 회사 문서와 데이터를 근거로 답하도록 연결해, 일반 챗봇과 다른 답을 내놓게 만듭니다.",
    highlights: [
      "카카오톡·웹·사내 메신저 등 쓰던 채널에 그대로 연결",
      "사내 문서·FAQ를 근거로 답하는 검색 기반 응답",
      "답하기 어려운 문의는 담당자에게 자동 이관",
    ],
    image: {
      src: "/work/ai-chatbot-hermes-v3.png",
      alt: "카카오톡 오픈채팅에서 그날의 AI 뉴스를 정리해 답하는 챗봇 화면",
    },
    accent: "red",
  },
  {
    id: "agent",
    name: "AI 에이전트",
    headline: "물어보면 답하는 데서 끝내지 않습니다.",
    description:
      "문의를 분류하고, 자료를 찾고, 리포트를 만들어 담당자에게 보내는 데까지 한 번에 처리합니다. 사람이 확인해야 할 지점만 남기고 나머지 단계를 대신 밟습니다.",
    highlights: [
      "분류 → 자료 조회 → 요약 → 전달까지 여러 단계를 연결",
      "사내 시스템·데이터베이스를 직접 조회해 처리",
      "판단이 필요한 지점에서는 멈추고 사람에게 확인",
    ],
    image: {
      src: "/work/ai-agent-v2.png",
      alt: "AI 에이전트 실행 화면 — 요구사항 분석부터 리포트 생성까지 단계별 진행 상황",
    },
    accent: "navy",
  },
  {
    id: "automation",
    name: "업무 자동화",
    headline: "매주 반복하던 일을 흐름으로 만듭니다.",
    description:
      "자료 취합, 분류, 보고서 작성, 알림 발송처럼 매번 같은 순서로 하던 일을 자동 실행되는 흐름으로 바꿉니다. 전부가 아니라 반복되는 구간부터 덜어냅니다.",
    highlights: [
      "새 문의·주문 같은 이벤트에 맞춰 자동 실행",
      "수집 → AI 분류·요약 → 보고서 생성까지 연결",
      "결과는 Slack·메일 등 보고 있는 곳으로 발송",
    ],
    image: {
      src: "/work/ai-automation-v2.png",
      alt: "자동화 워크플로우 화면 — 문의 접수, AI 분류, 알림 발송으로 이어지는 3단계 흐름",
    },
    accent: "mint",
  },
  {
    id: "internal-ai",
    name: "사내 AI Tool",
    headline: "우리 회사만 쓰는 AI 도구를 만듭니다.",
    description:
      "범용 AI 서비스에 사내 자료를 올리기 어려운 경우를 위해, 회사 안에서만 쓰는 도구로 만듭니다. 직무별로 필요한 기능만 담아 쓰던 방식 그대로 쓸 수 있게 합니다.",
    highlights: [
      "사내 자료를 외부 서비스에 올리지 않고 활용",
      "직무·팀별 권한과 사용 범위 분리",
      "자주 쓰는 요청은 버튼 한 번으로 실행되게 구성",
    ],
    image: {
      src: "/work/ai-internal-tool-v2.png",
      alt: "사내 AI 도구 화면 — 매출 리포트를 요약하고 PDF로 내보내는 대화 화면",
    },
    accent: "coral",
  },
];
