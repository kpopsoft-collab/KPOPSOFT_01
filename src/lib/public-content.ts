import { createSupabasePublicClient } from "@/lib/supabase/public";
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
 * active rows through the anon public client and maps them back to the exact
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
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("experts")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return fallbackExperts;
    return data.map((r) => ({
      name: r.name,
      role: r.role,
      quote: r.quote,
      tags: r.tags ?? [],
      accent: r.accent as Accent,
      ...(r.image_url ? { image: r.image_url as string } : {}),
    }));
  } catch {
    return fallbackExperts;
  }
}

export async function getPublicWork(): Promise<PublicWork[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("work_items")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return fallbackWork;
    return data.map((r) => ({
      client: r.client,
      title: r.title,
      category: r.category,
      accent: r.accent as Accent,
      summary: r.summary,
      challenge: r.challenge,
      solution: r.solution,
      results: r.results ?? [],
      ...(r.image_url ? { imageUrl: r.image_url as string } : {}),
    }));
  } catch {
    return fallbackWork;
  }
}

export async function getPublicInsights(): Promise<PublicInsight[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("insights")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return fallbackInsights;
    return data.map((r) => ({
      tag: r.tag,
      title: r.title,
      date: r.date,
      accent: r.accent as Accent,
      excerpt: r.excerpt,
      body: r.body ?? [],
      inquiry: {
        type: r.inquiry_type ?? "",
        subtype: r.inquiry_subtype ?? "",
      },
      slug: r.slug,
      ...(r.image_url ? { imageUrl: r.image_url as string } : {}),
    }));
  } catch {
    return fallbackInsights;
  }
}

export async function getPublicTestimonials(): Promise<PublicTestimonial[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("testimonials")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return fallbackTestimonials;
    return data.map((r) => ({
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
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("stats")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return fallbackStats;
    return data.map((r) => ({
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
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("inquiry_types")
      .select("*, inquiry_subtypes(*)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return fallbackOptions;
    return data.map((t) => ({
      type: t.label as string,
      subtypes: ((t.inquiry_subtypes ?? []) as Record<string, unknown>[])
        .filter((s) => s.is_active !== false)
        .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
        .map((s) => ({
          label: s.label as string,
          placeholder: (s.placeholder as string) ?? "",
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
