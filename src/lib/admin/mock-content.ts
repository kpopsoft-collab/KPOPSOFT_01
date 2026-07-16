/**
 * In-memory CMS seed — mirrors src/lib/site.ts so the admin edits real-looking
 * content until Supabase is wired (docs/어드민기획.md §11.8). Module-level arrays
 * persist across requests within a running dev server, so edits stick per session.
 */

import {
  selectedWork,
  insights as siteInsights,
  testimonials as siteTestimonials,
  experts as siteExperts,
  stats as siteStats,
} from "@/lib/site";
import type {
  EducationCase,
  EducationFaq,
  EducationImage,
  EducationOutput,
  EducationPageSettings,
  EducationProgram,
  Expert,
  Insight,
  Stat,
  Testimonial,
  VibedaysRole,
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
  showOnHome: true,
  isFeatured: i === 0,
  layoutType: i === 0 ? "featured" : "grid",
}));

export const mockInsights: Insight[] = siteInsights.map((n, i) => ({
  id: `insight_${i + 1}`,
  sortOrder: i,
  isPublished: true,
  tag: n.tag,
  title: n.title.replace(/\n/g, " "),
  date: n.date,
  accent: n.accent,
  excerpt: n.excerpt,
  body: [...n.body],
  slug: `insight-${i + 1}`,
  inquiryType: n.inquiry.type,
  inquirySubtype: n.inquiry.subtype,
}));

export const mockTestimonials: Testimonial[] = siteTestimonials.map((t, i) => ({
  id: `testimonial_${i + 1}`,
  sortOrder: i,
  isPublished: true,
  quote: t.quote,
  author: t.author,
  program: t.program,
  result: t.result,
  company: "",
  role: "",
  showOnEducation: false,
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
  bio: "",
  career: [],
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
// Education (docs/KPOPSOFT_Education_Page_ver2.md §27) — no site.ts seed
// exists yet (Education content is new), so these start empty and Admin
// screens show the existing "등록된 항목이 없습니다" empty state until content
// is entered. Track A's mock education-* data (page-level, non-Admin) is a
// separate concern and is not touched here.
// ─────────────────────────────────────────────────────────────────────────

export const mockEducationPrograms: EducationProgram[] = [];
export const mockEducationOutputs: EducationOutput[] = [];
export const mockEducationCases: EducationCase[] = [];
export const mockEducationFaqs: EducationFaq[] = [];
export const mockVibedaysRoles: VibedaysRole[] = [];

/** Program ↔ Instructor links (mock mode) — mirrors education_program_instructors. */
export const mockProgramInstructorLinks: { programId: string; expertId: string }[] = [];

/** Polymorphic image gallery rows (mock mode) — mirrors education_images. */
export const mockEducationImages: EducationImage[] = [];

/** Singleton Education page settings (mock mode) — mirrors education_page_settings. */
export const mockEducationSettings: EducationPageSettings = {
  heroEyebrow: "KPOPSOFT EDUCATION",
  heroTitle: "배우는 데서 끝나지 않고,\n직접 만들고 적용합니다.",
  heroDescription:
    "AI 활용부터 Vibe Coding, 업무 자동화와 프로토타입 제작까지.\n실제 업무와 아이디어를 중심으로 직접 만들며 배우는\nKPOPSOFT의 실무형 교육 프로그램입니다.",
  heroCtaPrimaryLabel: "교육 프로그램 보기",
  heroCtaPrimaryHref: "#programs",
  heroCtaSecondaryLabel: "기업 교육 상담",
  heroCtaSecondaryHref: "#contact-form",
  vibedaysTitle: "서로 다른 바이브가 만나,\n배우고 만든 날들이 쌓입니다.",
  vibedaysDescription:
    "VIBEDAYS CLUB은 서로 다른 경험과 수준을 가진 사람들이\n배우고, 만들고, 자신의 결과를 나누는\nKPOPSOFT의 실습형 러닝 커뮤니티입니다.",
  sections: {},
};
