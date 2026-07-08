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
  Expert,
  Insight,
  Stat,
  Testimonial,
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
