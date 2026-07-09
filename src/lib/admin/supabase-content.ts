import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ContentData, ContentRepo } from "./content-data";
import type {
  ContentBase,
  Expert,
  Insight,
  Stat,
  Testimonial,
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
};

/** DB row → domain object (id + mapped fields; null image → undefined). */
function fromRow<T extends ContentBase>(table: string, row: Record<string, unknown>): T {
  const out: Record<string, unknown> = { id: row.id };
  for (const [camel, snake] of FIELDS[table]) {
    const v = row[snake];
    if (camel === "imageUrl" && (v === null || v === undefined)) continue;
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

export const supabaseContentData: ContentData = {
  work: new SupabaseRepo<WorkItem>("work_items"),
  insights: new SupabaseRepo<Insight>("insights"),
  testimonials: new SupabaseRepo<Testimonial>("testimonials"),
  experts: new SupabaseRepo<Expert>("experts"),
  stats: new SupabaseRepo<Stat>("stats"),
};
