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

export type EduImage = {
  src: string;
  alt: string;
  caption?: string;
  /** 브라우저나 개발 서버의 이미지 최적화 캐시를 우회해야 하는 로컬 에셋. */
  unoptimized?: boolean;
};

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
 * 교육 목적 선택 — 3분류로 가는 탐색 장치
 * ------------------------------------------------------------------ */

/**
 * 목적 카드 (수정 요청서 §5). 카드를 고르면 프로그램 섹션으로 스크롤하면서
 * `category`가 가리키는 블록이 활성화되고, `track`이 있으면 정규 클래스 중
 * 그 트랙의 과정이 앞으로 정렬된다.
 *
 * 카드가 3장인데 목적지가 2곳(조직·기업 / 정규 클래스)인 건 의도된 것이다 —
 * "AI 입문"과 "실무 활용"은 같은 정규 클래스로 가되 **먼저 보이는 과정이
 * 다르다.** 방문자에게 자기 언어로 두 갈래를 주면서 상품 체계는 건드리지
 * 않는 방법이다. 바이브데이즈는 목적이 아니라 지속형 활동이라 여기 없다.
 */
export type EduPurpose = {
  id: string;
  index: string;
  title: string;
  description: string;
  /** 이 목적이 도달할 프로그램 분류. */
  category: EduCategoryId;
  /** 정규 클래스로 갈 때 앞세울 트랙. 조직·기업은 해당 없음. */
  track?: EduTrack;
  accent: Accent;
};

export const eduPurposes: EduPurpose[] = [
  {
    id: "beginner",
    index: "01",
    title: "AI 입문",
    description: "AI를 처음 접하는 입문자를 위한 기초 실습 교육",
    category: "regular",
    track: "beginner",
    accent: "sky",
  },
  {
    id: "practical",
    index: "02",
    title: "실무 활용",
    description: "반복 업무를 줄이고 생산성을 높이는 직무별 AI 교육",
    category: "regular",
    track: "practical",
    accent: "blue",
  },
  {
    id: "org",
    index: "03",
    title: "기업·조직 교육",
    description: "조직의 목표와 업무 환경에 맞춰 설계하는 맞춤형 교육",
    category: "org",
    accent: "navy",
  },
];

/**
 * 선택한 목적에 맞춰 정규 클래스를 재정렬한다. **거르지 않고 순서만 바꾼다** —
 * 4과정뿐이라 한 화면에 다 들어오고, 감추면 "고른 것 말고는 없다"는 인상만
 * 남는다. 같은 트랙 안에서는 원래 순서(01~04)를 지켜 목록이 매번 다르게
 * 보이지 않게 한다.
 */
export function sortRegularClassesByTrack(
  track?: EduTrack,
  classes: RegularClass[] = regularClasses,
): RegularClass[] {
  if (!track) return classes;

  return [...classes].sort((a, b) => {
    const aMatch = a.tracks.includes(track) ? 0 : 1;
    const bMatch = b.tracks.includes(track) ? 0 : 1;
    return aMatch - bMatch;
  });
}

/**
 * 바이브데이즈 대표 이미지(키비주얼).
 *
 * 프로그램 카드와 아래 `clubIntro`가 함께 쓴다. 두 곳에 따로 적어 두면 자산을
 * 교체할 때 한쪽만 바뀐다. `programHighlights`가 이 파일 위쪽에 있어
 * `clubIntro`보다 먼저 선언해 둔다 — 뒤에 두면 초기화 순서에 걸린다.
 */
export const clubKeyVisual = {
  src: "/assets/vibedays-main.svg",
  alt: "VIBEDAYS 캐릭터들이 vibe code · build together · ship good vibes · repeat 가 적힌 터미널 옆에 서 있는 그림",
} as const;

/* ------------------------------------------------------------------ *
 * 프로그램 섹션 — 분류별 요약 (Sticky 패널이 읽는 공통 형식)
 * ------------------------------------------------------------------ */

/**
 * 세 분류를 같은 형식으로 요약한다 (수정 요청서 §7 "오른쪽: 실제 교육 사진,
 * 대상, 방식, 결과물").
 *
 * 분류마다 데이터 모양이 다르다 — 조직·기업은 단일 객체, 정규는 4과정 배열,
 * 클럽은 기수·티어 구조다. Sticky 패널이 그 셋을 각각 분해해서 그리면 분기가
 * 패널 안에 쌓이므로, **읽는 쪽이 원하는 형식으로 한 번만 정리**해 둔다.
 * 아래 값은 각 분류 데이터에서 뽑은 것이지 새로 지어낸 사실이 아니다.
 */
export type ProgramHighlight = {
  category: EduCategoryId;
  /** 누가 듣는가 */
  audience: string;
  /** 어떻게 진행하는가 */
  format: string;
  /** 무엇이 남는가 */
  outcome: string;
  image: EduImage;
  /**
   * 사진이 아니라 **그래픽**일 때 `contain`. 사진은 잘려도 분위기가 남지만
   * 키비주얼은 잘리는 순간 무엇을 그린 것인지 알 수 없게 된다.
   * `contain`이면 카드가 `backdropClass` 색을 깔고 그 위에 통째로 얹는다.
   */
  fit?: "cover" | "contain";
  backdropClass?: string;
};

export const programHighlights: ProgramHighlight[] = [
  {
    category: "org",
    audience: "팀 단위 5명 이상의 조직·기업",
    format: "인원·직무·기간에 맞춘 맞춤 설계, 방문 또는 온라인",
    outcome: "조직의 실제 과제를 다룬 커리큘럼과 실습 결과물",
    // 조직·기업 전용 사진(사용자 제공). 기존 `b2b-01`은 다른 카드와 같은
    // 강의실이라 세 카드가 구분되지 않았다.
    image: {
      src: "/education/education-org-01.png",
      alt: "기업 교육 현장에서 강사가 화면을 가리키며 설명하고 참가자들이 노트북으로 따라 하는 모습",
    },
  },
  {
    category: "regular",
    audience: "AI를 처음 쓰는 사람부터 실무에 붙이려는 직장인까지",
    format: "3~8주 오프라인 과정, 매 회차 실습 중심",
    outcome: "직접 만든 결과물 — 수료하면 포트폴리오가 남습니다",
    // 정규 과정 전용 사진(사용자 제공). 원본은 `public/work/정규교육과정.JPG`
    // 였는데, 교육 사진은 `public/education/`에 모여 있고 URL에 한글이 들어가면
    // 인코딩된 경로가 코드에 박히므로 옮기고 이름을 맞췄다.
    image: {
      src: "/education/education-regular-01.jpg",
      alt: "정규 교육 과정에서 참가자들이 각자 노트북으로 화면을 따라 만들어보는 모습",
    },
  },
  {
    category: "club",
    audience: "배운 것을 계속 이어가고 싶은 사람",
    format: "기수제 스터디와 세미나, 실무 커뮤니티",
    outcome: "매월 쌓이는 실험 기록과 함께 만드는 동료",
    /*
      사진이 아니라 바이브데이즈 대표 이미지(키비주얼)를 쓴다(사용자 지시).
      클럽은 강의가 아니라 브랜드를 가진 활동이라, 옆 두 카드와 같은 강의실
      사진보다 이쪽이 성격을 더 정확히 전한다.

      배경이 노랑인 이유 — 키비주얼의 세 캐릭터 중 하나가 민트라 민트 배경
      위에서는 형태가 묻힌다. 노랑은 검은 터미널과 세 캐릭터(민트·빨강·파랑)
      모두와 대비가 선다.
    */
    image: {
      src: clubKeyVisual.src,
      alt: clubKeyVisual.alt,
    },
    fit: "contain",
    backdropClass: "bg-brand-yellow",
  },
];

export function getProgramHighlight(category: EduCategoryId) {
  return programHighlights.find((item) => item.category === category);
}

/* ------------------------------------------------------------------ *
 * 01. 조직·기업 맞춤 교육
 * ------------------------------------------------------------------ */

/** 조직·기업 맞춤 교육은 상품이 하나뿐이라 목록이 아니라 단일 객체다. */
export type OrgTraining = {
  title: string;
  description: string;
  minParticipants: string;
  image: EduImage;
  cta: { label: string };
};

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

/**
 * 방문자가 스스로 밝히는 학습 목적 (교육 페이지 수정 요청서 §5).
 *
 * **프로그램 3분류와 다른 축이고, 그래야 한다.** 3분류(`EduCategoryId`)는 우리가
 * 실제로 운영하는 교육 상품의 체계고, 이 트랙은 처음 온 사람이 "나는 어느
 * 쪽인가"를 고르는 탐색 장치다. 둘을 같은 이름으로 통일하려 들면 안 된다 —
 * 상품 체계를 방문자 언어로 바꾸거나 그 반대가 되어 양쪽 다 망가진다.
 *
 * 트랙은 정규 클래스 안에서만 의미가 있다. 조직·기업 교육은 커리큘럼을 그때
 * 설계하므로 난이도가 고정돼 있지 않고, 커뮤니티 클럽은 애초에 "목적"이 아니라
 * 지속형 활동이라 목적 선택에 넣지 않는다(§5 사용자 결정).
 */
export type EduTrack =
  /** AI를 처음 접하는 사람 */
  | "beginner"
  /** 이미 쓰고 있고, 업무에 제대로 붙이고 싶은 사람 */
  | "practical";

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
  /**
   * 이 과정이 답이 되는 학습 목적. 목적 카드를 고르면 해당 트랙의 과정이
   * **앞으로 정렬**된다 — 나머지를 숨기지는 않는다. 4과정뿐이라 한 화면에 다
   * 들어오고, 감추면 "고른 것 말고는 없다"는 인상만 남기 때문이다.
   *
   * `level`(자유 문자열)과 별개로 둔 이유 — level은 사람이 읽는 표기라
   * "비개발자 환영"처럼 난이도가 아닌 값도 들어온다. 코드가 분기에 쓸 축은
   * 표기와 분리해야 문구를 다듬을 때 동작이 따라 깨지지 않는다.
   */
  tracks: EduTrack[];
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
    tracks: ["beginner", "practical"],
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
    tracks: ["beginner"],
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
    tracks: ["practical"],
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
    tracks: ["practical"],
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
  open: "준비 중",
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
   * 신청 버튼을 눌리지 않게 막는다. 상태는 `open`이지만 아직 신청을 받지
   * 않는 준비 기간을 위해 둔 스위치 — 버튼은 그대로 두고 비활성만 시킨다.
   */
  ctaDisabled?: boolean;
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
    ctaDisabled: true,
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
  duration: string;
  /** 한 줄 요약 */
  summary: string;
  outcome: string;
  accent: Accent;
  coverImage: EduImage;
  /** 대표 이미지 뒤에 이어지는 실제 현장·결과물 이미지. */
  galleryImages?: EduImage[];
};

// 기업명은 익명화한다(ver2 §24 유지). 수치는 실제 데이터 확보 전까지 더미.
export const pastPrograms: PastProgram[] = [
  {
    slug: "manufacturing-automation-workshop",
    title: "제조기업 AI 업무 자동화 워크숍",
    category: "org",
    period: "2026년 3월", // 더미
    audience: "운영 및 관리 실무자",
    duration: "6시간 실습형 워크숍",
    summary: "반복 보고서 작성과 데이터 정리를 자동화했습니다.",
    outcome: "부서별 AI 업무 템플릿과 자동화 흐름",
    accent: "yellow",
    coverImage: {
      src: "/education/education-case-01.jpg",
      alt: "제조기업 AI 업무 자동화 워크숍 현장에서 참가자들이 실습하는 모습",
      caption: "제조기업 AI 업무 자동화 워크숍 현장",
    },
  },
  {
    slug: "ai-web-app-class",
    title: "AI 웹앱 만들기 과정",
    category: "regular",
    period: "2026년 6월",
    audience: "AI·코딩 입문자",
    duration: "2회차 실습형 과정",
    summary: "코딩 경험 없이 AI와 함께 웹앱을 만들어 배포했습니다.",
    outcome: "데일리 노트 웹페이지와 카테고리 Todo 앱(배포까지 완료)",
    accent: "red",
    coverImage: {
      src: "/education/ai-web-app-class-result-v2.jpg",
      alt: "AI 웹앱 만들기 과정 결과물 — 데일리 노트 웹페이지와 카테고리 Todo 앱 목업",
      caption: "AI 웹앱 만들기 과정에서 제작한 데일리 노트·카테고리 Todo 앱",
      unoptimized: true,
    },
    galleryImages: [
      {
        src: "/education/education-regular-01.jpg",
        alt: "AI 웹앱 만들기 과정에서 참가자들이 모바일 웹앱 화면을 제작하는 모습",
        caption: "AI와 함께 모바일 웹앱 화면을 구현하는 실습",
      },
    ],
  },
  {
    slug: "gemini-oneday-class",
    title: "Gemini 원데이클래스",
    category: "regular",
    period: "2026년 7월",
    audience: "구글 계정만 있는 입문자",
    duration: "2시간 원데이클래스",
    summary: "무료 도구만으로 2시간 만에 결과물 다섯 개를 만들었습니다.",
    outcome: "요약본 · 리서치 보고서 · 캔버스 문서 · 이미지 · 나만의 Gem",
    accent: "mint",
    coverImage: {
      src: "/education/gemini-oneday-class-mockup.jpg",
      alt: "Gemini 원데이클래스 결과물 — 리서치 보고서와 나만의 Gem 제작 화면 목업",
      caption: "Gemini 원데이클래스에서 완성한 요약·리서치·Canvas·이미지·Gem",
    },
    galleryImages: [
      {
        src: "/education/education-lecture-01.jpg",
        alt: "Gemini 원데이클래스에서 강사가 화면을 보며 활용법을 설명하는 모습",
        caption: "무료 AI 도구의 주요 기능을 따라 해보는 강의",
      },
      {
        src: "/education/education-coaching-01.jpg",
        alt: "Gemini 원데이클래스에서 강사가 참가자의 노트북을 보며 코칭하는 모습",
        caption: "나만의 결과물을 완성하는 개별 실습 코칭",
      },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * 통계바 (ver3 신설)
 * ------------------------------------------------------------------ */

export type EduStat = { value: string; label: string };

// 나머지 수치는 실제 데이터 확보 전까지 더미.
export const eduStats: EduStat[] = [
  { value: "200+", label: "교육 수료생" },
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

/**
 * FAQ 8문항 (수정 요청서 §12가 지정한 필수 질문).
 *
 * 순서는 방문자가 스스로 묻는 순서를 따른다 — "나도 되나?"(자격) → "어떻게
 * 하나?"(방식) → "얼마인가?"(비용) → "끝나고는?"(사후). 요청서의 나열 순서와
 * 다르지만 §12는 질문 목록을 확정한 것이지 순서를 확정한 게 아니다.
 *
 * 답변은 이미 확인된 운영 사실로만 채웠다. 근거가 없는 항목(구체적 수강료,
 * 확정 일정)은 숫자를 지어내는 대신 문의로 안내한다 — §18.
 */
export const eduFaqs: FaqItem[] = [
  {
    id: "ai-beginner",
    question: "AI를 처음 사용해도 참여할 수 있나요?",
    answer:
      "네. 정규 과정은 AI를 처음 접하는 분을 기준으로 시작합니다. 계정을 만들고 도구를 세팅하는 첫 단계부터 함께 진행하므로 사전 지식이 없어도 됩니다.",
  },
  {
    id: "no-coding",
    question: "코딩을 전혀 몰라도 수강할 수 있나요?",
    answer:
      "네, 가능합니다. Vibe Coding이나 AI 활용 과정은 비개발자도 충분히 따라올 수 있도록 설계되어 있습니다. 코드보다 개념과 실습에 집중합니다.",
  },
  {
    id: "individual-or-org",
    question: "개인과 기업 모두 신청할 수 있나요?",
    answer:
      "네. 개인은 정규 과정과 바이브데이즈 클럽으로, 조직은 맞춤 교육으로 신청하실 수 있습니다. 조직 교육은 팀 단위 5명 이상부터 진행합니다.",
  },
  {
    id: "online-offline",
    question: "온라인과 오프라인 중 어떤 방식으로 진행되나요?",
    answer:
      "정규 클래스는 오프라인으로 진행합니다. 조직·기업 맞춤 교육은 방문 교육까지 가능하고, 바이브데이즈 클럽은 월 1회 오프라인 모임을 함께 운영합니다.",
  },
  {
    id: "what-to-prepare",
    question: "준비해야 할 프로그램이나 장비가 있나요?",
    answer:
      "노트북 한 대면 됩니다. 실습에 쓰는 AI 도구는 첫 회차에 함께 설치하고 계정을 만들며, 유료 결제가 필요한 경우 무료 대안을 함께 안내합니다.",
  },
  {
    id: "org-custom",
    question: "기업 맞춤형 커리큘럼도 가능한가요?",
    answer:
      "네. 조직의 목표와 직무, 현재 AI 활용 수준을 확인한 뒤 인원·기간에 맞춰 커리큘럼을 설계합니다. 팀 단위 5명 이상부터 가능합니다.",
  },
  {
    id: "cost-and-schedule",
    question: "교육 비용과 일정은 어떻게 정해지나요?",
    answer:
      "정규 과정은 기수별로 일정과 수강료를 공지하고, 조직 교육은 인원·기간·진행 방식에 따라 견적을 산출합니다. 문의를 남겨 주시면 조건에 맞춰 안내드립니다.",
  },
  {
    id: "after-support",
    question: "교육 후에도 자료나 지원을 받을 수 있나요?",
    answer:
      "네. 실습에 사용한 자료를 공유하고, 수료 후에도 카카오톡 오픈채팅 커뮤니티에서 질의응답과 피드백을 이어갑니다.",
  },
];

/* ------------------------------------------------------------------ *
 * 강사진 보강 정보
 * ------------------------------------------------------------------ */

/**
 * 강사별 담당 프로그램 (수정 요청서 §10 카드 정보).
 *
 * 강사 데이터 자체는 DB(`experts` 테이블 → `getPublicExperts()`)에서 오고
 * 거기에는 담당 프로그램 컬럼이 없다. 컬럼 추가는 DB 변경이라 이번 범위 밖이며
 * (DB 수정은 즉시 라이브에 반영된다), **누가 어느 과정을 맡는지 확인된 자료도
 * 아직 없다.** §18이 확인되지 않은 정보를 만들지 말라고 못 박고 있으므로
 * 그럴듯한 배정을 채워 넣지 않는다.
 *
 * 그래서 자리만 만들어 둔다 — 키는 강사 이름, 값은 담당 과정명이다. 비어
 * 있으면 카드가 해당 줄을 그리지 않는다. 확인되는 대로 여기를 채우면 되고,
 * 나중에 DB로 옮길 때도 이 형태를 그대로 어댑터가 채우면 된다.
 */
export const instructorPrograms: Record<string, string[]> = {};

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
