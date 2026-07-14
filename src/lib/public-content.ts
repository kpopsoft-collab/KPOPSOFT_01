import "server-only";

import { asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  experts,
  inquirySubtypes,
  inquiryTypes,
  insights,
  stats,
  testimonials,
  workItems,
} from "@/lib/db/schema";
import {
  type Accent,
  type Expert,
  experts as seedExperts,
  selectedWork as seedWork,
  insights as seedInsights,
  testimonials as seedTestimonials,
  stats as seedStats,
  inquiryOptions as seedOptions,
} from "@/lib/site";

/**
 * Public-site content readers (docs/어드민기획.md §11.8). Each reads published /
 * active rows through the server-side Neon connection and maps them to the exact
 * src/lib/site.ts shape the sections already consume. On empty result or any
 * error they fall back to the site.ts seed, so the landing page never breaks —
 * even mid-migration or during a DB outage.
 */

export type PublicExpert = Expert;
export type PublicWork = {
  client: string;
  title: string;
  category: string;
  accent: Accent;
  summary: string;
  challenge: string;
  solution: string;
  results: string[];
  imageUrl?: string;
};
export type PublicInsight = {
  tag: string;
  title: string;
  date: string;
  accent: Accent;
  excerpt: string;
  body: string[];
  inquiry: { type: string; subtype: string };
  slug: string;
  imageUrl?: string;
};
export type PublicTestimonial = {
  quote: string;
  author: string;
  program: string;
  result: string;
};
export type PublicStat = { value: number; suffix: string; label: string };
export type PublicInquiryOption = {
  type: string;
  subtypes: { label: string; placeholder: string }[];
};

// site.ts seeds are `as const`; loosen them to the mutable public types for fallback.
const fallbackExperts = seedExperts as PublicExpert[];
const fallbackWork = seedWork as unknown as PublicWork[];
const fallbackTestimonials = seedTestimonials as unknown as PublicTestimonial[];
const fallbackStats = seedStats as unknown as PublicStat[];
const fallbackOptions = seedOptions as unknown as PublicInquiryOption[];
const fallbackInsights: PublicInsight[] = seedInsights.map((n, i) => ({
  tag: n.tag,
  title: n.title,
  date: n.date,
  accent: n.accent,
  excerpt: n.excerpt,
  body: [...n.body],
  inquiry: { type: n.inquiry.type, subtype: n.inquiry.subtype },
  slug: `insight-${i + 1}`,
}));

export async function getPublicExperts(): Promise<PublicExpert[]> {
  try {
    const rows = await getDb()
      .select()
      .from(experts)
      .where(eq(experts.isPublished, true))
      .orderBy(asc(experts.sortOrder));
    if (rows.length === 0) return fallbackExperts;
    return rows.map((r) => ({
      name: r.name,
      role: r.role,
      quote: r.quote,
      tags: r.tags,
      accent: r.accent as Accent,
      ...(r.imageUrl ? { image: r.imageUrl } : {}),
    }));
  } catch {
    return fallbackExperts;
  }
}

export async function getPublicWork(): Promise<PublicWork[]> {
  try {
    const rows = await getDb()
      .select()
      .from(workItems)
      .where(eq(workItems.isPublished, true))
      .orderBy(asc(workItems.sortOrder));
    if (rows.length === 0) return fallbackWork;
    return rows.map((r) => ({
      client: r.client,
      title: r.title,
      category: r.category,
      accent: r.accent as Accent,
      summary: r.summary,
      challenge: r.challenge,
      solution: r.solution,
      results: r.results,
      ...(r.imageUrl ? { imageUrl: r.imageUrl } : {}),
    }));
  } catch {
    return fallbackWork;
  }
}

export async function getPublicInsights(): Promise<PublicInsight[]> {
  try {
    const rows = await getDb()
      .select()
      .from(insights)
      .where(eq(insights.isPublished, true))
      .orderBy(asc(insights.sortOrder));
    if (rows.length === 0) return fallbackInsights;
    return rows.map((r) => ({
      tag: r.tag,
      title: r.title,
      date: r.date,
      accent: r.accent as Accent,
      excerpt: r.excerpt,
      body: r.body,
      inquiry: {
        type: r.inquiryType ?? "",
        subtype: r.inquirySubtype ?? "",
      },
      slug: r.slug,
      ...(r.imageUrl ? { imageUrl: r.imageUrl } : {}),
    }));
  } catch {
    return fallbackInsights;
  }
}

export async function getPublicTestimonials(): Promise<PublicTestimonial[]> {
  try {
    const rows = await getDb()
      .select()
      .from(testimonials)
      .where(eq(testimonials.isPublished, true))
      .orderBy(asc(testimonials.sortOrder));
    if (rows.length === 0) return fallbackTestimonials;
    return rows.map((r) => ({
      quote: r.quote,
      author: r.author,
      program: r.program,
      result: r.result,
    }));
  } catch {
    return fallbackTestimonials;
  }
}

export async function getPublicStats(): Promise<PublicStat[]> {
  try {
    const rows = await getDb()
      .select()
      .from(stats)
      .where(eq(stats.isPublished, true))
      .orderBy(asc(stats.sortOrder));
    if (rows.length === 0) return fallbackStats;
    return rows.map((r) => ({
      value: r.value,
      suffix: r.suffix,
      label: r.label,
    }));
  } catch {
    return fallbackStats;
  }
}

export async function getPublicInquiryOptions(): Promise<PublicInquiryOption[]> {
  try {
    const [types, subtypes] = await Promise.all([
      getDb()
        .select()
        .from(inquiryTypes)
        .where(eq(inquiryTypes.isActive, true))
        .orderBy(asc(inquiryTypes.sortOrder)),
      getDb()
        .select()
        .from(inquirySubtypes)
        .where(eq(inquirySubtypes.isActive, true))
        .orderBy(asc(inquirySubtypes.sortOrder)),
    ]);
    if (types.length === 0) return fallbackOptions;
    return types.map((type) => ({
      type: type.label,
      subtypes: subtypes
        .filter((subtype) => subtype.typeId === type.id)
        .map((s) => ({
          label: s.label,
          placeholder: s.placeholder,
        })),
    }));
  } catch {
    return fallbackOptions;
  }
}

/** Find one published insight by slug (for /insights/[slug]). */
export async function getPublicInsightBySlug(
  slug: string,
): Promise<PublicInsight | null> {
  const all = await getPublicInsights();
  return all.find((n) => n.slug === slug) ?? null;
}
