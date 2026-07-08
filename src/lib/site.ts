/**
 * Central static content + config for the KPOPSOFT site.
 * Sourced from docs/기획서.md and docs/디자인.md. No DB yet — all copy lives here
 * so sections stay presentational and content is edited in one place.
 * Numbers/names/quotes marked "더미" are placeholders to replace with real data.
 */

export const site = {
  name: "KPOPSOFT",
  tagline: "SOFTWARE · AI SOLUTIONS · EDUCATION",
  description:
    "KPOPSOFT는 비즈니스에 필요한 소프트웨어를 만들고, AI를 실제 업무에 적용하며, 전문가의 경험을 실무 중심의 교육으로 연결합니다.",
  email: "hello@kpopsoft.com", // 더미
} as const;

/** Section anchor ids — shared by nav links and section elements. */
export const sectionId = {
  hero: "top",
  about: "about",
  business: "business",
  software: "software",
  aiSolutions: "ai-solutions",
  education: "education",
  experts: "experts",
  work: "work",
  process: "process",
  b2b: "b2b",
  insights: "insights",
  numbers: "numbers",
  testimonials: "testimonials",
  contact: "contact",
} as const;

/** Header navigation (docs/기획서.md §3). */
export const navItems = [
  { label: "ABOUT", href: `#${sectionId.about}` },
  { label: "SOFTWARE", href: `#${sectionId.software}` },
  { label: "AI SOLUTIONS", href: `#${sectionId.aiSolutions}` },
  { label: "EDUCATION", href: `#${sectionId.education}` },
  { label: "WORK", href: `#${sectionId.work}` },
  { label: "INSIGHTS", href: `#${sectionId.insights}` },
] as const;

/**
 * 문의 폼 유형 + 세부 유형 (docs/기획서.md §15, docs/어드민기획.md §문의 폼 옵션 관리).
 *
 * 어드민 CMS 이관 대상 — 지금은 정적 시드이자 단일 소스. 폼(final-cta)은 이 배열만 읽는다.
 * 세부 유형 값이 교육 프로그램/AI 주요 분야와 겹치더라도, "문의 라우팅용 선택지"로서
 * 섹션 콘텐츠와 독립적으로 관리한다(P2에서 inquiry_types/inquiry_subtypes 테이블로 이관).
 *
 * 문의 내용 예시(placeholder)는 세부 유형마다 다르게 보여준다 — 세부 유형별 행에 붙는
 * 값이므로 inquiry_subtypes 테이블(label + message_placeholder)로 그대로 이관된다.
 */
export const inquiryOptions = [
  {
    type: "프로젝트 문의",
    subtypes: [
      {
        label: "웹 프로젝트",
        placeholder:
          "예) 회사 소개 홈페이지가 필요합니다. 참고 사이트는 ○○○이고, 예산·오픈 희망 시기는 △△입니다.",
      },
      {
        label: "앱 프로젝트",
        placeholder:
          "예) iOS·안드로이드 앱을 만들고 싶습니다. 핵심 기능은 ○○○이고, 오픈 희망 시기는 △△입니다.",
      },
      {
        label: "내부 운영 도구",
        placeholder:
          "예) 팀 업무를 관리할 사내 도구가 필요합니다. 지금은 엑셀·수기로 처리 중이고, 사용 인원은 △명입니다.",
      },
      {
        label: "기타",
        placeholder: "예) 필요한 제품·기능과 참고 사례, 희망 일정을 자유롭게 적어 주세요.",
      },
    ],
  },
  {
    type: "교육 문의",
    subtypes: [
      {
        label: "AI 활용 입문",
        placeholder:
          "예) AI를 처음 접하는 팀원 대상 입문 교육을 찾습니다. 인원 △명, 희망 일정은 ○월입니다.",
      },
      {
        label: "AI 업무 활용",
        placeholder:
          "예) 실무에 AI를 바로 활용하는 교육을 원합니다. 대상은 ○○팀 △명, 목표는 업무 효율화입니다.",
      },
      {
        label: "Vibe Coding",
        placeholder:
          "예) 비개발자도 AI로 직접 만들어보는 실습 교육을 원합니다. 인원 △명, 희망 일정은 ○월입니다.",
      },
      {
        label: "Software Development",
        placeholder:
          "예) 개발 실무 역량을 키우는 교육이 필요합니다. 대상 수준은 ○○, 인원 △명입니다.",
      },
      {
        label: "Web & App Development",
        placeholder:
          "예) 웹·앱 개발 실무 교육을 찾습니다. 대상 수준은 ○○, 인원 △명입니다.",
      },
      {
        label: "AI Automation",
        placeholder:
          "예) 업무 자동화를 직접 구축해보는 교육을 원합니다. 대상은 ○○팀 △명입니다.",
      },
      {
        label: "AI Prototype Lab",
        placeholder:
          "예) 아이디어를 AI 프로토타입으로 만들어보는 실습 과정을 찾습니다. 인원 △명입니다.",
      },
      {
        label: "기업 맞춤형 교육",
        placeholder:
          "예) 우리 회사 상황에 맞춘 커리큘럼이 필요합니다. 대상·목표·희망 일정은 ○○입니다.",
      },
      {
        label: "기타",
        placeholder: "예) 교육 대상·인원·목표·희망 일정을 자유롭게 적어 주세요.",
      },
    ],
  },
  {
    type: "AI 솔루션 문의",
    subtypes: [
      {
        label: "AI 업무 자동화",
        placeholder:
          "예) 반복되는 문서·데이터 처리를 자동화하고 싶습니다. 지금은 ○○ 방식으로 처리 중입니다.",
      },
      {
        label: "AI 에이전트",
        placeholder:
          "예) 여러 단계를 스스로 처리하는 AI 에이전트를 만들고 싶습니다. 맡기고 싶은 업무는 ○○입니다.",
      },
      {
        label: "AI 챗봇",
        placeholder:
          "예) 고객(또는 사내) 문의에 답하는 AI 챗봇이 필요합니다. 대상과 참고 데이터는 ○○입니다.",
      },
      {
        label: "콘텐츠 자동화",
        placeholder:
          "예) 블로그·SNS 등 콘텐츠 제작을 자동화하고 싶습니다. 현재 제작량은 ○○입니다.",
      },
      {
        label: "사내 AI Tool",
        placeholder:
          "예) 우리 팀 업무에 맞는 사내 AI 도구가 필요합니다. 해결하려는 문제는 ○○입니다.",
      },
      {
        label: "AI Prototype",
        placeholder:
          "예) 아이디어가 실제로 되는지 먼저 검증(PoC)해보고 싶습니다. 검증할 아이디어는 ○○입니다.",
      },
      {
        label: "기타",
        placeholder: "예) 어떤 문제를 AI로 풀고 싶은지, 현재 상황과 목표를 자유롭게 적어 주세요.",
      },
    ],
  },
] as const;

export type InquiryType = (typeof inquiryOptions)[number]["type"];

/** Business overview (docs/기획서.md §6). */
export const businesses = [
  {
    index: "01",
    title: "SOFTWARE",
    accent: "blue",
    summary: "기업과 조직에 필요한 소프트웨어와 디지털 제품을 개발합니다.",
    items: [
      "웹 서비스",
      "모바일 앱",
      "기업용 소프트웨어",
      "업무 관리 시스템",
      "내부 운영 도구",
      "관리자 시스템",
      "디지털 플랫폼",
      "MVP",
      "Prototype",
    ],
  },
  {
    index: "02",
    title: "AI SOLUTIONS",
    accent: "red",
    summary: "AI 기술을 실제 업무 환경에 적용하는 솔루션을 제공합니다.",
    items: [
      "AI 업무 자동화",
      "AI 챗봇",
      "콘텐츠 자동화",
      "AI Workflow",
      "사내 AI Tool",
      "데이터 기반 업무 도구",
      "AI Prototype",
    ],
  },
  {
    index: "03",
    title: "EDUCATION",
    accent: "mint",
    summary:
      "AI와 디지털 기술을 실제 프로젝트를 통해 학습하는 실무 중심의 교육 프로그램을 운영합니다.",
    items: [
      "AI 활용 입문",
      "AI 업무 활용",
      "Vibe Coding",
      "웹 제작 실습",
      "AI Prototype Lab",
      "기업 맞춤형",
    ],
  },
] as const;

/**
 * Education programs (docs/디자인.md §Program Cards).
 *
 * summary/audience/curriculum/outcome 는 프로그램 상세 모달용 콘텐츠 —
 * 실제 커리큘럼 확정 시 교체할 초안이다. 목록(education) 카드는 name/desc/tags만,
 * 모달(ProgramDetail)은 나머지 필드까지 읽는다.
 */
export const programs = [
  {
    index: "01",
    name: "AI 활용 입문",
    desc: "AI를 처음 접하는 분을 위한 가벼운 시작.",
    tags: ["AI 활용", "입문"],
    accent: "mint",
    summary:
      "AI가 무엇이고 어떻게 쓰는지, 부담 없이 처음부터 익혀보는 입문 과정입니다.",
    audience: [
      "AI를 이제 막 시작해보려는 분",
      "용어와 도구가 낯설게 느껴지는 분",
      "기초부터 편하게 배우고 싶은 분",
    ],
    curriculum: [
      "AI로 무엇을 할 수 있는지 살펴보기",
      "AI와 대화하는 기본 감 익히기",
      "많이 쓰이는 AI 도구 둘러보기",
      "간단한 실습으로 직접 써보기",
    ],
    outcome: "수료 후 AI를 일상과 업무에 부담 없이 써볼 수 있습니다.",
  },
  {
    index: "02",
    name: "AI 업무 활용",
    desc: "실무에서 바로 쓰는 AI 활용법을 익힙니다.",
    tags: ["AI 활용", "생산성"],
    accent: "blue",
    summary:
      "문서 작성·정리·분석처럼 매일 반복하는 업무에 생성형 AI를 붙여 시간을 줄이는 실무 활용 과정입니다.",
    audience: [
      "반복적인 문서·자료 업무에 시간을 많이 쓰는 실무자",
      "AI를 써보고 싶지만 어디서 시작할지 막막한 분",
      "팀 생산성을 끌어올리고 싶은 리더",
    ],
    curriculum: [
      "업무별 프롬프트 설계와 재사용 템플릿",
      "문서 초안·요약·번역·검토 자동화",
      "회의록·리서치·데이터 정리 실습",
      "내 업무에 맞는 AI 도구 조합",
    ],
    outcome: "수료 후 자신의 반복 업무를 AI로 절반 이하의 시간에 처리할 수 있습니다.",
  },
  {
    index: "03",
    name: "Vibe Coding",
    desc: "AI와 함께 코드를 작성하고 제품을 만듭니다.",
    tags: ["Vibe Coding", "AI 활용"],
    accent: "red",
    summary:
      "코드를 직접 몰라도 AI와 대화하며 실제로 동작하는 제품을 만들어보는 과정입니다.",
    audience: [
      "기획·디자인 등 비개발 직군",
      "아이디어를 직접 만들어보고 싶은 창업가",
      "AI로 개발 생산성을 높이려는 개발자",
    ],
    curriculum: [
      "AI 코딩 도구 세팅과 작업 흐름",
      "요구사항을 프롬프트로 옮기는 법",
      "작은 웹앱을 처음부터 완성하기",
      "디버깅·배포까지 AI와 함께",
    ],
    outcome: "수료 후 아이디어를 스스로 작동하는 프로토타입으로 만들 수 있습니다.",
  },
  {
    index: "04",
    name: "Software Development",
    desc: "실제 서비스를 설계하고 개발하는 과정.",
    tags: ["Software Development"],
    accent: "navy",
    summary:
      "실제 서비스를 기준으로 설계부터 개발까지 소프트웨어 개발의 전 과정을 다루는 심화 과정입니다.",
    audience: [
      "개발 기초를 갖추고 실전 역량을 키우려는 분",
      "사이드 프로젝트를 제품 수준으로 올리고 싶은 분",
      "팀의 개발 표준을 잡고 싶은 실무자",
    ],
    curriculum: [
      "요구사항 정의와 아키텍처 설계",
      "프론트엔드·백엔드·DB 연동",
      "인증·배포·운영 기초",
      "실제 서비스 단위 프로젝트 완성",
    ],
    outcome: "수료 후 하나의 서비스를 설계에서 배포까지 스스로 끌고 갈 수 있습니다.",
  },
  {
    index: "05",
    name: "Web & App Development",
    desc: "웹과 모바일 앱을 처음부터 끝까지.",
    tags: ["Digital Product"],
    accent: "sky",
    summary:
      "반응형 웹과 모바일 앱을 기획부터 배포까지 직접 만들어보는 실습 중심 과정입니다.",
    audience: [
      "웹·앱을 직접 만들어보고 싶은 입문자",
      "자사 서비스를 만들려는 소규모 팀",
      "프론트엔드 전반을 익히려는 분",
    ],
    curriculum: [
      "반응형 UI 구현과 컴포넌트 설계",
      "모바일 앱 화면·네비게이션 구성",
      "API 연동과 상태 관리",
      "앱스토어·웹 배포",
    ],
    outcome: "수료 후 웹과 앱을 하나씩 직접 만들어 배포할 수 있습니다.",
  },
  {
    index: "06",
    name: "AI Automation",
    desc: "반복 업무를 자동화 워크플로우로 전환합니다.",
    tags: ["AI Automation"],
    accent: "yellow",
    summary:
      "사람이 반복하던 업무를 AI와 자동화 도구로 이어붙여 워크플로우로 바꾸는 과정입니다.",
    audience: [
      "매일 같은 작업을 반복하는 운영·CS·마케팅 실무자",
      "사내 업무를 자동화하고 싶은 팀",
      "노코드 자동화를 배우려는 분",
    ],
    curriculum: [
      "자동화할 업무 진단과 설계",
      "노코드 자동화 도구 연결",
      "AI를 붙인 문서·데이터 처리 파이프라인",
      "실제 업무 자동화 1건 구축",
    ],
    outcome: "수료 후 팀의 반복 업무 하나를 자동으로 도는 워크플로우로 만들 수 있습니다.",
  },
  {
    index: "07",
    name: "AI Prototype Lab",
    desc: "아이디어를 빠르게 프로토타입으로 검증합니다.",
    tags: ["Prototype Development", "AI 활용"],
    accent: "coral",
    summary:
      "아이디어를 짧은 사이클로 프로토타입으로 만들어 시장·사용자 반응을 검증하는 랩 형식 과정입니다.",
    audience: [
      "신규 아이디어를 빠르게 검증하려는 창업가·기획자",
      "사내 신사업을 실험하는 팀",
      "프로토타이핑 역량을 갖추려는 분",
    ],
    curriculum: [
      "문제 정의와 가설 세우기 (Idea)",
      "빠른 프로토타입 제작 (Prototype)",
      "사용자 테스트와 피드백 반영 (Test)",
      "다음 단계 판단과 빌드 계획 (Build)",
    ],
    outcome: "수료 후 아이디어를 2주 안에 검증 가능한 프로토타입으로 만들 수 있습니다.",
  },
  {
    index: "08",
    name: "기업 맞춤형 교육",
    desc: "조직에 필요한 커리큘럼을 함께 설계합니다.",
    tags: ["Software Development", "AI Automation"],
    accent: "mint",
    summary:
      "조직의 목표와 현업 과제에 맞춰 커리큘럼을 함께 설계하고 진행하는 기업 전용 과정입니다.",
    audience: [
      "팀 전체의 AI·디지털 역량을 끌어올리려는 기업",
      "직무별 맞춤 교육이 필요한 조직",
      "교육을 실제 성과로 잇고 싶은 담당자",
    ],
    curriculum: [
      "현업 과제 진단과 목표 설정",
      "직무·수준별 커리큘럼 설계",
      "실제 업무 데이터로 진행하는 실습",
      "교육 후 성과 점검과 사내 확산",
    ],
    outcome: "수료 후 조직이 배운 것을 실제 업무와 사내 도구로 이어갈 수 있습니다.",
  },
] as const;

/** Software work categories (docs/디자인.md §Software Development). */
/**
 * 각 카테고리는 문의 폼(프로젝트 문의)의 세부 유형으로 딥링크된다. `inquiry`의
 * type/subtype 값은 inquiryOptions와 정확히 일치해야 한다(단일 소스).
 */
export const softwareCategories = [
  {
    title: "Web",
    desc: "반응형 웹 서비스와 디지털 플랫폼",
    inquiry: { type: "프로젝트 문의", subtype: "웹 프로젝트" },
  },
  {
    title: "App",
    desc: "iOS · Android 하이브리드 모바일 앱",
    inquiry: { type: "프로젝트 문의", subtype: "앱 프로젝트" },
  },
  {
    title: "AI Automation",
    desc: "업무 자동화 및 AI Workflow",
    inquiry: { type: "프로젝트 문의", subtype: "AI 자동화" },
  },
  {
    title: "Internal Tools",
    desc: "관리자 · 내부 운영 도구",
    inquiry: { type: "프로젝트 문의", subtype: "내부 운영 도구" },
  },
  {
    title: "Digital Product",
    desc: "MVP · Prototype · 신규 서비스",
    inquiry: { type: "프로젝트 문의", subtype: "기타" },
  },
] as const;

/** AI Prototype Lab process (docs/디자인.md §AI PROTOTYPE LAB). */
export const labSteps = ["Idea", "Prototype", "Test", "Build"] as const;

/** KPOPSOFT process (docs/디자인.md §Process Diagram). */
export const processSteps = [
  { index: "01", title: "Understand", desc: "문제와 목표 정의", accent: "blue" },
  { index: "02", title: "Design", desc: "서비스 및 교육 구조 설계", accent: "sky" },
  {
    index: "03",
    title: "Build",
    desc: "소프트웨어, 자동화, 프로토타입 개발",
    accent: "red",
  },
  { index: "04", title: "Learn", desc: "실습 중심 교육 및 기술 이전", accent: "yellow" },
  { index: "05", title: "Scale", desc: "조직과 서비스에 확장", accent: "mint" },
] as const;

/** Experts & instructors (docs/디자인.md §EXPERT NETWORK) — 더미 데이터. */
export type Expert = {
  name: string;
  role: string;
  quote: string;
  tags: string[];
  accent: Accent;
  /** Optional profile photo (path under /public). Falls back to a monogram block. */
  image?: string;
};

export const experts: Expert[] = [
  {
    name: "안영근",
    role: "Software Lead",
    quote: "좋은 소프트웨어는 설명이 필요 없습니다. 그냥 작동합니다.",
    tags: ["Software Development", "Digital Product"],
    accent: "blue",
    image: "/experts/an-younggeun.jpg",
  },
  {
    name: "김상혁",
    role: "AI Solutions",
    quote: "AI는 도구입니다. 중요한 건 업무에 어떻게 녹이느냐입니다.",
    tags: ["AI Automation", "AI 활용"],
    accent: "red",
    image: "/experts/kim-sanghyuk.jpg",
  },
  {
    name: "이동준",
    role: "Prototype & Vibe Coding",
    quote: "완벽한 기획보다 빠른 프로토타입이 더 많은 것을 알려줍니다.",
    tags: ["Prototype Development", "Vibe Coding"],
    accent: "mint",
  },
] as const;

/** Selected work (docs/기획서.md §9) — 더미 데이터. */
export const selectedWork = [
  {
    client: "커머스 스타트업",
    title: "주문 운영 자동화 어드민",
    category: "Internal Tools · AI Automation",
    accent: "blue",
    summary:
      "여러 판매 채널의 주문을 한 화면에서 처리하고, 반복 CS·정산 업무를 자동화한 내부 운영 어드민입니다.",
    challenge:
      "주문이 채널별로 흩어져 있어 매일 수 시간을 수작업 취합에 썼고, 오입력과 누락이 잦았습니다.",
    solution:
      "채널 주문을 단일 대시보드로 통합하고, AI로 문의 유형을 자동 분류·초안 응답을 생성했습니다. 정산 리포트는 자동으로 산출되도록 만들었습니다.",
    results: [
      "주문 처리 시간 70% 단축",
      "CS 1차 응답 자동화율 60%",
      "월 정산 마감 3일 → 반나절",
    ],
  },
  {
    client: "교육 기관",
    title: "AI 활용 사내 교육 플랫폼",
    category: "Web · Education",
    accent: "mint",
    summary:
      "임직원이 실제 업무 도구로 AI를 익히도록 커리큘럼·실습·진도관리를 담은 사내 러닝 플랫폼입니다.",
    challenge:
      "일회성 특강만으로는 현업 적용이 되지 않았고, 학습 이력과 성과를 추적할 수단이 없었습니다.",
    solution:
      "직무별 트랙과 실습 과제를 웹 플랫폼으로 제공하고, 수강·과제·수료 현황을 관리자 대시보드로 가시화했습니다.",
    results: [
      "수료율 92%",
      "부서별 AI 실무 적용 사례 30건 이상",
      "교육 운영 공수 50% 절감",
    ],
  },
  {
    client: "핀테크",
    title: "고객 문의 AI 챗봇",
    category: "AI Solutions",
    accent: "red",
    summary:
      "금융 규정을 지키면서 24시간 1차 문의를 처리하는 사내 지식 기반 AI 챗봇입니다.",
    challenge:
      "문의량 급증으로 상담 대기가 길어졌고, 반복 질문이 상담 인력을 크게 소모했습니다.",
    solution:
      "사내 문서·FAQ를 검색 기반(RAG)으로 연결해 근거 있는 답변을 제공하고, 민감한 문의는 상담원에게 자동 이관했습니다.",
    results: [
      "1차 문의 자동 해결 65%",
      "평균 응답 대기 8분 → 즉시",
      "상담원 반복 문의 처리량 40% 감소",
    ],
  },
  {
    client: "제조 기업",
    title: "생산 데이터 대시보드 MVP",
    category: "Digital Product · Prototype",
    accent: "yellow",
    summary:
      "설비·생산 데이터를 한눈에 보고 이상을 빠르게 감지하는 실시간 모니터링 대시보드 MVP입니다.",
    challenge:
      "데이터가 여러 설비에 흩어져 있어 현황 파악이 늦었고, 이상 감지가 사후 대응에 그쳤습니다.",
    solution:
      "핵심 지표를 실시간으로 수집·시각화하고 임계치 알림을 붙였습니다. 2주 만에 검증 가능한 프로토타입으로 제작했습니다.",
    results: [
      "2주 만에 동작하는 MVP 완성",
      "이상 감지 리드타임 대폭 단축",
      "본 개발 투자 결정 근거 확보",
    ],
  },
] as const;

/**
 * Insights / articles (docs/기획서.md §12) — 더미 데이터.
 * `inquiry`는 카드 클릭 시 문의 폼에서 미리 선택될 (문의 유형, 세부 유형).
 * 값은 inquiryOptions와 정확히 일치해야 한다(단일 소스).
 */
export const insights = [
  {
    tag: "AI Automation",
    title: "업무 자동화,\n어디서부터 시작해야 할까",
    date: "2026.06",
    accent: "red",
    excerpt:
      "자동화는 거창한 시스템이 아니라, 매일 반복하는 작은 업무 하나에서 시작합니다.",
    body: [
      "“무엇을 자동화할지”부터 막히는 경우가 많습니다. 정답은 대개 화려한 신기술이 아니라 팀이 매일 반복하는 단순 작업 안에 있습니다. 복사·붙여넣기, 자료 취합, 같은 답변 반복 같은 일이 좋은 후보입니다.",
      "시작은 업무 한 개를 골라 흐름을 그려보는 것입니다. 입력 → 처리 → 출력으로 나눠보면, 사람이 꼭 판단해야 하는 부분과 도구에 맡겨도 되는 부분이 드러납니다.",
      "처음부터 완벽한 자동화를 노리기보다 절반만 자동화해도 시간은 크게 줄어듭니다. 작은 성공을 먼저 만든 뒤 범위를 넓히는 편이 안전하고 빠릅니다.",
      "중요한 건 도구 선택이 아니라 “어떤 업무를, 어디까지” 자동화할지 정하는 판단입니다. 그 판단만 서면 나머지는 생각보다 빠르게 붙습니다.",
    ],
    inquiry: { type: "AI 솔루션 문의", subtype: "AI 업무 자동화" },
  },
  {
    tag: "Education",
    title: "Vibe Coding으로\n팀 생산성을 높이는 법",
    date: "2026.05",
    accent: "mint",
    excerpt:
      "AI와 함께 코드를 쓰면, 개발자가 아니어도 필요한 도구를 직접 만들 수 있습니다.",
    body: [
      "Vibe Coding은 AI와 대화하며 코드를 만들어가는 방식입니다. 문법을 외우는 대신 “무엇을 만들고 싶은지”를 명확히 설명하는 능력이 더 중요해집니다.",
      "팀 생산성이 오르는 지점은 분명합니다. 개발팀에 요청하고 기다리던 작은 사내 도구를, 필요한 사람이 직접 만들 수 있게 됩니다. 대기 시간이 사라지는 셈입니다.",
      "물론 모든 걸 대체하진 않습니다. 복잡한 서비스는 여전히 전문 개발이 필요합니다. 하지만 반복 업무용 도구, 프로토타입, 자동화 스크립트 수준은 충분히 스스로 만들 수 있습니다.",
      "핵심은 “완벽한 코드”가 아니라 “작동하는 결과”입니다. 작게 만들어 써보고 고치는 사이클을 팀 문화로 만들면 생산성은 자연스럽게 따라옵니다.",
    ],
    inquiry: { type: "교육 문의", subtype: "Vibe Coding" },
  },
  {
    tag: "Prototype",
    title: "2주 만에 아이디어를\n프로토타입으로",
    date: "2026.04",
    accent: "blue",
    excerpt:
      "오래 기획하기보다, 빠르게 만들어 검증하는 편이 더 많은 것을 알려줍니다.",
    body: [
      "아이디어는 머릿속에 있을 때 가장 완벽해 보입니다. 실제로 만들어보기 전까지는 무엇이 문제인지 알기 어렵습니다. 그래서 빠른 프로토타입이 필요합니다.",
      "2주라는 짧은 사이클은 강제로 범위를 좁힙니다. 핵심 가설 하나만 검증하도록 만들면 불필요한 기능에 시간을 쓰지 않게 됩니다.",
      "프로토타입의 목적은 완성이 아니라 학습입니다. 사용자가 실제로 어떻게 반응하는지, 가정이 맞았는지를 데이터로 확인하는 것이 목표입니다.",
      "검증 결과가 나오면 다음 판단이 쉬워집니다. 더 키울지, 방향을 틀지, 접을지. 오래 고민하는 대신 빠르게 확인하는 것이 결국 더 빠른 길입니다.",
    ],
    inquiry: { type: "AI 솔루션 문의", subtype: "AI Prototype" },
  },
] as const;

/** Company numbers (docs/기획서.md §13) — 더미 데이터. */
export const stats = [
  { value: 120, suffix: "+", label: "완료 프로젝트" },
  { value: 40, suffix: "+", label: "파트너 기업" },
  { value: 1800, suffix: "+", label: "교육 수료생" },
  { value: 96, suffix: "%", label: "재의뢰 만족도" },
] as const;

/** Testimonials (docs/디자인.md §Testimonial) — 더미 데이터. */
export const testimonials = [
  {
    quote: "AI 도입을 막연하게만 생각했는데, 실제 업무에 바로 적용됐습니다.",
    author: "제조업 · 운영팀",
    program: "기업 맞춤형 교육",
    result: "반복 업무 40% 감소",
  },
  {
    quote: "기획만 있던 아이디어가 2주 만에 작동하는 프로토타입이 됐어요.",
    author: "초기 스타트업 · 대표",
    program: "AI Prototype Lab",
    result: "투자 데모 완성",
  },
  {
    quote: "강의가 아니라 함께 만드는 워크숍이라 남는 게 확실했습니다.",
    author: "IT 서비스 · 개발팀",
    program: "Vibe Coding",
    result: "사내 도구 3종 자체 개발",
  },
] as const;

/** Trusted-by logo strip (docs/디자인.md §TRUST / PARTNERS) — 더미. */
export const partners = [
  "COMMERCE",
  "EDULAB",
  "FINTECH",
  "MAKERS",
  "STUDIO K",
  "NEXT",
] as const;

export type Accent =
  | "blue"
  | "red"
  | "yellow"
  | "coral"
  | "mint"
  | "sky"
  | "navy";

/** Accent → Tailwind class maps (keeps brand colors out of component bodies). */
export const accentBg: Record<Accent, string> = {
  blue: "bg-brand-blue",
  red: "bg-brand-red",
  yellow: "bg-brand-yellow",
  coral: "bg-brand-coral",
  mint: "bg-brand-mint",
  sky: "bg-brand-sky",
  navy: "bg-brand-navy",
};

export const accentText: Record<Accent, string> = {
  blue: "text-brand-blue",
  red: "text-brand-red",
  yellow: "text-brand-yellow",
  coral: "text-brand-coral",
  mint: "text-brand-mint",
  sky: "text-brand-sky",
  navy: "text-brand-navy",
};

/** Accent surfaces that read AA against ink text (light tints) or need white text. */
export const accentOnDark: Record<Accent, boolean> = {
  blue: true,
  red: true,
  yellow: false,
  coral: false,
  mint: false,
  sky: false,
  navy: true,
};
