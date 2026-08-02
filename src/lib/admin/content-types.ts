/**
 * Admin CMS content types (docs/어드민기획.md §4.2).
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
// Education (docs/KPOPSOFT_Education_Page_ver3.md — 3분류 체계)
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
