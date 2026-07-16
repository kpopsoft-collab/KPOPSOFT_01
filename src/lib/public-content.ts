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
import type {
  EducationFaqCategory,
  EducationFormat,
  EducationImageOwner,
  EducationImageRole,
  EducationRecruitStatus,
} from "@/lib/admin/content-types";

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

// ─────────────────────────────────────────────────────────────────────────
// Education (docs/KPOPSOFT_Education_Page_ver2.md) — public readers.
//
// No src/lib/site.ts seed exists for Education yet (it's new content), so
// there is no seed fallback here the way the sections above fall back to
// site.ts. On empty result or any DB error these return `[]` (or a minimal
// default settings object) so /education never breaks mid-migration or
// during an outage — the page's own section components decide whether to
// render an empty state or hide the section entirely (§33).
// ─────────────────────────────────────────────────────────────────────────

export type PublicEducationProgram = {
  id: string;
  slug: string;
  name: string;
  vibeLabel: string;
  category: string;
  summary: string;
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
  isFeatured: boolean;
  hasDetailPage: boolean;
  seoTitle?: string;
  seoDescription?: string;
  displayOrder: number;
  /** expert ids (§28 — Program ↔ Instructor 관계형 연결). */
  instructorIds: string[];
};

export type PublicEducationOutput = {
  id: string;
  title: string;
  programId?: string;
  category: string;
  description: string;
  coverImageUrl?: string;
  displayOrder: number;
};

export type PublicEducationCase = {
  id: string;
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
  displayOrder: number;
};

export type PublicEducationFaq = {
  id: string;
  category: EducationFaqCategory;
  question: string;
  answer: string;
  displayOrder: number;
};

export type PublicVibedaysRole = {
  id: string;
  roleName: string;
  tagline: string;
  description: string;
  characterImageUrl?: string;
  displayOrder: number;
};

/** Image-gallery row (Education §24) — only `isPublic=true` rows are ever returned. */
export type PublicEducationImage = {
  id: string;
  ownerType: EducationImageOwner;
  ownerId: string;
  role: EducationImageRole;
  imageUrl: string;
  altText: string;
  caption?: string;
  isBlurred: boolean;
  isFeatured: boolean;
  displayOrder: number;
};

export type PublicEducationPageSettings = {
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
  sections: Record<string, { isPublished: boolean; order: number } | undefined>;
};

const defaultEducationSettings: PublicEducationPageSettings = {
  heroEyebrow: "KPOPSOFT EDUCATION",
  heroTitle: "",
  heroDescription: "",
  heroCtaPrimaryLabel: "",
  heroCtaPrimaryHref: "",
  heroCtaSecondaryLabel: "",
  heroCtaSecondaryHref: "",
  vibedaysTitle: "",
  vibedaysDescription: "",
  sections: {},
};

export async function getPublicEducationPrograms(): Promise<PublicEducationProgram[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("education_programs")
      .select("*, education_program_instructors(expert_id)")
      .eq("is_published", true)
      .order("display_order", { ascending: true });
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id as string,
      slug: r.slug,
      name: r.name,
      vibeLabel: r.vibe_label,
      category: r.category,
      summary: r.summary,
      description: r.description,
      targetAudience: r.target_audience,
      difficulty: r.difficulty,
      duration: r.duration,
      ...(r.format ? { format: r.format as EducationFormat } : {}),
      location: r.location,
      price: r.price,
      recruitStatus: r.recruit_status as EducationRecruitStatus,
      ...(r.recruit_start_date ? { recruitStartDate: r.recruit_start_date as string } : {}),
      ...(r.recruit_end_date ? { recruitEndDate: r.recruit_end_date as string } : {}),
      ...(r.cover_image_url ? { coverImageUrl: r.cover_image_url as string } : {}),
      ...(r.hero_image_url ? { heroImageUrl: r.hero_image_url as string } : {}),
      isFeatured: r.is_featured,
      hasDetailPage: r.has_detail_page,
      ...(r.seo_title ? { seoTitle: r.seo_title as string } : {}),
      ...(r.seo_description ? { seoDescription: r.seo_description as string } : {}),
      displayOrder: r.display_order,
      instructorIds: (
        (r.education_program_instructors ?? []) as { expert_id: string }[]
      ).map((l) => l.expert_id),
    }));
  } catch {
    return [];
  }
}

/** Find one published program by slug (for the future /education/[slug]). */
export async function getPublicEducationProgramBySlug(
  slug: string,
): Promise<PublicEducationProgram | null> {
  const all = await getPublicEducationPrograms();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getPublicEducationOutputs(): Promise<PublicEducationOutput[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("education_outputs")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true });
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id as string,
      title: r.title,
      ...(r.program_id ? { programId: r.program_id as string } : {}),
      category: r.category,
      description: r.description,
      ...(r.cover_image_url ? { coverImageUrl: r.cover_image_url as string } : {}),
      displayOrder: r.display_order,
    }));
  } catch {
    return [];
  }
}

export async function getPublicEducationCases(): Promise<PublicEducationCase[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("education_cases")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true });
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id as string,
      title: r.title,
      industry: r.industry,
      companyName: r.company_name,
      targetAudience: r.target_audience,
      participantCount: r.participant_count,
      duration: r.duration,
      ...(r.format ? { format: r.format as EducationFormat } : {}),
      goal: r.goal,
      mainTask: r.main_task,
      outputs: r.outputs,
      outcome: r.outcome,
      ...(r.cover_image_url ? { coverImageUrl: r.cover_image_url as string } : {}),
      displayOrder: r.display_order,
    }));
  } catch {
    return [];
  }
}

export async function getPublicEducationFaqs(): Promise<PublicEducationFaq[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("education_faqs")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true });
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id as string,
      category: r.category as EducationFaqCategory,
      question: r.question,
      answer: r.answer,
      displayOrder: r.display_order,
    }));
  } catch {
    return [];
  }
}

export async function getPublicVibedaysRoles(): Promise<PublicVibedaysRole[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("vibedays_roles")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true });
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id as string,
      roleName: r.role_name,
      tagline: r.tagline,
      description: r.description,
      ...(r.character_image_url ? { characterImageUrl: r.character_image_url as string } : {}),
      displayOrder: r.display_order,
    }));
  } catch {
    return [];
  }
}

/** Public (isPublic=true only) images for one gallery owner (Education §24). */
export async function getPublicEducationImages(
  ownerType: EducationImageOwner,
  ownerId: string,
): Promise<PublicEducationImage[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("education_images")
      .select("*")
      .eq("owner_type", ownerType)
      .eq("owner_id", ownerId)
      .eq("is_public", true)
      .order("display_order", { ascending: true });
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id as string,
      ownerType: r.owner_type as EducationImageOwner,
      ownerId: r.owner_id as string,
      role: r.role as EducationImageRole,
      imageUrl: r.image_url,
      altText: r.alt_text,
      ...(r.caption ? { caption: r.caption as string } : {}),
      isBlurred: r.is_blurred,
      isFeatured: r.is_featured,
      displayOrder: r.display_order,
    }));
  } catch {
    return [];
  }
}

export async function getPublicEducationPageSettings(): Promise<PublicEducationPageSettings> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("education_page_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (error || !data) return defaultEducationSettings;
    return {
      heroEyebrow: data.hero_eyebrow ?? defaultEducationSettings.heroEyebrow,
      heroTitle: data.hero_title ?? "",
      heroDescription: data.hero_description ?? "",
      ...(data.hero_image_url ? { heroImageUrl: data.hero_image_url as string } : {}),
      heroCtaPrimaryLabel: data.hero_cta_primary_label ?? "",
      heroCtaPrimaryHref: data.hero_cta_primary_href ?? "",
      heroCtaSecondaryLabel: data.hero_cta_secondary_label ?? "",
      heroCtaSecondaryHref: data.hero_cta_secondary_href ?? "",
      vibedaysTitle: data.vibedays_title ?? "",
      vibedaysDescription: data.vibedays_description ?? "",
      sections: (data.sections as PublicEducationPageSettings["sections"]) ?? {},
    };
  } catch {
    return defaultEducationSettings;
  }
}
