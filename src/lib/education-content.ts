/**
 * Education 페이지 콘텐츠 (docs/KPOPSOFT_Education_Page_ver3.md).
 *
 * ver3에서 프로그램 구조가 평면 6개 → **3분류 체계**로 바뀌었다.
 *   01. 조직·기업 맞춤 교육
 *   02. 정규 클래스 (하위 4과정)
 *   03. 지식 공유 커뮤니티 클럽 / 바이브데이즈
 * 이 분류는 홈(핵심 비즈니스·포트폴리오 필터·Contact 세부 유형)과 공유하는
 * 단일 체계다 — `site.ts`의 `businessCategory`와 이름을 맞춰 둔다.
 *
 * DB 스키마는 아직 없어 전부 정적 데이터다. Admin 연동은 이번 범위 밖이지만,
 * 나중에 Supabase 어댑터로 교체할 때 타입만 재사용하면 되도록 필드를 구성했다.
 * 강사진은 이미 DB 연동된 `getPublicExperts()`(src/lib/public-content.ts)를
 * 그대로 재사용하고 여기서 다시 정의하지 않는다.
 *
 * 파일 하단 "레거시" 블록은 ver3에서 페이지 노출이 빠진 섹션들이 쓰는 데이터다.
 * 컴포넌트 파일을 지우지 않기로 했으므로(되돌리기 쉽게) export도 함께 남긴다.
 */

import type { Accent } from "@/lib/site";

/** Education 페이지 전용 앵커. `educationSectionId`(site.ts)에 없는 것만 여기 둔다. */
export const eduSectionId = {
  /** ver3 신설 — 3분류 각각의 앵커. 홈 Contact 세부 유형이 여기로 넘어온다. */
  programOrg: "program-org",
  programRegular: "program-regular",
  programClub: "program-club",
  stats: "education-stats",
  pastPrograms: "past-programs",
  instructors: "instructors",
  reviews: "reviews",
  faq: "faq",

  // 아래는 ver3에서 페이지 노출이 빠진 섹션들의 앵커 (컴포넌트 보존용).
  purpose: "purpose",
  outputs: "outputs",
  vibedays: "vibedays-club",
  howWeLearn: "how-we-learn",
  process: "education-process",
  cases: "education-cases",
} as const;

export type EduImage = { src: string; alt: string; caption?: string };

/* ------------------------------------------------------------------ *
 * 교육 3분류
 * ------------------------------------------------------------------ */

export type EduCategoryId = "org" | "regular" | "club";

export type EduCategory = {
  id: EduCategoryId;
  /** 정식 명칭 — 홈/교육 전 영역에서 이 문자열을 그대로 쓴다. */
  name: string;
  /** 좁은 UI(필터 칩·배지)용 축약형. */
  shortName: string;
  description: string;
  anchor: string;
  accent: Accent;
};

export const eduCategories: EduCategory[] = [
  {
    id: "org",
    name: "조직·기업 맞춤 교육",
    shortName: "조직·기업",
    description: "회사 상황과 직무에 맞춰 커리큘럼 설계 및 제공",
    anchor: eduSectionId.programOrg,
    accent: "navy",
  },
  {
    id: "regular",
    name: "정규 클래스",
    shortName: "정규 클래스",
    description: "실무에 바로 쓰는 4가지 과정",
    anchor: eduSectionId.programRegular,
    accent: "blue",
  },
  {
    id: "club",
    name: "지식 공유 커뮤니티 클럽 / 바이브데이즈",
    shortName: "커뮤니티 클럽",
    description: "혼자가 아니라 함께, 매월 실험하고 피드백받는 커뮤니티",
    anchor: eduSectionId.programClub,
    accent: "mint",
  },
];

/* ------------------------------------------------------------------ *
 * 01. 조직·기업 맞춤 교육
 * ------------------------------------------------------------------ */

export const orgTraining = {
  title: "회사 상황과 직무에 맞춰 설계합니다.",
  description:
    "인원, 직무, 기간에 따라 커리큘럼을 맞춤형으로 구성합니다.\n팀 단위(5명 이상)부터 진행 가능합니다.",
  minParticipants: "5명 이상",
  image: {
    src: "/education/education-b2b-01.jpg",
    alt: "기업 맞춤형 교육 워크숍에서 참가자들이 모여 협업하는 모습",
    caption: "조직·기업 맞춤 교육, 조직 과제를 함께 다루는 워크숍 현장",
  } satisfies EduImage,
  cta: { label: "기업 교육 문의하기" },
} as const;

/* ------------------------------------------------------------------ *
 * 02. 정규 클래스 — 4과정
 * ------------------------------------------------------------------ */

export const regularClassIntro = {
  eyebrow: "정규 클래스 교육 과정",
  title: "실무에 바로 쓰는 4가지 과정",
  description: "이론이 아닌 결과물 중심. 수료하면 포트폴리오가 생깁니다.",
} as const;

export type RegularClass = {
  slug: string;
  index: string;
  /** 과정명 */
  name: string;
  /** 한 줄 부제 */
  subtitle: string;
  description: string;
  /** "4주" */
  duration: string;
  /** "입문·중급" */
  level: string;
  accent: Accent;
  image?: EduImage;
  /**
   * 주차별 커리큘럼 초안 — 사용자 컨펌 대기 중.
   * IA에는 기간·난이도만 있고 커리큘럼 근거가 없어 Claude가 작성했다.
   */
  curriculum: string[];
  /** 상세 페이지 경로. 페이지 자체는 2차 범위라 아직 없다(§7). */
  detailHref: string;
  seo: { title: string; description: string };
};

export const regularClasses: RegularClass[] = [
  {
    slug: "ai-tools",
    index: "01",
    name: "AI 활용",
    subtitle: "AI 도구 마스터",
    description:
      "ChatGPT, Claude, Cursor 등 현업에서 즉시 쓸 수 있는 AI 툴을 실무 프로젝트와 함께 배웁니다.",
    duration: "4주",
    level: "입문·중급",
    accent: "blue",
    image: {
      src: "/education/education-lecture-01.jpg",
      alt: "AI 활용 과정에서 강사가 화면을 보며 실무 활용법을 설명하는 모습",
      caption: "AI 활용 과정, 실제 업무 사례로 진행하는 강의",
    },
    curriculum: [
      "1주 — 주요 AI 도구 지형 파악과 계정·환경 세팅",
      "2주 — 프롬프트 설계: 업무 문서·조사·기획에 적용하기",
      "3주 — 내 업무 과제 하나를 골라 AI로 처리하는 실습",
      "4주 — 팀에 공유할 프롬프트·템플릿 정리와 발표",
    ],
    detailHref: "/education/programs/ai-tools",
    seo: {
      title: "AI 활용 | KPOPSOFT Education",
      description:
        "ChatGPT, Claude, Cursor 등 현업에서 즉시 쓸 수 있는 AI 툴을 실무 프로젝트와 함께 배우는 4주 과정입니다.",
    },
  },
  {
    slug: "vibe-coding",
    index: "02",
    name: "Vibe Coding",
    subtitle: "AI와 함께 코딩하기",
    description:
      "코드를 몰라도 괜찮습니다. AI를 페어 프로그래머로 삼아 아이디어를 실제 소프트웨어로 만드세요.",
    duration: "6주",
    level: "비개발자 환영",
    accent: "red",
    image: {
      src: "/education/education-practice-01.jpg",
      alt: "Vibe Coding 과정에서 참가자들이 각자 노트북으로 직접 만들어보는 모습",
      caption: "Vibe Coding 과정, 직접 만들면서 배우는 실습 시간",
    },
    curriculum: [
      "1주 — AI와 대화하며 만드는 방식 이해, 개발 환경 준비",
      "2주 — 만들 것 정하기: 아이디어를 화면과 기능으로 쪼개기",
      "3~4주 — AI와 함께 화면 만들기, 막히는 지점 해결하는 법",
      "5주 — 데이터 붙이기와 실제 동작 확인",
      "6주 — 배포하고 다른 사람에게 보여주기",
    ],
    detailHref: "/education/programs/vibe-coding",
    seo: {
      title: "Vibe Coding | KPOPSOFT Education",
      description:
        "코드를 몰라도 AI를 페어 프로그래머로 삼아 아이디어를 실제 소프트웨어로 만드는 6주 과정입니다.",
    },
  },
  {
    slug: "web-app",
    index: "03",
    name: "웹·앱 제작",
    subtitle: "나만의 서비스 만들기",
    description:
      "기획부터 배포까지. 웹사이트와 모바일 앱을 직접 설계하고 완성하는 실전 코스입니다.",
    duration: "8주",
    level: "중급",
    accent: "yellow",
    image: {
      src: "/education/education-workshop-01.jpg",
      alt: "웹·앱 제작 과정 워크숍에서 참가자들이 화면 설계를 함께 검토하는 모습",
      caption: "웹·앱 제작 과정, 기획부터 배포까지 8주간의 실전 코스",
    },
    curriculum: [
      "1~2주 — 서비스 기획: 사용자와 핵심 기능 정의, 화면 설계",
      "3~4주 — 웹 화면 제작과 반응형 대응",
      "5주 — 데이터 설계와 연동",
      "6주 — 모바일 앱 화면으로 확장",
      "7주 — 테스트와 다듬기",
      "8주 — 배포와 운영 점검, 최종 발표",
    ],
    detailHref: "/education/programs/web-app",
    seo: {
      title: "웹·앱 제작 | KPOPSOFT Education",
      description:
        "기획부터 배포까지 웹사이트와 모바일 앱을 직접 설계하고 완성하는 8주 실전 과정입니다.",
    },
  },
  {
    slug: "automation",
    index: "04",
    name: "업무 자동화",
    subtitle: "반복 업무 자동화",
    description: "보고서 자동화, 데이터 수집, 알림 시스템을 직접 구축합니다.",
    duration: "3주",
    level: "입문·중급",
    accent: "mint",
    image: {
      src: "/education/education-coaching-01.jpg",
      alt: "업무 자동화 과정에서 강사가 참가자 옆에서 자동화 설정을 1:1로 안내하는 모습",
      caption: "업무 자동화 과정, 내 업무에 맞춰 함께 설계하는 코칭 시간",
    },
    curriculum: [
      "1주 — 내 반복 업무 찾아내기와 자동화 가능 범위 판단",
      "2주 — 데이터 수집·가공·보고서 생성 흐름 만들기",
      "3주 — 알림 연결과 운영 점검, 팀에 넘기는 문서 정리",
    ],
    detailHref: "/education/programs/automation",
    seo: {
      title: "업무 자동화 | KPOPSOFT Education",
      description:
        "보고서 자동화, 데이터 수집, 알림 시스템을 직접 구축하는 3주 과정입니다.",
    },
  },
];

/* ------------------------------------------------------------------ *
 * 03. 지식 공유 커뮤니티 클럽 / 바이브데이즈
 * ------------------------------------------------------------------ */

/**
 * 기수 모집 상태 (docs ver3 "모집 상태 구조").
 *
 * 날짜 자동 계산에 의존하지 않는다 — 조기 마감이나 연장 같은 운영 판단이
 * 달력보다 우선하기 때문이다. 상태는 항상 명시적으로 지정한다.
 */
export type CohortStatus =
  /** 모집 예정 — 일정만 안내, 신청 버튼 비활성 */
  | "upcoming"
  /** 모집 중 — 가격·정원·신청 버튼 노출 */
  | "open"
  /** 모집 마감 — 버튼을 없애지 않고 비활성 + 사유 표기 */
  | "closed"
  /** 운영 종료 — 기수 블록 자체를 숨김 */
  | "ended";

/** 상태별 표시 문구 — 컴포넌트가 조건 분기를 직접 쓰지 않도록 여기 모은다. */
export const cohortStatusLabel: Record<CohortStatus, string> = {
  upcoming: "모집 예정",
  open: "모집 중",
  closed: "모집 마감",
  ended: "운영 종료",
};

export type ClubCohort = {
  id: string;
  /** "1기" */
  label: string;
  status: CohortStatus;
  /** "2026년 8월" */
  recruitPeriod: string;
  /** "2026년 9월 ~ 12월 (4개월)" */
  runPeriod: string;
  price?: string;
  /**
   * 할인 전 정가. 있으면 `price` 옆에 취소선으로 함께 보여준다.
   * 없으면 정가 없이 `price` 하나만 나온다 — 할인이 없는 기수를 위해 optional.
   */
  listPrice?: string;
  capacity?: string;
  /** 마감·연기 등 상태를 보충하는 한 줄. `closed`일 때 사유로 쓴다. */
  note?: string;
  /**
   * 요소별 노출 토글. 가격 미정 상태로 모집 예고만 띄우는 경우가 있어
   * 상태값과 별개로 각각 끌 수 있어야 한다.
   */
  show: {
    price: boolean;
    capacity: boolean;
    schedule: boolean;
    cta: boolean;
  };
};

export const clubCohorts: ClubCohort[] = [
  {
    id: "cohort-1",
    label: "1기",
    status: "open",
    recruitPeriod: "2026년 8월",
    runPeriod: "2026년 9월 ~ 12월 (4개월)",
    price: "79,000원",
    listPrice: "99,000원",
    capacity: undefined, // 정원 미정 — show.capacity를 false로 둔다.
    show: { price: true, capacity: false, schedule: true, cta: true },
  },
  {
    id: "cohort-2",
    label: "2기",
    status: "upcoming",
    recruitPeriod: "2026년 12월 예정",
    runPeriod: "2027년 1월 ~ 4월 (4개월)",
    show: { price: false, capacity: false, schedule: true, cta: false },
  },
  {
    id: "cohort-3",
    label: "3기",
    status: "upcoming",
    recruitPeriod: "미정",
    runPeriod: "2027년 5월 ~ 8월 (4개월)",
    show: { price: false, capacity: false, schedule: true, cta: false },
  },
  {
    id: "cohort-4",
    label: "4기",
    status: "upcoming",
    recruitPeriod: "미정",
    runPeriod: "2027년 9월 ~ 12월 (4개월)",
    show: { price: false, capacity: false, schedule: true, cta: false },
  },
];

/**
 * 화면에 띄울 현재 기수. `ended`는 제외하고 가장 앞선 기수를 고른다.
 * 노출할 기수가 하나도 없으면 `undefined` — 이때 모달은 소개 콘텐츠만 보여주고
 * 모집 영역을 비운다(모달 자체가 사라지면 안 된다).
 */
export function getActiveCohort(
  cohorts: ClubCohort[] = clubCohorts,
): ClubCohort | undefined {
  return (
    cohorts.find((c) => c.status === "open") ??
    cohorts.find((c) => c.status === "closed") ??
    cohorts.find((c) => c.status === "upcoming")
  );
}

/** 모달에 함께 나열할 예정 기수 (현재 기수 제외, `ended` 제외). */
export function getUpcomingCohorts(
  cohorts: ClubCohort[] = clubCohorts,
): ClubCohort[] {
  const active = getActiveCohort(cohorts);
  return cohorts.filter((c) => c.status !== "ended" && c.id !== active?.id);
}

export const clubIntro = {
  eyebrow: "지식 공유 커뮤니티 클럽 / VIBEDAYS",
  headline: "성장하는 원동력을 찾고 있다면?",
  subheadline: "이런 분이라면 바이브데이즈 클럽이 딱이에요!",
  /** 브랜드 정의 문장 — 참여 유형 소개로 넘어가기 전 한 번 짚는다. */
  tagline: "여러 바이브데이저들의 성장의 날들이 모여\n바이브데이즈를 만듭니다",
  cardSummary:
    "혼자서는 어려웠던 AI 학습,\n실험부터 피드백까지의 선순환을 매월 경험하세요.",
  closing:
    "혼자서는 어려웠던 AI 학습,\n실험부터 피드백까지의 선순환을 매월 경험하세요.",
  image: {
    /**
     * 벡터판 키비주얼. 같은 아트워크의 PNG(`/vibedays_main_01.png`)와 달리
     * 워드마크·태그라인이 빠져 있는데, 카드에 이미 eyebrow로 클럽 이름이
     * 적혀 있어 중복되지 않는 편이 낫다.
     */
    src: "/assets/vibedays-main.svg",
    alt: "VIBEDAYS 캐릭터들이 vibe code · build together · ship good vibes · repeat 가 적힌 터미널 옆에 서 있는 그림",
  } satisfies EduImage,
} as const;

/** 참여 유형 3단계 (docs ver3 — ver2의 NEW VIBER/VIBE MAKER/VIBE SHARER 대체). */
export type ClubTier = {
  name: string;
  role: string;
  points: string[];
  accent: Accent;
  /**
   * 참여 유형별 VIBEDAYS 캐릭터. 세 캐릭터는 이 세 단계를 그리려고 만든
   * 자산이라 1:1로 붙는다. 카드 배경색(`accent`)과 캐릭터 색은 일부러
   * 다르게 둔다 — 같으면 캐릭터가 배경에 묻힌다.
   *
   * 원본 크기는 셋이 제각각이라 파일별로 적어 둔다. 한 값으로 뭉뚱그리면
   * next/image가 잘못된 비율로 자리를 잡아 캐릭터 옆에 빈 여백이 생긴다.
   */
  character: { src: string; width: number; height: number };
};

export const clubTiers: ClubTier[] = [
  {
    name: "마스터 바이브데이저",
    role: "지식과 솔루션을 나누는 사람",
    points: [
      "지식기여자로 성장하고 오디언스를 획득하고 싶은 분",
      "개인 브랜딩이 필요한 분",
    ],
    accent: "red",
    character: {
      src: "/assets/vibedays-role-master.svg",
      width: 333,
      height: 511,
    },
  },
  {
    name: "액티브 바이브데이저",
    role: "경험을 나누는 사람",
    points: ["다양한 바이브데이저와 교류하며 성장하고 싶은 분"],
    accent: "yellow",
    character: {
      src: "/assets/vibedays-role-active.svg",
      width: 306,
      height: 407,
    },
  },
  {
    name: "바이브데이저",
    role: "함께 배우는 사람",
    points: [
      "내 업무에 AI를 반영하고 효율화하고 싶은 분",
      "다른 동료들과 함께 AI를 학습하고 싶은 분",
      "함께 성장하고 싶은 분",
    ],
    accent: "mint",
    character: {
      src: "/assets/vibedays-role-vibedayser.svg",
      width: 249,
      height: 367,
    },
  },
];

/** 운영 방식 — 기수와 무관하게 유지되는 내용. */
export const clubOperation = {
  meeting: "월 1회 오프라인 세미나 모임",
  points: [
    "월별 공통 미션 주제 중 선택 후 과업 진행하기",
    "과업별 진행 방법 및 힌트집 제공",
    "자유롭게 진행 후 진행 과정 공유 및 막히는 지점 질의응답 시간을 바이브데이즈 정기 모임에서 해결함",
    "미참석자에게도 세미나 회의록 요약본 내용 제공",
  ],
} as const;

/* ------------------------------------------------------------------ *
 * 지난 프로그램 (ver3 신설 — ver2 "교육 사례"를 계승)
 * ------------------------------------------------------------------ */

export type PastProgram = {
  slug: string;
  title: string;
  /** 3분류 중 어디에 속하는지 */
  category: EduCategoryId;
  /** 진행 시기 — "2026년 3월" */
  period: string;
  audience: string;
  participants: string;
  duration: string;
  /** 한 줄 요약 */
  summary: string;
  outcome: string;
  accent: Accent;
  coverImage: EduImage;
  /** 상세 갤러리에 더 있음을 나타내는 보조 이미지 수 ("+3" 표시). */
  galleryCount: number;
};

// 기업명은 익명화한다(ver2 §24 유지). 수치는 실제 데이터 확보 전까지 더미.
export const pastPrograms: PastProgram[] = [
  {
    slug: "manufacturing-automation-workshop",
    title: "제조기업 AI 업무 자동화 워크숍",
    category: "org",
    period: "2026년 3월", // 더미
    audience: "운영 및 관리 실무자",
    participants: "30명", // 더미
    duration: "6시간 실습형 워크숍",
    summary: "반복 보고서 작성과 데이터 정리를 자동화했습니다.",
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
    slug: "ai-web-app-class",
    title: "AI 웹앱 만들기 과정",
    category: "regular",
    period: "2026년 5월", // 더미
    audience: "AI·코딩 입문자",
    participants: "15명", // 더미
    duration: "2회차 실습형 과정",
    summary: "코딩 경험 없이 AI와 함께 웹앱을 만들어 배포했습니다.",
    outcome: "데일리 노트 웹페이지와 카테고리 Todo 앱(배포까지 완료)",
    accent: "red",
    coverImage: {
      src: "/education/education-case-02.jpg",
      alt: "AI 웹앱 만들기 과정에서 참가자가 노트북으로 결과물을 만드는 모습",
      caption: "AI 웹앱 만들기 과정, 2회차 동안의 제작 현장",
    },
    galleryCount: 2,
  },
  {
    slug: "gemini-oneday-class",
    title: "Gemini 원데이클래스",
    category: "regular",
    period: "2026년 6월", // 더미
    audience: "구글 계정만 있는 입문자",
    participants: "20명", // 더미
    duration: "2시간 원데이클래스",
    summary: "무료 도구만으로 2시간 만에 결과물 다섯 개를 만들었습니다.",
    outcome: "요약본 · 리서치 보고서 · 캔버스 문서 · 이미지 · 나만의 Gem",
    accent: "mint",
    coverImage: {
      src: "/education/education-lecture-01.jpg",
      alt: "Gemini 원데이클래스에서 강사가 화면을 보며 활용법을 설명하는 모습",
      caption: "Gemini 원데이클래스, 2시간 만에 결과물까지 만드는 현장",
    },
    galleryCount: 2,
  },
];

/* ------------------------------------------------------------------ *
 * 통계바 (ver3 신설)
 * ------------------------------------------------------------------ */

export type EduStat = { value: string; label: string };

// 실제 수치 확보 전까지 더미. 홈 통계바(1,800+ / 96%)와 모순되지 않게 맞춰 둔다.
export const eduStats: EduStat[] = [
  { value: "1,800+", label: "교육 수료생" },
  { value: "4", label: "정규 클래스" },
  { value: "96%", label: "평균 만족도" },
  { value: "120+", label: "클럽 참가자" }, // 더미
];

/* ------------------------------------------------------------------ *
 * 후기 (ver3 — 별점 + 리뷰형)
 * ------------------------------------------------------------------ */

export type EduReview = {
  id: string;
  /** 5점 만점 */
  rating: number;
  body: string;
  /** 표시용 익명 라벨 — 실제 닉네임은 싣지 않는다. */
  author: string;
  /** 수강 과정명 */
  program: string;
  /** "2026년 5월" */
  date: string;
  accent: Accent;
};

/**
 * 실제 수강생이 커뮤니티(AI기초교육 모임)에 남긴 일정 후기다.
 * 오탈자와 구어체를 그대로 두되, 문장부호와 띄어쓰기만 최소한으로 정리했다(ver3 §07).
 * `program`은 커뮤니티 일정명이 아니라 사이트의 정규 클래스 명칭으로 맞춘다.
 * 작성자는 닉네임 대신 수강 레벨만 표기한다 — 커뮤니티 안에서 쓰던 이름을
 * 공개 페이지로 옮기지 않기 위해서다.
 */
export const eduReviews: EduReview[] = [
  {
    id: "review-gemini-tools",
    rating: 5,
    body: "제게는 어렵지 않은 내용이었지만, 새로운 기능도 알게 되었고 이미지나 Gems 등은 바로 써먹을 수 있는 내용들이어서 좋았습니다. 오늘도 좋은 강의 감사합니다.",
    author: "입문 과정 수강생",
    program: "Gemini 원데이클래스",
    date: "2026년 7월",
    accent: "mint",
  },
  {
    id: "review-basic-fun",
    rating: 5,
    body: "재밌는 교육이었습니다. 아이디어가 실제로 어떻게 사용되는지 알 수 있는 좋은 시간이었고, 다른 분들도 적극적으로 도와주시고 놓친 것 없는지 챙겨주셔서 수월하게 따라갈 수 있었습니다! 다음에 또 이런 재밌는 교육 있으면 듣고 싶네요!",
    author: "입문 과정 수강생",
    program: "AI 웹앱 만들기",
    date: "2026년 7월",
    accent: "blue",
  },
  {
    id: "review-upgrade",
    rating: 5,
    body: "짧은 시간에 많은 것을 배울 수 있었고, 실력을 업그레이드하는 계기가 되었습니다. 강의 준비를 많이 했다는 느낌을 받았습니다.",
    author: "중급 과정 수강생",
    program: "AI 웹앱 만들기",
    date: "2026년 7월",
    accent: "red",
  },
  {
    id: "review-deploy",
    rating: 5,
    body: "오늘 수업에서 나만의 Todolist를 만들어봤는데, 제가 만든 걸 링크로 공유할 수 있게 연결부터 배포라는 과정까지 배울 수 있어서 좋았어요.",
    author: "입문 과정 수강생",
    program: "AI 웹앱 만들기",
    date: "2026년 6월",
    accent: "yellow",
  },
  {
    id: "review-pinpoint",
    rating: 5,
    body: "제가 궁금했던 내용을 콕콕 집어서 설명해주셔서 많은 도움 되었어요. 오늘 설명 수고하셨습니다.",
    author: "입문 과정 수강생",
    program: "AI 웹앱 만들기",
    date: "2026년 7월",
    accent: "coral",
  },
  // 자리 하나가 비어 있다 — "진도를 못 따라간다"는 후기를 뺐고, 대체할
  // 실제 후기를 아직 받지 못했다. 후기는 지어내지 않는다(실제 수강생이 쓴
  // 글만 싣는다). 새 후기가 들어오면 여기에 그대로 추가한다.
];

/** 평균 별점 — 후기 목록에서 계산한다. 상단 요약에 쓴다. */
export function getAverageRating(reviews: EduReview[] = eduReviews): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/* ------------------------------------------------------------------ *
 * FAQ (ver3 — 개인/기업 구분 폐지, 단일 목록 4문항)
 * ------------------------------------------------------------------ */

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const eduFaqs: FaqItem[] = [
  {
    id: "no-coding",
    question: "코딩을 전혀 몰라도 수강할 수 있나요?",
    answer:
      "네, 가능합니다. Vibe Coding이나 AI 활용 과정은 비개발자도 충분히 따라올 수 있도록 설계되어 있습니다. 코드보다 개념과 실습에 집중합니다.",
  },
  {
    id: "org-minimum",
    question: "조직 교육은 최소 몇 명부터 가능한가요?",
    answer:
      "팀 단위(5명 이상)부터 가능합니다. 인원, 직무, 기간에 따라 맞춤형으로 설계해 드립니다.",
  },
  {
    id: "after-support",
    question: "수료 후 지원이 있나요?",
    answer:
      "네. 수료 후 카카오톡 오픈채팅 커뮤니티에서 질의응답 지원과 피드백을 제공합니다.",
  },
  {
    // IA에 없는 4번째 문항 — 진행 방식 문의가 잦을 것으로 보고 추가.
    id: "online-offline",
    question: "정규 클래스는 온라인인가요, 오프라인인가요?",
    answer:
      "정규 클래스는 오프라인으로 진행합니다. 조직·기업 맞춤 교육은 방문 교육까지 가능하고, 바이브데이즈 클럽은 월 1회 오프라인 모임을 함께 운영합니다.",
  },
];

/* ------------------------------------------------------------------ *
 * 문의 폼 옵션
 * ------------------------------------------------------------------ */

/** 관심 프로그램 옵션 — 3분류를 그대로 쓴다(ver3 §09). */
export const inquiryProgramOptions = [
  ...eduCategories.map((c) => c.name),
  "아직 결정하지 못함",
] as const;

export const inquiryFormatOptions = [
  "오프라인",
  "온라인",
  "온·오프라인 혼합",
  "협의 필요",
] as const;

export const inquiryAiLevelOptions = [
  "AI를 거의 사용하지 않음",
  "개별 구성원이 일부 사용",
  "업무에 부분적으로 활용",
  "자동화 또는 사내 도구를 운영 중",
  "잘 모르겠음",
] as const;

/* ================================================================== *
 * 레거시 — ver3에서 페이지 노출이 빠진 섹션들의 데이터
 *
 * 컴포넌트 파일을 지우지 않기로 했으므로(되돌리기 쉽게) 여기 export도 남긴다.
 * 페이지에서 import하지 않을 뿐 타입 체크 대상이라 삭제하면 빌드가 깨진다.
 * 되살릴 계획이 없어지면 컴포넌트와 함께 정리한다.
 * ================================================================== */

/** @deprecated ver3에서 `regularClasses` + `orgTraining`으로 대체됨. */
export type EduProgram = {
  slug: string;
  index: string;
  name: string;
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

/** @deprecated ver3에서 `regularClasses`로 대체됨. */
export const eduPrograms: EduProgram[] = [];

/** @deprecated ver3에서 교육 결과물 섹션이 빠졌다. */
export type EduOutput = {
  title: string;
  categoryLabel: string;
  description: string;
  caption: string;
  accent: Accent;
  image?: EduImage;
};

/** @deprecated */
export const eduOutputs: EduOutput[] = [];

/** @deprecated ver3에서 `clubTiers`로 대체됨. */
export type VibedaysRole = {
  name: string;
  title: string;
  description: string;
  image: string;
};

/** @deprecated */
export const vibedaysRoles: VibedaysRole[] = [];

/** @deprecated ver3에서 교육 방식 섹션이 빠졌다. */
export const howWeLearnItems: ReadonlyArray<{
  index: string;
  title: string;
  description: string;
}> = [];

/** @deprecated ver3에서 조직·기업 맞춤 교육 블록으로 흡수됨. */
export const orgTrainingFormats: ReadonlyArray<string> = [];

/** @deprecated */
export const orgTrainingDesignItems: ReadonlyArray<string> = [];

/** @deprecated ver3에서 교육 진행 프로세스 섹션이 빠졌다. */
export const eduProcessSteps: ReadonlyArray<{
  index: string;
  title: string;
  description: string;
  accent: Accent;
}> = [];

/** @deprecated ver3에서 `PastProgram`으로 대체됨. */
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
  galleryCount: number;
};

/** @deprecated */
export const eduCases: EduCase[] = [];
