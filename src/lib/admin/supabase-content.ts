import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ContentData,
  ContentRepo,
  EducationImagesRepo,
  EducationSettingsRepo,
} from "./content-data";
import type {
  ContentBase,
  EducationCase,
  EducationFaq,
  EducationImage,
  EducationImageInput,
  EducationImageOwner,
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

/**
 * Supabase-backed CMS repos (docs/어드민기획.md §4.2 / §11.8 wiring day).
 * Runs through the session server client, so RLS gates writes to admins and
 * lets admins read unpublished rows. camel↔snake mapping is table-driven.
 */

type FieldMap = ReadonlyArray<readonly [camel: string, snake: string]>;

const COMMON: FieldMap = [
  ["sortOrder", "sort_order"],
  ["isPublished", "is_published"],
];

const FIELDS: Record<string, FieldMap> = {
  work_items: [
    ...COMMON,
    ["client", "client"],
    ["title", "title"],
    ["category", "category"],
    ["accent", "accent"],
    ["summary", "summary"],
    ["challenge", "challenge"],
    ["solution", "solution"],
    ["results", "results"],
    ["imageUrl", "image_url"],
    ["showOnHome", "show_on_home"],
    ["isFeatured", "is_featured"],
    ["layoutType", "layout_type"],
  ],
  insights: [
    ...COMMON,
    ["tag", "tag"],
    ["title", "title"],
    ["date", "date"],
    ["accent", "accent"],
    ["excerpt", "excerpt"],
    ["body", "body"],
    ["slug", "slug"],
    ["imageUrl", "image_url"],
    ["inquiryType", "inquiry_type"],
    ["inquirySubtype", "inquiry_subtype"],
  ],
  testimonials: [
    ...COMMON,
    ["quote", "quote"],
    ["author", "author"],
    ["program", "program"],
    ["result", "result"],
    ["company", "company"],
    ["role", "role"],
    ["imageUrl", "image_url"],
    ["showOnEducation", "show_on_education"],
    ["programId", "program_id"],
    ["caseId", "case_id"],
  ],
  experts: [
    ...COMMON,
    ["name", "name"],
    ["role", "role"],
    ["quote", "quote"],
    ["tags", "tags"],
    ["accent", "accent"],
    ["imageUrl", "image_url"],
    ["bio", "bio"],
    ["career", "career"],
  ],
  stats: [
    ...COMMON,
    ["value", "value"],
    ["suffix", "suffix"],
    ["label", "label"],
  ],
  education_programs: [
    ...COMMON,
    ["slug", "slug"],
    ["name", "name"],
    ["vibeLabel", "vibe_label"],
    ["category", "category"],
    ["summary", "summary"],
    ["description", "description"],
    ["targetAudience", "target_audience"],
    ["difficulty", "difficulty"],
    ["duration", "duration"],
    ["format", "format"],
    ["location", "location"],
    ["price", "price"],
    ["recruitStatus", "recruit_status"],
    ["recruitStartDate", "recruit_start_date"],
    ["recruitEndDate", "recruit_end_date"],
    ["coverImageUrl", "cover_image_url"],
    ["heroImageUrl", "hero_image_url"],
    ["isFeatured", "is_featured"],
    ["hasDetailPage", "has_detail_page"],
    ["seoTitle", "seo_title"],
    ["seoDescription", "seo_description"],
  ],
  education_outputs: [
    ...COMMON,
    ["title", "title"],
    ["programId", "program_id"],
    ["category", "category"],
    ["description", "description"],
    ["coverImageUrl", "cover_image_url"],
  ],
  education_cases: [
    ...COMMON,
    ["title", "title"],
    ["industry", "industry"],
    ["companyName", "company_name"],
    ["targetAudience", "target_audience"],
    ["participantCount", "participant_count"],
    ["duration", "duration"],
    ["format", "format"],
    ["goal", "goal"],
    ["mainTask", "main_task"],
    ["outputs", "outputs"],
    ["outcome", "outcome"],
    ["coverImageUrl", "cover_image_url"],
  ],
  education_faqs: [
    ...COMMON,
    ["category", "category"],
    ["question", "question"],
    ["answer", "answer"],
  ],
  vibedays_roles: [
    ...COMMON,
    ["roleName", "role_name"],
    ["tagline", "tagline"],
    ["description", "description"],
    ["characterImageUrl", "character_image_url"],
  ],
};

/** DB row → domain object (id + mapped fields; null nullable columns → undefined,
 * so they line up with the optional (`?`) fields on the domain types). */
function fromRow<T extends ContentBase>(table: string, row: Record<string, unknown>): T {
  const out: Record<string, unknown> = { id: row.id };
  for (const [camel, snake] of FIELDS[table]) {
    const v = row[snake];
    if (v === null || v === undefined) continue;
    out[camel] = v;
  }
  return out as T;
}

/** Partial domain object → DB row columns (skips undefined). */
function toRow(table: string, obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [camel, snake] of FIELDS[table]) {
    if (obj[camel] !== undefined) out[snake] = obj[camel];
  }
  return out;
}

class SupabaseRepo<T extends ContentBase> implements ContentRepo<T> {
  constructor(private table: string) {}

  async list(): Promise<T[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(this.table)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as Record<string, unknown>[]).map((r) => fromRow<T>(this.table, r));
  }

  async get(id: string): Promise<T | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(this.table)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromRow<T>(this.table, data) : null;
  }

  async create(input: Omit<T, "id" | "sortOrder">): Promise<T> {
    const supabase = await createSupabaseServerClient();
    // Next sort_order = current max + 1 (append to the end).
    const { data: top } = await supabase
      .from(this.table)
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (top?.[0]?.sort_order ?? -1) + 1;

    const row = { ...toRow(this.table, input as Record<string, unknown>), sort_order: nextOrder };
    const { data, error } = await supabase
      .from(this.table)
      .insert(row)
      .select("*")
      .single();
    if (error) throw error;
    return fromRow<T>(this.table, data);
  }

  async update(id: string, patch: Partial<Omit<T, "id">>): Promise<T> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(this.table)
      .update(toRow(this.table, patch as Record<string, unknown>))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return fromRow<T>(this.table, data);
  }

  async remove(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from(this.table).delete().eq("id", id);
    if (error) throw error;
  }
}

/**
 * Programs need base CRUD plus the education_program_instructors junction
 * (§28 — relational, not a column), so it wraps SupabaseRepo instead of
 * extending it directly (mirrors MockEducationProgramsRepo).
 */
class SupabaseEducationProgramsRepo implements ContentRepo<EducationProgram> {
  private base = new SupabaseRepo<EducationProgram>("education_programs");

  private async linksFor(programId: string): Promise<string[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("education_program_instructors")
      .select("expert_id")
      .eq("program_id", programId);
    if (error) throw error;
    return (data ?? []).map((r) => r.expert_id as string);
  }

  private async setLinks(programId: string, expertIds: string[]): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error: delError } = await supabase
      .from("education_program_instructors")
      .delete()
      .eq("program_id", programId);
    if (delError) throw delError;
    if (expertIds.length === 0) return;
    const { error: insError } = await supabase
      .from("education_program_instructors")
      .insert(expertIds.map((expert_id) => ({ program_id: programId, expert_id })));
    if (insError) throw insError;
  }

  async list(): Promise<EducationProgram[]> {
    const rows = await this.base.list();
    return Promise.all(
      rows.map(async (r) => ({ ...r, instructorIds: await this.linksFor(r.id) })),
    );
  }

  async get(id: string): Promise<EducationProgram | null> {
    const row = await this.base.get(id);
    if (!row) return null;
    return { ...row, instructorIds: await this.linksFor(id) };
  }

  async create(
    input: Omit<EducationProgram, "id" | "sortOrder">,
  ): Promise<EducationProgram> {
    const { instructorIds, ...rest } = input;
    const row = await this.base.create({ ...rest, instructorIds: [] });
    await this.setLinks(row.id, instructorIds ?? []);
    return { ...row, instructorIds: instructorIds ?? [] };
  }

  async update(
    id: string,
    patch: Partial<Omit<EducationProgram, "id">>,
  ): Promise<EducationProgram> {
    const { instructorIds, ...rest } = patch;
    const row = await this.base.update(id, rest);
    if (instructorIds !== undefined) await this.setLinks(id, instructorIds);
    return { ...row, instructorIds: await this.linksFor(id) };
  }

  async remove(id: string): Promise<void> {
    await this.base.remove(id);
  }
}

const IMAGE_FIELDS: FieldMap = [
  ["ownerType", "owner_type"],
  ["ownerId", "owner_id"],
  ["role", "role"],
  ["imageUrl", "image_url"],
  ["altText", "alt_text"],
  ["caption", "caption"],
  ["isPublic", "is_public"],
  ["isBlurred", "is_blurred"],
  ["isFeatured", "is_featured"],
  ["displayOrder", "display_order"],
];

function imageFromRow(row: Record<string, unknown>): EducationImage {
  const out: Record<string, unknown> = { id: row.id };
  for (const [camel, snake] of IMAGE_FIELDS) {
    const v = row[snake];
    if (v === null || v === undefined) continue;
    out[camel] = v;
  }
  return out as EducationImage;
}

function imageToRow(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [camel, snake] of IMAGE_FIELDS) {
    if (obj[camel] !== undefined) out[snake] = obj[camel];
  }
  return out;
}

/** Polymorphic image-gallery repo (Education §24) — see migration for design rationale. */
class SupabaseEducationImagesRepo implements EducationImagesRepo {
  async listByOwner(
    ownerType: EducationImageOwner,
    ownerId: string,
  ): Promise<EducationImage[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("education_images")
      .select("*")
      .eq("owner_type", ownerType)
      .eq("owner_id", ownerId)
      .order("display_order", { ascending: true });
    if (error) throw error;
    return (data as Record<string, unknown>[]).map(imageFromRow);
  }

  async create(input: EducationImageInput): Promise<EducationImage> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("education_images")
      .insert(imageToRow(input as Record<string, unknown>))
      .select("*")
      .single();
    if (error) throw error;
    return imageFromRow(data);
  }

  async update(
    id: string,
    patch: Partial<EducationImageInput>,
  ): Promise<EducationImage> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("education_images")
      .update(imageToRow(patch as Record<string, unknown>))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return imageFromRow(data);
  }

  async remove(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("education_images").delete().eq("id", id);
    if (error) throw error;
  }
}

const SETTINGS_FIELDS: FieldMap = [
  ["heroEyebrow", "hero_eyebrow"],
  ["heroTitle", "hero_title"],
  ["heroDescription", "hero_description"],
  ["heroImageUrl", "hero_image_url"],
  ["heroCtaPrimaryLabel", "hero_cta_primary_label"],
  ["heroCtaPrimaryHref", "hero_cta_primary_href"],
  ["heroCtaSecondaryLabel", "hero_cta_secondary_label"],
  ["heroCtaSecondaryHref", "hero_cta_secondary_href"],
  ["vibedaysTitle", "vibedays_title"],
  ["vibedaysDescription", "vibedays_description"],
  ["sections", "sections"],
];

/** Singleton Education page settings repo (Education §27.1) — always id=true. */
class SupabaseEducationSettingsRepo implements EducationSettingsRepo {
  async get(): Promise<EducationPageSettings> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("education_page_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (error) throw error;
    const out: Record<string, unknown> = { sections: {} };
    if (data) {
      for (const [camel, snake] of SETTINGS_FIELDS) {
        const v = (data as Record<string, unknown>)[snake];
        if (v === null || v === undefined) continue;
        out[camel] = v;
      }
    }
    return out as EducationPageSettings;
  }

  async update(patch: Partial<EducationPageSettings>): Promise<EducationPageSettings> {
    const supabase = await createSupabaseServerClient();
    const row: Record<string, unknown> = {};
    for (const [camel, snake] of SETTINGS_FIELDS) {
      if ((patch as Record<string, unknown>)[camel] !== undefined) {
        row[snake] = (patch as Record<string, unknown>)[camel];
      }
    }
    const { error } = await supabase
      .from("education_page_settings")
      .update(row)
      .eq("id", true);
    if (error) throw error;
    return this.get();
  }
}

export const supabaseContentData: ContentData = {
  work: new SupabaseRepo<WorkItem>("work_items"),
  insights: new SupabaseRepo<Insight>("insights"),
  testimonials: new SupabaseRepo<Testimonial>("testimonials"),
  experts: new SupabaseRepo<Expert>("experts"),
  stats: new SupabaseRepo<Stat>("stats"),
  education: {
    programs: new SupabaseEducationProgramsRepo(),
    outputs: new SupabaseRepo<EducationOutput>("education_outputs"),
    cases: new SupabaseRepo<EducationCase>("education_cases"),
    faqs: new SupabaseRepo<EducationFaq>("education_faqs"),
    vibedaysRoles: new SupabaseRepo<VibedaysRole>("vibedays_roles"),
    images: new SupabaseEducationImagesRepo(),
    settings: new SupabaseEducationSettingsRepo(),
  },
};
