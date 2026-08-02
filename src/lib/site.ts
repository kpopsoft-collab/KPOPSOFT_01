/**
 * Central static content + config for the KPOPSOFT site.
 * Sourced from docs/기획서.md and docs/디자인.md. No DB yet — all copy lives here
 * so sections stay presentational and content is edited in one place.
 * Numbers/names/quotes marked "더미" are placeholders to replace with real data.
 */

export const site = {
  name: "KPOPSOFT",
  tagline: "SOFTWARE · AI SOLUTIONS · EDUCATION",
  /**
   * Hero 설명 (수정 요청서 §4 보조 문구 — 확정 카피). 두 문장을 "\n\n"으로
   * 구분 — Hero가 이 구분자로 문단을 나눠 렌더한다.
   */
  description:
    "개발팀이 없어도, AI 도입이 막막해도 시작할 수 있습니다.\n\nKPOPSOFT는 아이디어와 비즈니스 과제를 실제로 작동하는 소프트웨어와 AI 솔루션으로 구현합니다.",
  email: "hello@kpopsoft.com", // 더미
} as const;

/** Real routes. ver2에서 Education이 홈 섹션 → 독립 페이지로 분리됐다. */
export const route = {
  home: "/",
  education: "/education",
  /**
   * 정규 교육 과정 상세. `/education` 프로그램 카드의 CTA가 여기로 온다.
   * **아직 빈 페이지다** — 내용은 다른 작업자가 채운다. 라우트를 먼저 열어
   * 두는 이유는 CTA가 404로 떨어지지 않게 하기 위해서다.
   */
  educationPrograms: "/education/programs",
  /**
   * 교육 사례 전체 목록. `/education` 교육 사례 섹션의 `전체보기`가 여기로 온다.
   * `educationPrograms`와 마찬가지로 **아직 빈 페이지**다.
   */
  educationCases: "/education/cases",
  /** 전체 프로젝트 목록. 홈 PROJECTS 섹션 하단 CTA가 여기로 온다. */
  work: "/work",
} as const;

/** Section anchor ids — shared by nav links and section elements. */
export const sectionId = {
  hero: "top",
  /**
   * 헤더 `ABOUT` 앵커. 수정 요청서 §6에서 OUR IDENTITY 섹션이 신설되면서
   * 이 앵커의 주인이 통계바 → OUR IDENTITY로 옮겨졌다. "회사가 어떤
   * 곳인지"를 설명하는 블록이 실제로 그쪽이기 때문이다. 통계바는 아래
   * `numbers` 앵커를 쓴다.
   */
  about: "about",
  /** WHY KPOPSOFT — 역량 구조도 (수정 요청서 §13). 포트폴리오와 프로세스 사이. */
  why: "why",
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
  /** ver2 홈 — Software·AI Solutions를 묶은 통합 섹션. 두 블록은 위의
   *  software/aiSolutions id를 그대로 유지해 헤더 앵커가 계속 동작한다.
   *  ver3에서 Education까지 더해 "핵심 비즈니스" 3축이 됐다. */
  whatWeDo: "what-we-do",
} as const;

/** Education 페이지 전용 앵커 (docs/KPOPSOFT_Education_Page_ver2.md §5). */
export const educationSectionId = {
  hero: "top",
  programs: "programs",
  b2b: "for-organizations",
  inquiry: "education-inquiry",
} as const;

/**
 * Header navigation (docs/KPOPSOFT_Home_Landing_ver2.md §SECTION 01).
 *
 * 홈 앵커는 반드시 루트 기준 절대경로(`/#work`)로 둔다 — `/education` 같은
 * 다른 라우트에서 눌러도 홈으로 이동한 뒤 스크롤되어야 하기 때문이다.
 *
 * INSIGHTS는 ver2에서 제외했다(기획서 §6: 실제 콘텐츠가 쌓인 뒤 추가).
 * `/insights/[slug]` 라우트 자체는 살아 있어 기존 링크는 깨지지 않는다.
 */
/*
 * 순서는 홈의 섹션 순서(about → what-we-do → work → contact)를 그대로 따른다.
 * 스크롤 스파이가 메뉴를 위에서 아래로 훑으며 활성 표시를 옮기므로, 메뉴
 * 순서가 페이지와 어긋나면 활성 항목이 앞뒤로 튀는 것처럼 보인다.
 */
export const navItems = [
  { label: "ABOUT", href: `/#${sectionId.about}` },
  {
    /**
     * 3개 사업을 한 메뉴로 묶는다. 상위 항목 자체도 이동 가능한 링크로
     * 둔다(핵심 비즈니스 섹션) — 하위가 열리지 않는 상황(키보드·터치)에서도
     * 막다른 메뉴가 되지 않게 하기 위해서다.
     */
    label: "CORE BUSINESS",
    href: `/#${sectionId.whatWeDo}`,
    children: [
      { label: "SOFTWARE", href: `/#${sectionId.software}` },
      { label: "AI SOLUTIONS", href: `/#${sectionId.aiSolutions}` },
      { label: "EDUCATION", href: route.education },
    ],
  },
  { label: "WORK", href: `/#${sectionId.work}` },
  { label: "CONTACT", href: `/#${sectionId.contact}` },
] as const;

export type NavItem = (typeof navItems)[number];
export type NavLeaf = { label: string; href: string };

/**
 * 상위·하위를 한 줄로 편 목록. 드롭다운이 없는 곳(푸터)과 스크롤 스파이용
 * 앵커 추출에서 쓴다.
 */
export const flatNavItems: NavLeaf[] = navItems.flatMap<NavLeaf>((item) =>
  "children" in item ? [item, ...item.children] : [item],
);

/**
 * Header CTA — 페이지마다 방문자가 할 "다음 행동"이 다르다.
 * 홈은 프로젝트 의뢰, Education은 기업 교육 문의
 * (Home ver2 §SECTION 01 / Education ver2 §6).
 */
export const headerCta = {
  [route.education]: {
    /**
     * `기업 교육 문의`에서 바꿨다. 문의 폼이 개인/기업 분기로 바뀌면서
     * 기업만 받는 창구가 아니게 됐고, 교육 페이지에서 이 버튼이 유일한
     * 문의 진입점이라 대상을 좁히는 라벨이면 개인 방문자가 자기 것이
     * 아니라고 판단하고 지나친다.
     */
    label: "교육 문의",
    href: `${route.education}#${educationSectionId.inquiry}`,
  },
  default: {
    label: "프로젝트 문의",
    href: `/#${sectionId.contact}`,
  },
} as const;

/**
 * Hero / Footer CTA — 둘 다 문의 섹션으로 가지만 문구가 헤더와 다르다
 * (수정 요청서 §3·§4·§16). 헤더는 `프로젝트 문의`, 나머지 둘은
 * `프로젝트 상담하기`로 상담의 문턱을 낮춘 표현을 쓴다.
 */
export const consultCta = {
  label: "프로젝트 상담하기",
  href: `/#${sectionId.contact}`,
} as const;

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
    /**
     * ver3 — IA의 "소프트웨어" 분류.
     *
     * IA는 세부 유형을 `웹/앱 · 어드민 · 기타` 3개로 적었지만, 웹과 앱은
     * 견적·기간이 크게 달라 한 항목으로 묶으면 문의 라우팅에 필요한 정보가
     * 사라진다. 사용자 확인을 거쳐 웹과 앱을 분리해 유지한다.
     */
    type: "소프트웨어 개발",
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
        label: "어드민",
        placeholder:
          "예) 팀 업무를 관리할 관리자 시스템이 필요합니다. 지금은 엑셀·수기로 처리 중이고, 사용 인원은 △명입니다.",
      },
      {
        label: "기타",
        placeholder: "예) 필요한 제품·기능과 참고 사례, 희망 일정을 자유롭게 적어 주세요.",
      },
    ],
  },
  {
    type: "AI 솔루션",
    subtypes: [
      {
        label: "AI 업무 자동화",
        placeholder:
          "예) 반복되는 문서·데이터 처리를 자동화하고 싶습니다. 지금은 ○○ 방식으로 처리 중입니다.",
      },
      {
        label: "AI 챗봇",
        placeholder:
          "예) 고객(또는 사내) 문의에 답하는 AI 챗봇이 필요합니다. 대상과 참고 데이터는 ○○입니다.",
      },
      {
        label: "기타",
        placeholder:
          "예) AI 에이전트·콘텐츠 자동화·사내 AI Tool 등 어떤 문제를 AI로 풀고 싶은지 자유롭게 적어 주세요.",
      },
    ],
  },
  {
    /**
     * ver3에서 교육 세부 유형이 9개 → **3분류 3개**로 압축됐다
     * (docs/KPOPSOFT_Home_Landing_ver3.md §SECTION 06).
     * 라벨은 `eduCategories`(education-content.ts)의 `name`과 반드시 일치시킨다 —
     * 홈에서 고른 값이 `/education`의 같은 이름 블록으로 이어져야 하기 때문이다.
     */
    type: "교육 문의",
    subtypes: [
      {
        label: "조직·기업 맞춤 교육",
        placeholder:
          "예) 우리 회사 상황에 맞춘 커리큘럼이 필요합니다. 대상·인원·목표·희망 일정은 ○○입니다.",
      },
      {
        label: "정규 클래스",
        placeholder:
          "예) AI 활용 / Vibe Coding / 웹·앱 제작 / 업무 자동화 중 관심 있는 과정과 희망 일정을 적어 주세요.",
      },
      {
        label: "지식 공유 커뮤니티 클럽 / 바이브데이즈",
        placeholder:
          "예) 바이브데이즈 클럽 참여를 희망합니다. 현재 AI 활용 수준과 기대하는 점은 ○○입니다.",
      },
    ],
  },
  {
    /**
     * 수정 요청서 §15가 지정한 네 번째 분야. 위 셋 중 어디에도 딱 맞지 않는
     * 문의(제휴·채용·취재 등)가 갈 곳이 없어 이탈하던 것을 받는다.
     * 세부 유형은 두지 않는다 — 무엇을 물어볼지 모르는 분야라 미리 쪼갤 수 없다.
     */
    type: "기타 문의",
    subtypes: [],
  },
] as const;

export type InquiryType = (typeof inquiryOptions)[number]["type"];

/** Business overview (docs/기획서.md §6). */
export const businesses = [
  {
    index: "01",
    title: "SOFTWARE",
    accent: "blue",
    summary: "웹·앱과 내부 운영 도구가 필요하다면.",
    /** docs/KPOPSOFT_Home_Landing_ver2.md §SECTION 05 "Software" 목록 그대로. */
    items: [
      "웹 서비스",
      "모바일 앱",
      "기업용 소프트웨어",
      "관리자 시스템",
      "업무 관리 시스템",
      "내부 운영 도구",
      "MVP · Prototype",
    ],
  },
  {
    index: "02",
    title: "AI SOLUTIONS",
    accent: "red",
    summary: "반복 업무를 AI로 줄이고 싶다면.",
    items: [
      "AI 업무 자동화",
      "AI 챗봇",
      "콘텐츠 자동화",
      "AI Workflow",
      "사내 AI Tool",
      "데이터 기반 업무 도구",
      "AI 에이전트",
    ],
  },
  {
    index: "03",
    title: "EDUCATION",
    accent: "mint",
    summary: "팀이 직접 구축하고 활용해야 한다면.",
    /** ver3 교육 3분류 그대로 (docs/KPOPSOFT_Home_Landing_ver3.md §SECTION 03). */
    items: [
      "조직·기업 맞춤 교육",
      "정규 클래스",
      "지식 공유 커뮤니티 클럽 (VIBEDAYS)",
    ],
  },
] as const;

/**
 * What We Do 사례 (docs/KPOPSOFT_Home_Landing_ver2.md §SECTION 05).
 *
 * Software / AI Solutions 카드가 "결과물 타입" 탭으로 큰 대표 화면 1개를
 * 노출하고, 클릭하면 Sheet 모달에서 사례 스토리를 보여주기 위한 소스다.
 * 탭(`tab`)은 실제 보유한 목업 이미지와 1:1로 매칭한다. 모달 본문
 * (problem/approach/result/stack)은 실제 사례 확정 시 교체할 **플레이스홀더**
 * 초안이다 — 카드/탭은 tab/image만, 모달은 나머지 필드까지 읽는다.
 */
export type BusinessCase = {
  key: string;
  /** 탭 라벨 — 짧게 (모바일 한 줄). */
  tab: string;
  accent: Accent;
  image: string;
  alt: string;
  /** 모달 헤더 제목. */
  title: string;
  summary: string;
  problem: string;
  approach: string;
  result: string;
  stack: string[];
};

export const businessCases: Record<"software" | "ai", BusinessCase[]> = {
  software: [
    {
      key: "web",
      tab: "Web",
      accent: "blue",
      image: "/work/web-portfolio.jpg",
      alt: "웹 대시보드 화면 — 활성 사용자, 전환율, 주간 트래픽 지표",
      title: "웹 서비스 · 관리형 대시보드",
      summary: "핵심 지표를 한 화면에서 확인하고 운영까지 이어지는 웹 서비스.",
      problem:
        "지표가 여러 도구에 흩어져 있어 매번 취합에 시간이 들고, 의사결정이 늦어지는 상황이었습니다.",
      approach:
        "필요한 지표와 업무 흐름을 함께 정리해, 로그인부터 대시보드·상세 화면까지 하나의 반응형 웹으로 설계·구현했습니다.",
      result:
        "흩어진 데이터를 한 화면으로 모아 확인 시간을 크게 줄이고, 팀이 같은 숫자를 보며 빠르게 판단하도록 했습니다.",
      stack: ["Next.js", "Supabase", "Tailwind CSS", "Vercel"],
    },
    {
      key: "app",
      tab: "App",
      accent: "navy",
      image: "/work/app-portfolio.jpg",
      alt: "모바일 앱 화면 — 학습 진행률과 진행 중 코스 목록",
      title: "모바일 앱 · 학습/온보딩",
      summary: "사용자가 앱처럼 매끄럽게 쓰는 모바일 중심 서비스.",
      problem:
        "웹만으로는 사용자가 자주 돌아오지 않았고, 진행 상황을 손안에서 확인하기 어려웠습니다.",
      approach:
        "모바일 우선으로 화면을 다시 설계하고, 진행률·다음 할 일을 한눈에 보여주는 홈을 중심으로 구성했습니다.",
      result:
        "설치 없이도 앱처럼 동작하는 경험으로 재방문 흐름을 만들고, 이탈 지점을 줄였습니다.",
      stack: ["Next.js", "PWA", "Supabase", "Tailwind CSS"],
    },
    {
      key: "admin",
      tab: "Admin",
      accent: "sky",
      image: "/work/admin-portfolio.jpg",
      alt: "관리자 콘솔 화면 — 문의 관리 대시보드와 데이터 테이블",
      title: "관리자 시스템 · 운영 콘솔",
      summary: "문의·회원·콘텐츠를 한곳에서 운영하는 내부 관리 도구.",
      problem:
        "운영을 스프레드시트와 수작업으로 처리해 실수가 잦고, 담당자별로 기준이 달랐습니다.",
      approach:
        "문의 접수부터 상태 관리·권한까지 하나의 어드민으로 통합하고, 목록·상세·필터를 표준화했습니다.",
      result:
        "운영 작업을 한 시스템으로 모아 처리 속도를 높이고, 누락과 중복 없이 관리하도록 했습니다.",
      stack: ["Next.js", "Supabase", "RLS", "shadcn/ui"],
    },
  ],
  ai: [
    {
      key: "chatbot",
      tab: "챗봇",
      accent: "coral",
      image: "/work/ai-chatbot.jpg",
      alt: "AI 챗봇 대화 화면 — 매출 리포트를 요약해 응답하는 어시스턴트",
      title: "AI 챗봇 · 업무 어시스턴트",
      summary: "사내 데이터를 이해하고 바로 답하는 대화형 업무 도구.",
      problem:
        "필요한 정보가 여러 문서에 흩어져 있어, 질문 하나에도 담당자를 거쳐야 답을 얻을 수 있었습니다.",
      approach:
        "사내 자료를 근거로 답하도록 구성하고, 자주 묻는 업무를 대화 흐름으로 설계했습니다.",
      result:
        "반복 질문을 챗봇이 먼저 처리하도록 해, 담당자의 응대 부담을 줄였습니다.",
      stack: ["Claude API", "RAG", "Next.js", "Supabase"],
    },
    {
      key: "agent",
      tab: "에이전트",
      accent: "red",
      image: "/work/ai-agent.jpg",
      alt: "AI 에이전트 실행 콘솔 — 문의 분류·배정 작업을 단계별로 처리",
      title: "AI 에이전트 · 자동 처리",
      summary: "정해진 절차를 스스로 판단해 단계별로 처리하는 에이전트.",
      problem:
        "들어오는 요청을 분류하고 배정하는 반복 작업에 사람이 계속 매여 있었습니다.",
      approach:
        "요청을 이해해 분류·배정·처리까지 단계별로 실행하고, 사람은 확인만 하도록 설계했습니다.",
      result:
        "단순 판단·분배를 자동으로 넘겨, 사람이 진짜 중요한 일에 집중하도록 했습니다.",
      stack: ["Claude API", "Tool Use", "Workflow", "Next.js"],
    },
    {
      key: "automation",
      tab: "자동화",
      accent: "mint",
      image: "/work/ai-automation.jpg",
      alt: "자동화 워크플로우 대시보드 — 문의 접수부터 알림까지 자동 실행",
      title: "업무 자동화 · 워크플로우",
      summary: "접수부터 알림까지 사람 손 없이 흐르는 자동화 파이프라인.",
      problem:
        "접수·정리·알림이 각각 수작업이라, 사이에서 누락과 지연이 반복됐습니다.",
      approach:
        "업무 흐름을 하나의 워크플로우로 연결하고, 조건에 따라 자동으로 다음 단계가 실행되게 했습니다.",
      result:
        "반복 업무를 자동 흐름으로 바꿔 처리 시간과 실수를 함께 줄였습니다.",
      stack: ["Workflow", "Webhook", "Supabase", "Cron"],
    },
  ],
};

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
    inquiry: { type: "소프트웨어 개발", subtype: "웹 프로젝트" },
  },
  {
    title: "App",
    desc: "iOS · Android 하이브리드 모바일 앱",
    inquiry: { type: "소프트웨어 개발", subtype: "앱 프로젝트" },
  },
  {
    title: "AI Automation",
    desc: "업무 자동화 및 AI Workflow",
    inquiry: { type: "소프트웨어 개발", subtype: "AI 자동화" },
  },
  {
    title: "Internal Tools",
    desc: "관리자 · 내부 운영 도구",
    inquiry: { type: "소프트웨어 개발", subtype: "내부 운영 도구" },
  },
  {
    title: "Digital Product",
    desc: "MVP · Prototype · 신규 서비스",
    inquiry: { type: "소프트웨어 개발", subtype: "기타" },
  },
] as const;

/** AI Prototype Lab process (docs/디자인.md §AI PROTOTYPE LAB). */
export const labSteps = ["Idea", "Prototype", "Test", "Build"] as const;

/** KPOPSOFT process (docs/디자인.md §Process Diagram). */
/**
 * 우리의 프로세스 5단계 (IA 개정안 — 홈 포트폴리오와 Contact 사이).
 *
 * ver1의 `Learn(실습 중심 교육) → Scale(조직 확장)`은 교육이 홈 안에 있던
 * 시절의 흐름이라, 교육이 별도 페이지로 빠진 지금은 맞지 않는다. WORK 섹션이
 * 말하는 "기획부터 운영까지"와 같은 흐름으로 다시 잡았다. 기술 이전(교육)은
 * 단계를 따로 두지 않고 운영 단계의 선택지로 붙인다.
 */
/** 단계명·설명은 수정 요청서 §14가 확정한 문구 그대로 쓴다. */
export const processSteps = [
  {
    index: "01",
    title: "Understand",
    desc: "비즈니스 니즈 및 목표 정의",
    accent: "blue",
  },
  {
    index: "02",
    title: "Design",
    desc: "서비스 구조 및 사용자 경험 설계",
    accent: "sky",
  },
  { index: "03", title: "Build", desc: "디자인 및 개발", accent: "red" },
  {
    index: "04",
    title: "Launch",
    desc: "테스트 및 서비스 출시",
    accent: "yellow",
  },
  {
    index: "05",
    title: "Operate",
    desc: "운영 및 지속적인 개선",
    accent: "mint",
  },
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
    image: "/experts/lee-dongjun.jpg",
  },
] as const;

/**
 * 주요 프로젝트 (수정 요청서 §8~§12).
 *
 * 세 건 모두 요청서가 카테고리·프로젝트명·요약을 **확정 문구**로 못박았다.
 * 임의로 축약하거나 다른 표현으로 바꾸지 않는다(§18).
 *
 * `scope`(담당 범위)는 **실제 수행 내용이 확인된 경우에만** 채운다. 요청서
 * §8이 `Planning`/`UX/UI Design`/`Web Development` 같은 역할을 임의로
 * 추가하지 말라고 명시했고, 세 건 모두 아직 확인된 범위를 받지 못했으므로
 * 비워 둔다 — 카드는 값이 있을 때만 이 줄을 렌더한다.
 *
 * `features`/`flow`는 요청서가 프로젝트별로 확정해 준 내용이라 상세 패널에서
 * 보여준다. 요청서 §11 주의사항대로, 챗봇 스크린샷에 찍힌 특정 뉴스 제목과
 * 날짜는 예시 데이터이므로 어떤 카피에도 넣지 않는다.
 */
export const selectedWork = [
  {
    /**
     * 실제 사례 — sindohr.com. 요청서 §9: 채용 사이트나 단순 랜딩페이지가
     * 아니라, 업종에 맞는 렌탈 상품을 탐색하고 상담까지 신청하는 **렌탈 서비스
     * 웹사이트**다. 이전 카피의 "랜딩페이지" 표현은 이 지적에 따라 걷어냈다.
     */
    client: "신도렌탈",
    title: "신도렌탈 복합기 렌탈 서비스",
    category: "RENTAL · PRODUCT PLATFORM",
    accent: "blue",
    summary:
      "업종별 복합기 추천부터 상품 탐색과 상담 신청까지 연결한 렌탈 서비스 웹사이트입니다.",
    challenge:
      "복합기 렌탈은 사무실·학교·병원·관공서처럼 사용 환경에 따라 필요한 사양과 비용이 크게 달라집니다. 방문자가 자신의 환경에 맞는 상품을 스스로 찾고, 정보를 확인한 뒤 상담까지 이어갈 수 있는 흐름이 필요했습니다.",
    solution:
      "업종별 렌탈 솔루션 추천을 입구로 두고, 추천 상품 목록에서 제품 이미지·주요 사양·월 렌탈료를 확인한 뒤 상세정보와 상담 신청으로 이어지도록 설계했습니다. 상담 진행 절차와 추가 비즈니스 상담까지 한 흐름 안에 배치했습니다.",
    results: [] as string[],
    scope: [] as string[],
    features: [
      "사무실, 학교, 병원, 관공서 등 업종별 렌탈 솔루션 추천",
      "추천 렌탈 상품 목록",
      "제품 이미지, 주요 사양, 월 렌탈료 제공",
      "상품 상세정보 확인",
      "복합기 렌탈 상담 신청",
      "상담 진행 절차 안내",
      "추가 비즈니스 상담 연계",
    ],
    flow: "사용자 환경 선택 → 적합한 상품 탐색 → 정보 확인 → 렌탈 상담 신청",
    externalUrl: "https://www.sindohr.com/",
    imageUrl: "/work/sindohr-mockup.png",
    imageUrls: ["/work/sindohr-mockup.png", "/work/sindohr-desktop.jpg"],
  },
  {
    /**
     * 요청서 §10. `관리자용 어드민 대시보드`라는 표현은 쓰지 않는다 — 서비스
     * 운영자가 아니라 **고객이 자기 캠페인과 성과를 직접 관리하는** 사용자용
     * 대시보드이기 때문이다.
     *
     * 대표 이미지는 실제 BLUE EGG biz 홈 대시보드 화면이다.
     */
    client: "BLUE EGG",
    title: "셀프 마케팅 캠페인 운영 플랫폼",
    category: "MARKETING · WEB PLATFORM",
    accent: "red",
    summary:
      "캠페인 운영부터 채널별 검색 순위 추적과 성과 확인까지 한 화면에서 관리할 수 있도록 구축한 웹 플랫폼입니다.",
    challenge:
      "마케팅 캠페인을 직접 운영하는 고객은 집행 현황과 채널별 성과를 각각 다른 곳에서 확인해야 했습니다. 무엇이 얼마나 효과가 있었는지 판단할 근거가 한자리에 모이지 않았습니다.",
    solution:
      "고객이 직접 캠페인을 등록·운영하고, 네이버 플레이스·쇼핑 등 채널별 검색 순위와 키워드별 순위 변화를 한 화면에서 추적하도록 구성했습니다. 포인트와 캠페인 현황, 성과 사례, 고객 지원까지 하나의 셀프 운영 플랫폼으로 묶었습니다.",
    results: [] as string[],
    scope: [] as string[],
    features: [
      "사용자별 포인트 및 캠페인 현황 확인",
      "마케팅 캠페인 등록 및 운영",
      "진행 중·완료된 캠페인 관리",
      "네이버 플레이스·쇼핑 등 채널별 검색 순위 추적",
      "키워드별 순위 변화 시각화",
      "캠페인 성과 및 고객 사례 제공",
      "공지사항 및 고객 지원",
      "광고대행 및 제휴 문의 연결",
    ],
    flow: "캠페인 등록 → 진행 현황 확인 → 채널별 순위 추적 → 마케팅 성과 관리",
    imageUrl: "/work/blueegg-dashboard.png",
  },
  {
    /**
     * 요청서 §11. 단순 고객 상담 챗봇이 아니라, 요청에 따라 외부 정보를
     * 탐색하고 핵심을 요약해 주는 **정보 응답·업무 자동화** 챗봇이다.
     * 스크린샷에 찍힌 뉴스 제목·날짜는 예시 데이터라 카피에 넣지 않는다.
     */
    client: "KPOPSOFT",
    title: "카카오톡 기반 AI 정보 응답 챗봇",
    category: "AI · CHATBOT AUTOMATION",
    accent: "mint",
    summary:
      "사용자의 요청을 이해하고 필요한 정보를 수집·요약해 대화형 인터페이스로 제공하는 AI 챗봇입니다.",
    challenge:
      "필요한 정보를 찾으려면 매번 여러 출처를 직접 돌아다니며 확인해야 했습니다. 반복적인 정보 탐색에 시간이 들고, 정작 핵심만 추려 보기는 어려웠습니다.",
    solution:
      "자연어 명령을 인식해 요청 주제에 맞는 정보를 검색하고, 핵심 내용만 요약해 카카오톡 채널에서 바로 응답하도록 구성했습니다. 별도 서비스에 접속하지 않고 쓰던 메신저에서 결과를 확인합니다.",
    results: [] as string[],
    scope: [] as string[],
    features: [
      "자연어 명령 및 질문 인식",
      "요청 주제에 맞는 정보 검색",
      "주요 뉴스와 정보 자동 수집",
      "핵심 내용 요약 및 정리",
      "카카오톡 채널 기반 대화형 응답",
      "반복적인 정보 탐색 업무 자동화",
      "별도 서비스 접속 없이 메신저에서 결과 확인",
    ],
    flow: "사용자 질문 입력 → AI 정보 탐색 → 핵심 내용 요약 → 카카오톡 결과 제공",
    imageUrl: "/work/ai-chatbot-hermes.jpg",
    imageUrls: ["/work/ai-chatbot-hermes.jpg"],
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
    inquiry: { type: "AI 솔루션", subtype: "AI 업무 자동화" },
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
    inquiry: { type: "AI 솔루션", subtype: "AI Prototype" },
  },
] as const;

/** 주요 성과 수치 (수정 요청서 §5 — 항목명·값 확정). */
export const stats = [
  { value: 120, suffix: "+", label: "프로젝트 완료" },
  { value: 40, suffix: "+", label: "파트너 기업" },
  { value: 1800, suffix: "+", label: "교육 수료생" },
  { value: 96, suffix: "%", label: "교육 만족도" },
] as const;

/** 수치 하단 각주 (수정 요청서 §5). */
export const statsFootnote = "2026년 7월 기준 누적 실적";

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

/**
 * 옅은 accent 면 — 카드가 여러 장 나란히 놓일 때 쓴다.
 *
 * 채도 높은 원색(`accentBg`)을 카드마다 꽉 채우면 색끼리 부딪혀 눈이 피로하고,
 * 정작 읽어야 할 글자가 배경에 눌린다. 같은 색 계열을 유지하면서 배경은 물러나게
 * 두는 용도다. 본문은 항상 ink로 두므로 대비는 충분하다(§접근성).
 */
export const accentTint: Record<Accent, string> = {
  blue: "bg-brand-blue/10",
  red: "bg-brand-red/10",
  yellow: "bg-brand-yellow/20",
  coral: "bg-brand-coral/15",
  mint: "bg-brand-mint/15",
  sky: "bg-brand-sky/15",
  navy: "bg-brand-navy/10",
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
