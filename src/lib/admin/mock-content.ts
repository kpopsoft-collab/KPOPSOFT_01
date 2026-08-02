/**
 * In-memory CMS seed — mirrors src/lib/site.ts so the admin edits real-looking
 * content until Supabase is wired (docs/어드민기획.md §11.8). Module-level arrays
 * persist across requests within a running dev server, so edits stick per session.
 */

import {
  selectedWork,
  experts as siteExperts,
  stats as siteStats,
} from "@/lib/site";
import type {
  EducationClubCohort,
  EducationClubTier,
  EducationFaq,
  EducationOrgTraining,
  EducationPastProgram,
  EducationPastProgramImage,
  EducationRegularClass,
  EducationReview,
  EducationStat,
  Expert,
  HomePillar,
  HomePillarExample,
  Stat,
  WorkItem,
} from "./content-types";

export const mockWork: WorkItem[] = selectedWork.map((w, i) => ({
  id: `work_${i + 1}`,
  sortOrder: i,
  isPublished: true,
  client: w.client,
  title: w.title,
  category: w.category,
  accent: w.accent,
  summary: w.summary,
  challenge: w.challenge,
  solution: w.solution,
  results: [...w.results],
  imageUrls: [],
  scope: [],
  features: [],
  userFlow: "",
  externalUrl: "",
  showOnHome: true,
}));

export const mockExperts: Expert[] = siteExperts.map((e, i) => ({
  id: `expert_${i + 1}`,
  sortOrder: i,
  isPublished: true,
  name: e.name,
  role: e.role,
  quote: e.quote,
  tags: [...e.tags],
  accent: e.accent,
  imageUrl: e.image,
}));

export const mockStats: Stat[] = siteStats.map((s, i) => ({
  id: `stat_${i + 1}`,
  sortOrder: i,
  isPublished: true,
  value: s.value,
  suffix: s.suffix,
  label: s.label,
}));

// ─────────────────────────────────────────────────────────────────────────
// Education (docs/KPOPSOFT_Education_Page_ver3.md — 3분류 체계)
//
// 목 모드는 DB 없이 앱을 띄우기 위한 것이라 전부 빈 배열에서 시작한다. 실제
// 콘텐츠는 Supabase에 있고(`scripts/seed-education-ver3.cjs`로 시딩), 공개
// 화면은 DB가 비면 `src/lib/education-content.ts`로 폴백한다.
// ─────────────────────────────────────────────────────────────────────────

export const mockEducationRegularClasses: EducationRegularClass[] = [];
export const mockEducationClubCohorts: EducationClubCohort[] = [];
export const mockEducationClubTiers: EducationClubTier[] = [];
export const mockEducationPastPrograms: EducationPastProgram[] = [];
export const mockEducationPastProgramImages: EducationPastProgramImage[] = [];
export const mockEducationReviews: EducationReview[] = [];
export const mockEducationFaqs: EducationFaq[] = [];
export const mockEducationStats: EducationStat[] = [];

/** 조직·기업 맞춤 교육 — 싱글턴이라 배열이 아니라 객체다. */
export const mockOrgTraining: EducationOrgTraining = {
  title: "",
  description: "",
  minParticipants: "",
  imageAlt: "",
  imageCaption: "",
  ctaLabel: "",
};

/** 핵심 비즈니스 — 목 모드는 빈 배열에서 시작한다(실제 값은 Supabase). */
export const mockHomePillars: HomePillar[] = [];
export const mockHomePillarExamples: HomePillarExample[] = [];
