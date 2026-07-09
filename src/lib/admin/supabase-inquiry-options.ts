import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  InquiryOptionsData,
  InquirySubtypeOption,
  InquiryTypeOption,
} from "./inquiry-options";

/**
 * Supabase-backed inquiry-form options (docs/어드민기획.md §4.2 / §11.8).
 * Two tables (inquiry_types 1-N inquiry_subtypes). Reads nest subtypes via an
 * embedded select; RLS gates writes to admins.
 */

type SubRow = {
  id: string;
  label: string;
  placeholder: string;
  sort_order: number;
  is_active: boolean;
};
type TypeRow = {
  id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  inquiry_subtypes?: SubRow[];
};

function mapSub(r: SubRow): InquirySubtypeOption {
  return {
    id: r.id,
    label: r.label,
    placeholder: r.placeholder,
    sortOrder: r.sort_order,
    isActive: r.is_active,
  };
}

function mapType(r: TypeRow): InquiryTypeOption {
  return {
    id: r.id,
    label: r.label,
    sortOrder: r.sort_order,
    isActive: r.is_active,
    subtypes: (r.inquiry_subtypes ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapSub),
  };
}

class SupabaseInquiryOptions implements InquiryOptionsData {
  async listTypes(): Promise<InquiryTypeOption[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("inquiry_types")
      .select("*, inquiry_subtypes(*)")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as TypeRow[]).map(mapType);
  }

  async getType(id: string): Promise<InquiryTypeOption | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("inquiry_types")
      .select("*, inquiry_subtypes(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapType(data as TypeRow) : null;
  }

  async createType(input: {
    label: string;
    isActive?: boolean;
  }): Promise<InquiryTypeOption> {
    const supabase = await createSupabaseServerClient();
    const { data: top } = await supabase
      .from("inquiry_types")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (top?.[0]?.sort_order ?? -1) + 1;
    const { data, error } = await supabase
      .from("inquiry_types")
      .insert({
        label: input.label,
        is_active: input.isActive ?? true,
        sort_order: nextOrder,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapType(data as TypeRow);
  }

  async updateType(
    id: string,
    patch: { label?: string; isActive?: boolean },
  ): Promise<InquiryTypeOption> {
    const supabase = await createSupabaseServerClient();
    const update: Record<string, unknown> = {};
    if (patch.label !== undefined) update.label = patch.label;
    if (patch.isActive !== undefined) update.is_active = patch.isActive;
    const { error } = await supabase
      .from("inquiry_types")
      .update(update)
      .eq("id", id);
    if (error) throw error;
    const type = await this.getType(id);
    if (!type) throw new Error(`inquiry type not found: ${id}`);
    return type;
  }

  async deleteType(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("inquiry_types").delete().eq("id", id);
    if (error) throw error;
  }

  async addSubtype(
    typeId: string,
    input: { label: string; placeholder: string },
  ): Promise<InquirySubtypeOption> {
    const supabase = await createSupabaseServerClient();
    const { data: top } = await supabase
      .from("inquiry_subtypes")
      .select("sort_order")
      .eq("type_id", typeId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (top?.[0]?.sort_order ?? -1) + 1;
    const { data, error } = await supabase
      .from("inquiry_subtypes")
      .insert({
        type_id: typeId,
        label: input.label,
        placeholder: input.placeholder,
        sort_order: nextOrder,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapSub(data as SubRow);
  }

  async updateSubtype(
    _typeId: string,
    subtypeId: string,
    patch: { label?: string; placeholder?: string; isActive?: boolean },
  ): Promise<InquirySubtypeOption> {
    const supabase = await createSupabaseServerClient();
    const update: Record<string, unknown> = {};
    if (patch.label !== undefined) update.label = patch.label;
    if (patch.placeholder !== undefined) update.placeholder = patch.placeholder;
    if (patch.isActive !== undefined) update.is_active = patch.isActive;
    const { data, error } = await supabase
      .from("inquiry_subtypes")
      .update(update)
      .eq("id", subtypeId)
      .select("*")
      .single();
    if (error) throw error;
    return mapSub(data as SubRow);
  }

  async deleteSubtype(_typeId: string, subtypeId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("inquiry_subtypes")
      .delete()
      .eq("id", subtypeId);
    if (error) throw error;
  }
}

export const supabaseInquiryOptions: InquiryOptionsData =
  new SupabaseInquiryOptions();
