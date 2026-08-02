import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ContentData,
  ContentRepo,
  EducationOrgTrainingRepo,
  EducationPastProgramImagesRepo,
} from "./content-data";
import type {
  ContentBase,
  EducationClubCohort,
  EducationClubTier,
  EducationFaq,
  EducationOrgTraining,
  EducationPastProgram,
  EducationPastProgramImage,
  EducationPastProgramImageInput,
  EducationRegularClass,
  EducationReview,
  EducationStat,
  Expert,
  HomePillar,
  HomePillarExample,
  Stat,
  WorkItem,
} from "./content-types";

/**
 * Supabase-backed CMS repos (docs/06-admin/ §4.2 / §11.8 wiring day).
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
    ["imageUrls", "image_urls"],
    ["scope", "scope"],
    ["features", "features"],
    ["userFlow", "user_flow"],
    ["externalUrl", "external_url"],
    ["showOnHome", "show_on_home"],
  ],
  experts: [
    ...COMMON,
    ["name", "name"],
    ["role", "role"],
    ["quote", "quote"],
    ["tags", "tags"],
    ["accent", "accent"],
    ["imageUrl", "image_url"],
  ],
  stats: [
    ...COMMON,
    ["value", "value"],
    ["suffix", "suffix"],
    ["label", "label"],
  ],
  home_pillars: [
    ...COMMON,
    ["key", "key"],
    ["title", "title"],
    ["description", "description"],
    ["tags", "tags"],
    ["imageUrl", "image_url"],
    ["imageAlt", "image_alt"],
    ["accent", "accent"],
  ],
  home_pillar_examples: [
    ...COMMON,
    ["pillarKey", "pillar_key"],
    ["key", "key"],
    ["name", "name"],
    ["client", "client"],
    ["headline", "headline"],
    ["description", "description"],
    ["highlights", "highlights"],
    ["imageUrl", "image_url"],
    ["imageAlt", "image_alt"],
    ["accent", "accent"],
  ],
  education_regular_classes: [
    ...COMMON,
    ["slug", "slug"],
    ["indexLabel", "index_label"],
    ["name", "name"],
    ["subtitle", "subtitle"],
    ["description", "description"],
    ["duration", "duration"],
    ["level", "level"],
    ["tracks", "tracks"],
    ["accent", "accent"],
    ["imageUrl", "image_url"],
    ["imageAlt", "image_alt"],
    ["imageCaption", "image_caption"],
    ["curriculum", "curriculum"],
    ["detailHref", "detail_href"],
    ["seoTitle", "seo_title"],
    ["seoDescription", "seo_description"],
  ],
  education_club_cohorts: [
    ...COMMON,
    ["label", "label"],
    ["status", "status"],
    ["recruitPeriod", "recruit_period"],
    ["runPeriod", "run_period"],
    ["price", "price"],
    ["listPrice", "list_price"],
    ["capacity", "capacity"],
    ["note", "note"],
    ["ctaDisabled", "cta_disabled"],
    ["showPrice", "show_price"],
    ["showCapacity", "show_capacity"],
    ["showSchedule", "show_schedule"],
    ["showCta", "show_cta"],
  ],
  education_club_tiers: [
    ...COMMON,
    ["name", "name"],
    ["role", "role"],
    ["points", "points"],
    ["accent", "accent"],
    ["characterSrc", "character_src"],
    ["characterWidth", "character_width"],
    ["characterHeight", "character_height"],
  ],
  education_past_programs: [
    ...COMMON,
    ["slug", "slug"],
    ["title", "title"],
    ["category", "category"],
    ["period", "period"],
    ["audience", "audience"],
    ["duration", "duration"],
    ["summary", "summary"],
    ["outcome", "outcome"],
    ["accent", "accent"],
    ["coverImageUrl", "cover_image_url"],
    ["coverImageAlt", "cover_image_alt"],
    ["coverImageCaption", "cover_image_caption"],
    ["coverUnoptimized", "cover_unoptimized"],
  ],
  education_reviews: [
    ...COMMON,
    ["key", "key"],
    ["rating", "rating"],
    ["body", "body"],
    ["author", "author"],
    ["program", "program"],
    ["dateLabel", "date_label"],
    ["accent", "accent"],
  ],
  education_faqs: [
    ...COMMON,
    ["key", "key"],
    ["question", "question"],
    ["answer", "answer"],
  ],
  education_stats: [
    ...COMMON,
    ["key", "key"],
    ["value", "value"],
    ["label", "label"],
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
 * 지난 프로그램 갤러리 — 부모 행에 딸린 목록이라 ContentBase 모양이 아니고
 * (공개 여부·정렬을 부모가 정한다) 별도 리포지토리로 둔다.
 */
class SupabasePastProgramImagesRepo implements EducationPastProgramImagesRepo {
  private map(row: Record<string, unknown>): EducationPastProgramImage {
    return {
      id: row.id as string,
      programId: row.program_id as string,
      imageUrl: (row.image_url as string) ?? "",
      alt: (row.alt as string) ?? "",
      caption: (row.caption as string) ?? "",
      sortOrder: (row.sort_order as number) ?? 0,
    };
  }

  private toRow(input: Partial<EducationPastProgramImageInput>) {
    const out: Record<string, unknown> = {};
    if (input.programId !== undefined) out.program_id = input.programId;
    if (input.imageUrl !== undefined) out.image_url = input.imageUrl;
    if (input.alt !== undefined) out.alt = input.alt;
    if (input.caption !== undefined) out.caption = input.caption;
    if (input.sortOrder !== undefined) out.sort_order = input.sortOrder;
    return out;
  }

  async listByProgram(programId: string): Promise<EducationPastProgramImage[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("education_past_program_images")
      .select("*")
      .eq("program_id", programId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as Record<string, unknown>[]).map((r) => this.map(r));
  }

  async create(input: EducationPastProgramImageInput): Promise<EducationPastProgramImage> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("education_past_program_images")
      .insert(this.toRow(input))
      .select("*")
      .single();
    if (error) throw error;
    return this.map(data);
  }

  async update(
    id: string,
    patch: Partial<EducationPastProgramImageInput>,
  ): Promise<EducationPastProgramImage> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("education_past_program_images")
      .update(this.toRow(patch))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return this.map(data);
  }

  async remove(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("education_past_program_images")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}

/** 조직·기업 맞춤 교육 — 행이 하나뿐이라 get/update만 있다. */
class SupabaseOrgTrainingRepo implements EducationOrgTrainingRepo {
  private empty: EducationOrgTraining = {
    title: "",
    description: "",
    minParticipants: "",
    imageAlt: "",
    imageCaption: "",
    ctaLabel: "",
  };

  private map(row: Record<string, unknown> | null): EducationOrgTraining {
    if (!row) return this.empty;
    return {
      title: (row.title as string) ?? "",
      description: (row.description as string) ?? "",
      minParticipants: (row.min_participants as string) ?? "",
      ...(row.image_url ? { imageUrl: row.image_url as string } : {}),
      imageAlt: (row.image_alt as string) ?? "",
      imageCaption: (row.image_caption as string) ?? "",
      ctaLabel: (row.cta_label as string) ?? "",
    };
  }

  async get(): Promise<EducationOrgTraining> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("education_org_training")
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return this.map(data);
  }

  async update(patch: Partial<EducationOrgTraining>): Promise<EducationOrgTraining> {
    const supabase = await createSupabaseServerClient();
    const row: Record<string, unknown> = { singleton: true };
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.minParticipants !== undefined) row.min_participants = patch.minParticipants;
    if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl;
    if (patch.imageAlt !== undefined) row.image_alt = patch.imageAlt;
    if (patch.imageCaption !== undefined) row.image_caption = patch.imageCaption;
    if (patch.ctaLabel !== undefined) row.cta_label = patch.ctaLabel;

    // 행이 없을 수도 있어(시딩 전) upsert로 만든다 — singleton 유니크 제약이
    // 두 번째 행을 막으므로 항상 같은 행이 갱신된다.
    const { data, error } = await supabase
      .from("education_org_training")
      .upsert(row, { onConflict: "singleton" })
      .select("*")
      .single();
    if (error) throw error;
    return this.map(data);
  }
}

export const supabaseContentData: ContentData = {
  work: new SupabaseRepo<WorkItem>("work_items"),
  pillars: new SupabaseRepo<HomePillar>("home_pillars"),
  pillarExamples: new SupabaseRepo<HomePillarExample>("home_pillar_examples"),
  experts: new SupabaseRepo<Expert>("experts"),
  stats: new SupabaseRepo<Stat>("stats"),
  education: {
    regularClasses: new SupabaseRepo<EducationRegularClass>("education_regular_classes"),
    orgTraining: new SupabaseOrgTrainingRepo(),
    clubCohorts: new SupabaseRepo<EducationClubCohort>("education_club_cohorts"),
    clubTiers: new SupabaseRepo<EducationClubTier>("education_club_tiers"),
    pastPrograms: new SupabaseRepo<EducationPastProgram>("education_past_programs"),
    pastProgramImages: new SupabasePastProgramImagesRepo(),
    reviews: new SupabaseRepo<EducationReview>("education_reviews"),
    faqs: new SupabaseRepo<EducationFaq>("education_faqs"),
    stats: new SupabaseRepo<EducationStat>("education_stats"),
  },
};
