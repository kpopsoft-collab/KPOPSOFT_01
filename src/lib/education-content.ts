/**
 * Education 페이지 전용 mock data (docs/KPOPSOFT_Education_Page_ver2.md §33
 * "개발 환경의 예시 콘텐츠는 별도 mock data 파일로 분리").
 *
 * DB 스키마가 아직 없어 전부 정적 데이터다. §27의 Admin 필드 목록과 최대한
 * 이름을 맞춰 둬서, 나중에 Supabase 어댑터로 교체할 때 타입만 재사용하면
 * 되도록 했다(§28 데이터 재사용 원칙). 강사진은 이미 DB 연동된
 * `getPublicExperts()`(src/lib/public-content.ts)를 그대로 재사용하고
 * 여기서 다시 정의하지 않는다.
 */

import type { Accent } from "@/lib/site";

/** Education 페이지 전용 앵커. `educationSectionId`(site.ts)에 없는 것만 여기 둔다. */
export const eduSectionId = {
  purpose: "purpose",
  outputs: "outputs",
  vibedays: "vibedays-club",
  howWeLearn: "how-we-learn",
  process: "education-process",
  cases: "education-cases",
  instructors: "instructors",
  reviews: "reviews",
  faq: "faq",
} as const;

export type EduImage = { src: string; alt: string; caption?: string };

/** 대표 교육 프로그램 (docs §9). §4 상세 페이지 확장을 위해 slug를 준비한다. */
export type EduProgram = {
  slug: string;
  index: string;
  name: string;
  /** 감성 라벨, 예: "START DAY" */
  emotionalLabel: string;
  description: string;
  audience: string;
  difficulty: string;
  format: string;
  status: "모집 중" | "모집 예정" | "상시 문의" | "마감";
  accent: Accent;
  image?: EduImage;
  seo?: { title: string; description: string };
};

export const eduPrograms: EduProgram[] = [
  {
    slug: "ai-intro",
    index: "01",
    name: "AI 활용 입문",
    emotionalLabel: "START DAY",
    description:
      "생성형 AI의 기본 개념과 주요 도구를 이해하고 업무에 활용하기 위한 기초를 익힙니다.",
    audience: "AI를 처음 접하는 실무자",
    difficulty: "입문",
    format: "오프라인",
    status: "모집 중",
    accent: "mint",
    image: {
      src: "/education/education-coaching-01.jpg",
      alt: "AI 활용 입문 과정에서 강사가 참가자 옆에서 실습을 1:1로 안내하는 모습",
      caption: "AI 활용 입문 과정, 도구 실습을 옆에서 함께 안내하는 코칭 시간",
    },
    seo: {
      title: "AI 활용 입문 | KPOPSOFT Education",
      description:
        "생성형 AI의 기본 개념과 주요 도구를 이해하고 업무에 활용하기 위한 기초를 익히는 입문 과정입니다.",
    },
  },
  {
    slug: "ai-work",
    index: "02",
    name: "AI 업무 활용",
    emotionalLabel: "WORK DAY",
    description:
      "문서 작성, 조사, 기획, 콘텐츠 제작과 같은 실제 업무에 AI를 적용합니다.",
    audience: "업무 생산성을 높이고 싶은 실무자",
    difficulty: "입문 · 실무",
    format: "오프라인 · 온라인",
    status: "모집 중",
    accent: "blue",
    image: {
      src: "/education/education-lecture-01.jpg",
      alt: "AI 업무 활용 강의에서 강사가 화면을 보며 실무 활용법을 설명하는 모습",
      caption: "AI 업무 활용 과정, 실제 업무 사례로 진행하는 강의",
    },
    seo: {
      title: "AI 업무 활용 | KPOPSOFT Education",
      description:
        "문서 작성, 조사, 기획, 콘텐츠 제작 같은 실제 업무에 AI를 적용하는 실무 활용 과정입니다.",
    },
  },
  {
    slug: "vibe-coding",
    index: "03",
    name: "Vibe Coding",
    emotionalLabel: "BUILD DAY",
    description:
      "개발 경험이 없어도 AI와 함께 웹 서비스와 업무 도구를 직접 제작합니다.",
    audience: "기획자, 디자이너, 비개발 실무자",
    difficulty: "입문 · 제작",
    format: "오프라인 · 프로젝트형",
    status: "모집 중",
    accent: "red",
    // 결과물 화면 캡처가 아직 없어 브랜드 Placeholder로 대체(§25).
    seo: {
      title: "Vibe Coding | KPOPSOFT Education",
      description:
        "개발 경험이 없어도 AI와 함께 웹 서비스와 업무 도구를 직접 제작하는 Vibe Coding 과정입니다.",
    },
  },
  {
    slug: "ai-prototype-lab",
    index: "04",
    name: "AI Prototype Lab",
    emotionalLabel: "PROTOTYPE DAY",
    description:
      "아이디어를 빠르게 작동하는 프로토타입으로 구현하고 실제 사용 가능성을 검증합니다.",
    audience: "신규 서비스와 아이디어를 검증하려는 팀",
    difficulty: "실무 · 프로젝트",
    format: "오프라인 · 협의 가능",
    status: "모집 예정",
    accent: "coral",
    seo: {
      title: "AI Prototype Lab | KPOPSOFT Education",
      description:
        "아이디어를 빠르게 작동하는 프로토타입으로 구현하고 실제 사용 가능성을 검증하는 랩 과정입니다.",
    },
  },
  {
    slug: "ai-automation",
    index: "05",
    name: "AI 업무 자동화",
    emotionalLabel: "FLOW DAY",
    description:
      "반복 업무를 분석하고 AI Workflow와 자동화 도구를 직접 구축합니다.",
    audience: "운영, 마케팅, 기획, 관리 실무자",
    difficulty: "실무 · 자동화",
    format: "오프라인 · 온라인",
    status: "모집 중",
    accent: "yellow",
    seo: {
      title: "AI 업무 자동화 | KPOPSOFT Education",
      description:
        "반복 업무를 분석하고 AI Workflow와 자동화 도구를 직접 구축하는 실무 자동화 과정입니다.",
    },
  },
  {
    slug: "custom-training",
    index: "06",
    name: "기업 맞춤형 교육",
    emotionalLabel: "TEAM DAY",
    description:
      "조직의 직무, 수준, 업무 과제를 바탕으로 맞춤형 교육 과정을 설계합니다.",
    audience: "기업 및 기관",
    difficulty: "맞춤형",
    format: "협의 필요",
    status: "상시 문의",
    accent: "navy",
    image: {
      src: "/education/education-b2b-01.jpg",
      alt: "기업 맞춤형 교육 워크숍에서 참가자들이 모여 협업하는 모습",
      caption: "기업 맞춤형 교육, 조직 과제를 함께 다루는 워크숍 현장",
    },
    seo: {
      title: "기업 맞춤형 교육 | KPOPSOFT Education",
      description:
        "조직의 직무, 수준, 업무 과제를 바탕으로 맞춤형 교육 과정을 설계하는 기업 전용 프로그램입니다.",
    },
  },
];

/** 교육 결과물 (docs §10). index 0이 대표(큰 카드)로 노출된다. */
export type EduOutput = {
  title: string;
  categoryLabel: string;
  description: string;
  caption: string;
  accent: Accent;
  image?: EduImage;
};

export const eduOutputs: EduOutput[] = [
  {
    title: "반복 보고서 자동화",
    categoryLabel: "AI Workflow",
    description: "업무 데이터를 입력하면 보고서 초안을 자동 생성하는 도구",
    caption: "운영팀이 직접 설계한 반복 보고서 자동화 Workflow",
    accent: "yellow",
  },
  {
    title: "서비스 랜딩페이지",
    categoryLabel: "Vibe Coding",
    description: "AI와 함께 기획하고 제작한 반응형 웹페이지",
    caption: "Vibe Coding 과정에서 제작한 서비스 소개 랜딩페이지",
    accent: "red",
  },
  {
    title: "신규 서비스 프로토타입",
    categoryLabel: "AI Prototype Lab",
    description: "아이디어 검증을 위한 작동 가능한 웹 프로토타입",
    caption: "AI Prototype Lab 과정에서 제작한 서비스 예약 프로토타입",
    accent: "coral",
  },
  {
    title: "사내 업무 대시보드",
    categoryLabel: "Web & AI",
    description: "운영 데이터를 한 화면에서 확인하는 내부 업무 도구",
    caption: "운영 데이터를 한 화면에서 확인하는 사내 업무 대시보드",
    accent: "blue",
  },
];

/** VIBEDAYS CLUB 역할 3종 (docs §11). */
export type VibedaysRole = {
  name: string;
  title: string;
  description: string;
  image: string;
};

export const vibedaysRoles: VibedaysRole[] = [
  {
    name: "NEW VIBER",
    title: "새로운 도구를 발견하는 사람",
    description:
      "처음이어도 괜찮습니다. AI와 디지털 제작의 기본을 차근차근 익힙니다.",
    image: "/assets/vibedays-new-viber.svg",
  },
  {
    name: "VIBE MAKER",
    title: "배운 것을 직접 만드는 사람",
    description: "자신의 업무와 아이디어를 작동하는 결과물로 구현합니다.",
    image: "/assets/vibedays-vibe-maker.svg",
  },
  {
    name: "VIBE SHARER",
    title: "경험과 결과를 나누는 사람",
    description:
      "배운 방법과 제작 경험을 공유하며 서로의 성장을 돕습니다.",
    image: "/assets/vibedays-vibe-sharer.svg",
  },
];

/** 교육 방식 4항목 (docs §12). */
export const howWeLearnItems = [
  {
    index: "01",
    title: "설명보다 실습",
    description: "직접 도구를 사용하고 화면과 결과물을 만들며 학습합니다.",
  },
  {
    index: "02",
    title: "예제보다 현업 과제",
    description:
      "일반적인 예제가 아니라 자신의 업무와 아이디어를 교육 과제로 활용합니다.",
  },
  {
    index: "03",
    title: "수료보다 결과물",
    description:
      "교육 과정에서 실제로 작동하는 웹, 프로토타입, 자동화 도구를 완성합니다.",
  },
  {
    index: "04",
    title: "교육 이후에도 활용",
    description:
      "제작 방법과 템플릿을 정리해 교육 이후에도 업무에 적용할 수 있도록 합니다.",
  },
] as const;

/** 기업 맞춤형 교육 형태 목록 (docs §13). */
export const orgTrainingFormats = [
  "AI 입문 강의",
  "AI 업무 활용 실습",
  "직무별 AI 워크숍",
  "AI 업무 자동화 워크숍",
  "Vibe Coding 프로젝트 과정",
  "AI Prototype Lab",
  "사내 도구 제작 과정",
] as const;

/** 기업 맞춤형 교육 — 맞춤 설계 항목 (docs §13). */
export const orgTrainingDesignItems = [
  "교육 대상",
  "참여 인원",
  "현재 AI 활용 수준",
  "해결할 업무 과제",
  "교육 시간",
  "교육 방식",
  "온라인 또는 오프라인",
  "교육 결과물",
  "사후 피드백",
] as const;

/** 교육 진행 프로세스 5단계 (docs §14). */
export const eduProcessSteps = [
  {
    index: "01",
    title: "Discover",
    description:
      "교육 대상과 현재 활용 수준, 해결해야 할 업무 과제를 파악합니다.",
    accent: "blue" as Accent,
  },
  {
    index: "02",
    title: "Design",
    description: "목표, 시간, 인원에 맞춰 교육 과정과 실습 과제를 설계합니다.",
    accent: "sky" as Accent,
  },
  {
    index: "03",
    title: "Practice",
    description: "실제 업무와 도구를 중심으로 강의와 실습을 진행합니다.",
    accent: "red" as Accent,
  },
  {
    index: "04",
    title: "Build",
    description:
      "교육 과정에서 직접 사용할 수 있는 결과물과 템플릿을 제작합니다.",
    accent: "yellow" as Accent,
  },
  {
    index: "05",
    title: "Apply",
    description: "교육 이후 업무에 적용할 방법과 다음 실행 과제를 정리합니다.",
    accent: "mint" as Accent,
  },
] as const;

/** 교육 사례 (docs §15). 공개 가능한 정보만 담고, 기업명은 익명화한다(§24). */
export type EduCase = {
  slug: string;
  title: string;
  industry: string;
  audience: string;
  participants: string;
  duration: string;
  task: string;
  format: string;
  outcome: string;
  accent: Accent;
  coverImage: EduImage;
  /** 상세 갤러리에 더 있음을 나타내는 보조 이미지 수 (§15 "+3" 표시). */
  galleryCount: number;
};

export const eduCases: EduCase[] = [
  {
    slug: "manufacturing-automation-workshop",
    title: "제조기업 AI 업무 자동화 워크숍",
    industry: "제조업 (익명)",
    audience: "운영 및 관리 실무자",
    participants: "30명",
    duration: "6시간 실습형 워크숍",
    task: "반복 보고서 작성 및 데이터 정리 자동화",
    format: "오프라인",
    outcome: "부서별 AI 업무 템플릿과 자동화 흐름",
    accent: "yellow",
    coverImage: {
      src: "/education/education-case-01.jpg",
      alt: "제조기업 AI 업무 자동화 워크숍 현장에서 참가자들이 실습하는 모습",
      caption: "제조기업 AI 업무 자동화 워크숍 현장",
    },
    galleryCount: 3,
  },
  {
    slug: "startup-vibe-coding",
    title: "스타트업 Vibe Coding 과정",
    industry: "IT 스타트업 (익명)",
    audience: "기획자 및 디자이너",
    participants: "15명",
    duration: "4주 프로젝트형 과정",
    task: "사내 업무 도구 제작",
    format: "오프라인 · 프로젝트형",
    outcome: "작동 가능한 웹 기반 업무 도구",
    accent: "red",
    coverImage: {
      src: "/education/education-case-02.jpg",
      alt: "스타트업 Vibe Coding 과정에서 참가자가 노트북으로 결과물을 만드는 모습",
      caption: "스타트업 Vibe Coding 과정, 4주간의 제작 현장",
    },
    galleryCount: 2,
  },
];

/** 고객 후기 (docs §17) — 문서 카피 그대로. */
export type EduReview = {
  quote: string;
  industry: string;
  program: string;
  accent: Accent;
};

export const eduReviews: EduReview[] = [
  {
    quote:
      "AI 도입을 막연하게만 생각했는데, 실제 업무에 바로 적용할 수 있었습니다.",
    industry: "제조업 · 운영팀",
    program: "AI 업무 활용 워크숍",
    accent: "blue",
  },
  {
    quote:
      "강의가 아니라 함께 만드는 과정이라 교육이 끝난 뒤에도 직접 활용할 수 있었습니다.",
    industry: "IT 서비스 · 기획팀",
    program: "Vibe Coding",
    accent: "mint",
  },
  {
    quote: "아이디어만 있던 서비스가 교육 과정에서 작동하는 프로토타입이 됐습니다.",
    industry: "초기 스타트업 · 대표",
    program: "AI Prototype Lab",
    accent: "coral",
  },
];

/**
 * FAQ (docs §18). 문서 "초기 FAQ"에 실제로 실려 있는 문항은 개인 4 + 기업 4 =
 * 총 8개다(기획서 §33 제목의 "9개"는 문서 본문과 불일치 — CLAUDE.md 규칙대로
 * 문서 본문(§18) 원문을 그대로 따른다).
 */
export type FaqCategory = "개인 프로그램" | "기업 교육";

export type FaqItem = {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
};

export const eduFaqs: FaqItem[] = [
  {
    id: "no-dev-experience",
    category: "개인 프로그램",
    question: "개발 경험이 없어도 참여할 수 있나요?",
    answer:
      "네. AI 활용 입문과 Vibe Coding 등은 비개발자도 참여할 수 있도록 구성합니다. 프로그램별로 권장 수준과 준비 사항을 안내합니다.",
  },
  {
    id: "outputs",
    category: "개인 프로그램",
    question: "교육 과정에서 어떤 결과물을 만들게 되나요?",
    answer:
      "프로그램에 따라 웹페이지, 업무 자동화 흐름, AI 활용 템플릿, 프로토타입과 사내 업무 도구 등을 직접 제작합니다.",
  },
  {
    id: "laptop",
    category: "개인 프로그램",
    question: "노트북이나 별도 프로그램을 준비해야 하나요?",
    answer:
      "실습형 과정은 개인 노트북이 필요할 수 있습니다. 필요한 계정과 설치 도구는 교육 전에 별도로 안내합니다.",
  },
  {
    id: "online",
    category: "개인 프로그램",
    question: "온라인 교육도 진행하나요?",
    answer:
      "프로그램에 따라 온라인, 오프라인 또는 혼합 방식으로 운영합니다. 모집 과정별 상세 안내에서 확인할 수 있습니다.",
  },
  {
    id: "curriculum-change",
    category: "기업 교육",
    question: "기업 상황에 맞게 커리큘럼을 변경할 수 있나요?",
    answer:
      "가능합니다. 참여자의 직무와 AI 활용 수준, 교육 인원, 해결하고 싶은 업무를 확인한 뒤 맞춤형 커리큘럼을 제안합니다.",
  },
  {
    id: "size-and-time",
    category: "기업 교육",
    question: "교육 인원과 진행 시간은 어떻게 정해지나요?",
    answer:
      "단기 특강부터 하루 워크숍, 여러 주에 걸친 프로젝트 과정까지 교육 목표와 참여 인원에 맞게 협의합니다.",
  },
  {
    id: "internal-data",
    category: "기업 교육",
    question: "기업 내부 자료를 교육 과제로 활용할 수 있나요?",
    answer:
      "보안 범위를 사전에 협의한 뒤 실제 업무 문서나 프로세스를 실습 과제로 활용할 수 있습니다. 민감한 정보는 비식별화하거나 별도 예제로 대체합니다.",
  },
  {
    id: "after-materials",
    category: "기업 교육",
    question: "교육 후에도 활용할 수 있는 자료가 제공되나요?",
    answer:
      "과정에 따라 실습 자료, 업무 템플릿, 프롬프트, 제작 결과물과 후속 실행 가이드를 제공합니다.",
  },
];

/** 기업 교육 문의 폼 — 관심 프로그램 옵션 (docs §20). */
export const inquiryProgramOptions = [
  "AI 활용 입문",
  "AI 업무 활용",
  "AI 업무 자동화",
  "Vibe Coding",
  "AI Prototype Lab",
  "웹·앱 제작",
  "기업 맞춤형 교육",
  "아직 결정하지 못함",
] as const;

/** 기업 교육 문의 폼 — 교육 방식 옵션 (docs §20). */
export const inquiryFormatOptions = [
  "오프라인",
  "온라인",
  "온·오프라인 혼합",
  "협의 필요",
] as const;

/** 기업 교육 문의 폼 — 현재 AI 활용 수준 옵션 (docs §20). */
export const inquiryAiLevelOptions = [
  "AI를 거의 사용하지 않음",
  "개별 구성원이 일부 사용",
  "업무에 부분적으로 활용",
  "자동화 또는 사내 도구를 운영 중",
  "잘 모르겠음",
] as const;
