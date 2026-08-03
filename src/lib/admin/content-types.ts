/**
 * Admin CMS content types (docs/06-admin/ §4.2).
 *
 * Shapes mirror the real content in src/lib/site.ts so the mock store seeds
 * losslessly and the future Supabase adapter maps 1:1. Every collection shares
 * `id` / `sortOrder` / `isPublished`. Images are plain string URLs: in mock mode
 * that's a data: URL from the upload widget; on wiring day it becomes a Supabase
 * Storage path — the field name and screens don't change.
 */

import type { Accent } from "@/lib/site";

/** Fields every CMS row carries. */
export type ContentBase = {
  id: string;
  /** Ascending display order on the public site. */
  sortOrder: number;
  /** Hidden from the public site when false. */
  isPublished: boolean;
};

export type WorkItem = ContentBase & {
  client: string;
  title: string;
  category: string;
  accent: Accent;
  summary: string;
  challenge: string;
  solution: string;
  results: string[];
  /** Cover image (docs §4.2 — Work + Insights 커버 이미지). */
  imageUrl?: string;
  /** 상세 시트 갤러리 — 커버 뒤에 이어지는 화면들. */
  imageUrls: string[];
  /** 수정 요청서 §8~§12 — 상세 시트에 나오는 작업 범위·기능·흐름·링크. */
  scope: string[];
  features: string[];
  userFlow: string;
  externalUrl: string;
  /** 홈 포트폴리오 노출 여부. 끄면 `/work` 목록에만 남는다. */
  showOnHome: boolean;
};

export type Insight = ContentBase & {
  tag: string;
  title: string;
  /** Display date string, e.g. "2026.06". */
  date: string;
  accent: Accent;
  excerpt: string;
  /** Article body as paragraphs. */
  body: string[];
  /** Unique blog-detail slug (docs §4.2 — /insights/[slug]). */
  slug: string;
  imageUrl?: string;
  /** Optional pre-selected inquiry mapping when a reader clicks through. */
  inquiryType?: string;
  inquirySubtype?: string;
};

export type Testimonial = ContentBase & {
  quote: string;
  author: string;
  /** 프로그램명 스냅샷(자유 텍스트, 기존 필드 — 관계형 연결은 programId 참고). */
  program: string;
  result: string;
  /** Education §27.6 — 회사 또는 산업군. */
  company: string;
  /** Education §27.6 — 참여자 역할. */
  role: string;
  /** Education §27.6 — 선택적 이미지 또는 결과물 썸네일. */
  imageUrl?: string;
  /** Education §27.6, §28 — Education 페이지 노출 여부(홈과 별개 플래그). */
  showOnEducation: boolean;
  /** §28 — 관련 프로그램(관계형 연결). */
  programId?: string;
  /** §28 — 관련 교육 사례(관계형 연결). */
  caseId?: string;
};

export type Expert = ContentBase & {
  name: string;
  role: string;
  /** 대표 문구 (기존 필드, Education §27.5 "대표 문구"와 동일 용도). */
  quote: string;
  /** 전문 분야 태그 — Education §27.5 "전문 분야"를 겸한다(§28, 컬럼 중복 생성 금지). */
  tags: string[];
  accent: Accent;
  /** Profile photo (docs §4.2). Falls back to a monogram when empty. */
  imageUrl?: string;
};

export type Stat = ContentBase & {
  value: number;
  suffix: string;
  label: string;
};

/** The seven brand accents, for accent-picker options. */
export const ACCENTS: readonly Accent[] = [
  "blue",
  "red",
  "yellow",
  "coral",
  "mint",
  "sky",
  "navy",
] as const;


// ─────────────────────────────────────────────────────────────────────────
// Education (docs/03-education/ — 3분류 체계)
//
// ver2의 평면 프로그램·결과물·사례·VIBEDAYS 역할·이미지 갤러리·페이지 설정
// 타입은 지웠다. 그 스키마는 DB에 만들어진 적이 없고, ver3에서 프로그램이
// 조직·기업 / 정규 클래스 / 커뮤니티 클럽 세 갈래로 재편되면서 모양 자체가
// 달라졌다. 공개 화면이 쓰는 타입은 `src/lib/education-content.ts`에 있고,
// 여기 있는 것은 **어드민 폼이 다루는 모양**이다(ContentBase 기반).
// ─────────────────────────────────────────────────────────────────────────

/** 정규 클래스 학습 트랙 — 방문자가 고르는 탐색 축(3분류와 별개). */
export type EducationTrack = "beginner" | "practical";

export const EDUCATION_TRACKS: readonly EducationTrack[] = [
  "beginner",
  "practical",
] as const;

export const educationTrackLabel: Record<EducationTrack, string> = {
  beginner: "AI 입문",
  practical: "실무 활용",
};

/** 교육 3분류 — 지난 프로그램이 어디에 속하는지 표시할 때 쓴다. */
export type EducationCategoryId = "org" | "regular" | "club";

export const EDUCATION_CATEGORIES: readonly EducationCategoryId[] = [
  "org",
  "regular",
  "club",
] as const;

export const educationCategoryLabel: Record<EducationCategoryId, string> = {
  org: "조직·기업 맞춤 교육",
  regular: "정규 클래스",
  club: "커뮤니티 클럽",
};

/**
 * 클럽 기수 모집 상태. 공개 화면 표기(`cohortStatusLabel`)와 같은 어휘를
 * 쓴다 — 어드민에서 "모집 중"으로 고른 것이 사이트에 "준비 중"으로 나오면
 * 무엇을 고른 것인지 알 수 없다.
 */
export type ClubCohortStatus = "upcoming" | "open" | "closed" | "ended";

export const CLUB_COHORT_STATUSES: readonly ClubCohortStatus[] = [
  "upcoming",
  "open",
  "closed",
  "ended",
] as const;

export const clubCohortStatusLabel: Record<ClubCohortStatus, string> = {
  upcoming: "모집 예정",
  open: "준비 중",
  closed: "모집 마감",
  ended: "운영 종료",
};

/**
 * 정규 클래스 일정 유형 — 원데이는 하루짜리라 종료일 개념이 없고, 다회차는
 * 시작·종료 구간을 가진다. DB의 `education_schedule_type` 도메인과 값이
 * 같아야 한다(10-마이그레이션-DDL.md).
 */
export type EducationScheduleType = "oneday" | "multi";

export const EDUCATION_SCHEDULE_TYPES: readonly EducationScheduleType[] = [
  "oneday",
  "multi",
] as const;

export const educationScheduleTypeLabel: Record<EducationScheduleType, string> = {
  oneday: "원데이 클래스",
  multi: "다회차 클래스",
};

export type EducationRegularClass = ContentBase & {
  slug: string;
  /** "01" — 화면에 그대로 찍는 표기. */
  indexLabel: string;
  name: string;
  subtitle: string;
  description: string;
  duration: string;
  /** "입문·중급" — 사람이 읽는 표기. 분기에는 tracks를 쓴다. */
  level: string;
  tracks: EducationTrack[];
  accent: Accent;
  imageUrl?: string;
  imageAlt: string;
  imageCaption: string;
  curriculum: string[];
  detailHref: string;
  seoTitle: string;
  seoDescription: string;
  /** 원데이/다회차 — 종료일 입력 UI와 DB CHECK 분기 기준이 이 값 하나다. */
  scheduleType: EducationScheduleType;
  /**
   * 강의 시작일(ISO "YYYY-MM-DD"). null 대신 빈 문자열을 쓴다 — 폼 상태·
   * `<input type="date">`가 전부 문자열이라, null을 섞으면 화면마다
   * `?? ""`가 따라붙는다. 비워도 되는 값이라 필수 항목이 아니다.
   */
  startDate: string;
  /** 강의 종료일. scheduleType이 "oneday"면 서버가 항상 빈 문자열로 되돌린다. */
  endDate: string;
  /**
   * 정제(sanitize) 완료된 상세 페이지 HTML — 공개 화면이 실제로 렌더하는
   * 유일한 값이다. 업로드 원본(raw)은 이 필드에 없다 — admin-only 동반
   * 테이블(`education_regular_class_html_sources`)에 따로 있다(D6, 공개
   * API로 원본이 새는 것을 막기 위해).
   */
  detailHtml: string;
};

/**
 * 폼이 상세 HTML을 어떻게 바꾸고 싶은지 나타내는 의도.
 * `detailHtml`은 서버 전용 정제 결과라 폼이 값을 직접 채워 보낼 수 없고,
 * 원본은 동반 테이블에 있어 목록/수정 진입 시 `detailHtml`만으로는 원본이
 * 무엇이었는지 알 수 없다. 그래서 "새 값"이 아니라 "무엇을 할지"를 보낸다 —
 * 그래야 이름만 고쳐 저장해도 기존 HTML이 조용히 지워지지 않는다
 * (백로그 01 §3 5-1).
 */
export type HtmlIntent =
  | { kind: "keep" } // 기본값 — 동반 테이블·detail_html 둘 다 손대지 않는다
  | { kind: "replace"; raw: string; fileName: string }
  | { kind: "remove" };

/**
 * 정규 클래스 편집 화면 전용 조회 결과 — 동반 테이블의 업로드 원본·파일명을
 * 얹는다. list()/get()이 반환하는 `EducationRegularClass`에는 없다(admin-only
 * 원본이 일반 조회 경로로 새지 않게). 폼이 열릴 때 이 값으로 `htmlIntent`의
 * 기본 상태("keep")를 채워 넣는다.
 */
export type EducationRegularClassEdit = EducationRegularClass & {
  detailHtmlRaw: string;
  detailHtmlFileName: string;
};

/** 조직·기업 맞춤 교육 — 상품이 하나뿐이라 싱글턴이다. */
export type EducationOrgTraining = {
  title: string;
  description: string;
  minParticipants: string;
  imageUrl?: string;
  imageAlt: string;
  imageCaption: string;
  ctaLabel: string;
};

export type EducationClubCohort = ContentBase & {
  /** "1기" */
  label: string;
  status: ClubCohortStatus;
  recruitPeriod: string;
  runPeriod: string;
  price: string;
  /** 할인 전 정가. 있으면 가격 옆에 취소선으로 함께 나온다. */
  listPrice: string;
  capacity: string;
  /** 마감·연기 사유 한 줄. */
  note: string;
  /** 신청 버튼을 없애지 않고 비활성만 시킨다(아직 신청을 받지 않는 기간). */
  ctaDisabled: boolean;
  showPrice: boolean;
  showCapacity: boolean;
  showSchedule: boolean;
  showCta: boolean;
};

export type EducationClubTier = ContentBase & {
  name: string;
  role: string;
  points: string[];
  accent: Accent;
  characterSrc: string;
  /** 캐릭터 원본 크기 — 파일마다 달라 행마다 적는다. */
  characterWidth: number;
  characterHeight: number;
};

export type EducationPastProgram = ContentBase & {
  slug: string;
  title: string;
  category: EducationCategoryId;
  /** "2026년 3월" */
  period: string;
  audience: string;
  duration: string;
  summary: string;
  outcome: string;
  accent: Accent;
  coverImageUrl?: string;
  coverImageAlt: string;
  coverImageCaption: string;
  /** 자산 교체 시 캐시 잔상을 피해야 하는 목업에만 켠다. */
  coverUnoptimized: boolean;
};

/** 지난 프로그램 갤러리 이미지 — 부모 행에 딸린다(ContentBase 아님). */
export type EducationPastProgramImage = {
  id: string;
  programId: string;
  imageUrl: string;
  alt: string;
  caption: string;
  sortOrder: number;
};

export type EducationPastProgramImageInput = Omit<EducationPastProgramImage, "id">;

export type EducationReview = ContentBase & {
  /** 정적 데이터에서 승계한 식별 키. */
  key: string;
  /** 5점 만점. */
  rating: number;
  body: string;
  /** 닉네임 대신 수강 레벨로 표기한다. */
  author: string;
  program: string;
  /** "2026년 7월" */
  dateLabel: string;
  accent: Accent;
};

export type EducationFaq = ContentBase & {
  key: string;
  question: string;
  answer: string;
};

/** 교육 성과 수치 — 홈 `Stat`과 달리 표기까지 포함된 문자열이다("200+"). */
export type EducationStat = ContentBase & {
  key: string;
  value: string;
  label: string;
};

// ─────────────────────────────────────────────────────────────────────────
// 핵심 비즈니스 (What We Do) — 홈 카드 3장과 사례 슬라이드
//
// 카드의 도형 아이콘과 동작(사례 모달 / 교육 페이지 링크)은 관리 대상이
// 아니다. 콘텐츠가 아니라 화면 구조라 바꾸려면 코드가 함께 바뀐다.
// ─────────────────────────────────────────────────────────────────────────

/** 세 사업 축. 카드 수가 바뀌면 홈 3열 레이아웃과 헤더 앵커도 바뀌므로 고정이다. */
export type PillarKey = "software" | "ai" | "education";

export const PILLAR_KEYS: readonly PillarKey[] = ["software", "ai", "education"] as const;

export const pillarKeyLabel: Record<PillarKey, string> = {
  software: "Software",
  ai: "AI Solutions",
  education: "Education",
};

export type HomePillar = ContentBase & {
  key: PillarKey;
  title: string;
  description: string;
  /** 다루는 범위 — 가운뎃점으로 이어 한 줄로 나간다. */
  tags: string[];
  imageUrl?: string;
  imageAlt: string;
  accent: Accent;
};

export type HomePillarExample = ContentBase & {
  pillarKey: PillarKey;
  /** 정적 데이터에서 승계한 식별 키. */
  key: string;
  /** 카드 하단 태그 문자열과 같게 유지한다 — 다르면 같은 대상인지 알기 어렵다. */
  name: string;
  /** 실제 제작 사례일 때만 고객사명. 비우면 화면에 "예시"로 표기된다. */
  client: string;
  headline: string;
  description: string;
  /** 이 유형에서 실제로 하는 일. 3개 권장. */
  highlights: string[];
  imageUrl?: string;
  imageAlt: string;
  accent: Accent;
};
