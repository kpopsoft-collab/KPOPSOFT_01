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

/** Home ver2 §7 — how a work item lays out when featured on the home page. */
export type WorkLayoutType = "featured" | "grid" | "horizontal";

export const WORK_LAYOUT_TYPES: readonly WorkLayoutType[] = [
  "featured",
  "grid",
  "horizontal",
] as const;

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
  /** Home ver2 §7 — 홈 노출 여부(별도 컬럼, sortOrder는 재사용). */
  showOnHome: boolean;
  /** Home ver2 §7 — 대표 프로젝트 여부(대형 카드). */
  isFeatured: boolean;
  /** Home ver2 §7 — 홈에서 이 카드가 사용할 레이아웃. */
  layoutType: WorkLayoutType;
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
  /** Education §27.5 — 한 줄 소개 (대표 문구 quote와는 별도 필드). */
  bio: string;
  /** Education §27.5 — 주요 경력 (불릿 목록). */
  career: string[];
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
// Education (docs/KPOPSOFT_Education_Page_ver2.md §27 Admin 구성)
// ─────────────────────────────────────────────────────────────────────────

/** 모집 상태 (§27.2). */
export type EducationRecruitStatus =
  | "scheduled"
  | "open"
  | "closed"
  | "always"
  | "hidden";

export const EDUCATION_RECRUIT_STATUSES: readonly EducationRecruitStatus[] = [
  "scheduled",
  "open",
  "closed",
  "always",
  "hidden",
] as const;

export const educationRecruitStatusLabel: Record<EducationRecruitStatus, string> = {
  scheduled: "모집 예정",
  open: "모집 중",
  closed: "마감",
  always: "상시 문의",
  hidden: "비공개",
};

/** 교육 방식 — §20 문의 폼 옵션과 동일 어휘. */
export type EducationFormat = "offline" | "online" | "hybrid" | "flexible";

export const EDUCATION_FORMATS: readonly EducationFormat[] = [
  "offline",
  "online",
  "hybrid",
  "flexible",
] as const;

export const educationFormatLabel: Record<EducationFormat, string> = {
  offline: "오프라인",
  online: "온라인",
  hybrid: "온·오프라인 혼합",
  flexible: "협의 필요",
};

/** FAQ 카테고리 (§27.8). */
export type EducationFaqCategory =
  | "personal"
  | "company"
  | "preparation"
  | "operations";

export const EDUCATION_FAQ_CATEGORIES: readonly EducationFaqCategory[] = [
  "personal",
  "company",
  "preparation",
  "operations",
] as const;

export const educationFaqCategoryLabel: Record<EducationFaqCategory, string> = {
  personal: "개인 프로그램",
  company: "기업 교육",
  preparation: "준비 사항",
  operations: "신청 및 운영",
};

export type EducationProgram = ContentBase & {
  slug: string;
  name: string;
  /** 감성 라벨 (예: START DAY). */
  vibeLabel: string;
  category: string;
  /** 한 줄 설명. */
  summary: string;
  /** 상세 설명. */
  description: string;
  targetAudience: string;
  difficulty: string;
  duration: string;
  format?: EducationFormat;
  location: string;
  price: string;
  recruitStatus: EducationRecruitStatus;
  recruitStartDate?: string;
  recruitEndDate?: string;
  coverImageUrl?: string;
  heroImageUrl?: string;
  /** 대표 프로그램 여부. */
  isFeatured: boolean;
  /** 상세 페이지 사용 여부(2차 확장 대비, §4). */
  hasDetailPage: boolean;
  seoTitle?: string;
  seoDescription?: string;
  /** Program ↔ Instructor 관계형 연결(§28) — expert id 목록. */
  instructorIds: string[];
};

export type EducationOutput = ContentBase & {
  title: string;
  /** 관련 프로그램(§28 관계형 연결). */
  programId?: string;
  category: string;
  description: string;
  coverImageUrl?: string;
};

export type EducationCase = ContentBase & {
  title: string;
  industry: string;
  companyName: string;
  targetAudience: string;
  participantCount: string;
  duration: string;
  format?: EducationFormat;
  goal: string;
  mainTask: string;
  outputs: string;
  outcome: string;
  coverImageUrl?: string;
};

export type EducationFaq = ContentBase & {
  category: EducationFaqCategory;
  question: string;
  answer: string;
};

export type VibedaysRole = ContentBase & {
  roleName: string;
  tagline: string;
  description: string;
  characterImageUrl?: string;
};

/** 이미지 소유자 종류(§24 설계 근거는 supabase/migrations 참고). */
export type EducationImageOwner = "program" | "output" | "case";

/** 갤러리 역할 — owner별 허용 role은 Admin 화면에서 제한한다. */
export type EducationImageRole = "output" | "site" | "result" | "detail" | "gallery";

/** 이미지별 공개/Blur/대표/순서/alt/caption 메타 (Education §24). */
export type EducationImage = {
  id: string;
  ownerType: EducationImageOwner;
  ownerId: string;
  role: EducationImageRole;
  imageUrl: string;
  altText: string;
  caption?: string;
  isPublic: boolean;
  isBlurred: boolean;
  isFeatured: boolean;
  displayOrder: number;
};

export type EducationImageInput = Omit<EducationImage, "id">;

/** Education Hero/CTA/섹션 노출 설정 (§27.1) — 싱글턴. */
export type EducationSectionKey =
  | "hero"
  | "intent"
  | "programs"
  | "outputs"
  | "vibedays"
  | "howWeLearn"
  | "forOrganizations"
  | "process"
  | "cases"
  | "instructors"
  | "testimonials"
  | "faq"
  | "cta"
  | "contactForm";

export type EducationSectionConfig = {
  isPublished: boolean;
  order: number;
};

export type EducationPageSettings = {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImageUrl?: string;
  heroCtaPrimaryLabel: string;
  heroCtaPrimaryHref: string;
  heroCtaSecondaryLabel: string;
  heroCtaSecondaryHref: string;
  vibedaysTitle: string;
  vibedaysDescription: string;
  sections: Partial<Record<EducationSectionKey, EducationSectionConfig>>;
};

export const EDUCATION_SECTION_KEYS: readonly EducationSectionKey[] = [
  "hero",
  "intent",
  "programs",
  "outputs",
  "vibedays",
  "howWeLearn",
  "forOrganizations",
  "process",
  "cases",
  "instructors",
  "testimonials",
  "faq",
  "cta",
  "contactForm",
] as const;

export const educationSectionLabel: Record<EducationSectionKey, string> = {
  hero: "Hero",
  intent: "방문 목적 선택",
  programs: "대표 교육 프로그램",
  outputs: "교육 결과물",
  vibedays: "VIBEDAYS CLUB",
  howWeLearn: "교육 방식",
  forOrganizations: "기업 맞춤형 교육",
  process: "교육 진행 프로세스",
  cases: "교육 사례",
  instructors: "강사진",
  testimonials: "고객 후기",
  faq: "FAQ",
  cta: "개인 신청 / 기업 상담 CTA",
  contactForm: "기업 교육 문의 폼",
};
