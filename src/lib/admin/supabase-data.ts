import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  Inquiry,
  InquiryFilter,
  InquiryStats,
  InquiryStatus,
  NewInquiry,
} from "./types";

/** Raw `inquiries` row (snake_case) → domain `Inquiry` (camelCase). */
type InquiryRow = {
  id: string;
  type: string;
  subtype: string;
  sender: string;
  contact: string;
  message: string;
  status: InquiryStatus;
  memo: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: InquiryRow): Inquiry {
  return {
    id: row.id,
    submissionKey: `legacy-${row.id}`,
    type: row.type,
    subtype: row.subtype,
    sender: row.sender,
    contact: row.contact,
    message: row.message,
    status: row.status,
    memo: row.memo ?? "",
    emailStatus: "pending",
    emailMessageId: null,
    emailSentAt: null,
    emailError: null,
    linearStatus: "pending",
    linearIssueId: null,
    linearIssueUrl: null,
    linearError: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Supabase-backed admin data source (docs/어드민기획.md §11.8 wiring day).
 *
 * Reads/updates run through the session-scoped server client, so RLS +
 * `is_admin()` (§5) gate them to logged-in admins. `createInquiry` is the one
 * exception: the public form is anonymous and RLS blocks reading the row back,
 * so it uses the service-role client (server-only) to insert and return.
 */
class SupabaseAdminData {
  async listInquiries(filter: InquiryFilter = {}): Promise<Inquiry[]> {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter.status) query = query.eq("status", filter.status);
    if (filter.type) query = query.eq("type", filter.type);
    const q = filter.query?.trim();
    if (q) query = query.or(`sender.ilike.%${q}%,message.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) throw error;
    return (data as InquiryRow[]).map(mapRow);
  }

  async getInquiry(id: string): Promise<Inquiry | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data as InquiryRow) : null;
  }

  async updateInquiry(
    id: string,
    patch: { status?: InquiryStatus; memo?: string },
  ): Promise<Inquiry> {
    const supabase = await createSupabaseServerClient();
    const update: Record<string, unknown> = {};
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.memo !== undefined) update.memo = patch.memo;

    const { data, error } = await supabase
      .from("inquiries")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return mapRow(data as InquiryRow);
  }

  async createInquiry(input: NewInquiry): Promise<Inquiry> {
    // Service-role: the public submitter is anonymous and RLS forbids reading
    // the inserted row back. Input is validated/honeypotted upstream.
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("inquiries")
      .insert({
        type: input.type,
        subtype: input.subtype,
        sender: input.sender,
        contact: input.contact,
        message: input.message,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapRow(data as InquiryRow);
  }

  async getInquiryStats(): Promise<InquiryStats> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("inquiries")
      .select("status, created_at");
    if (error) throw error;
    const rows = data as { status: InquiryStatus; created_at: string }[];
    return {
      total: rows.length,
      new: rows.filter((r) => r.status === "new").length,
      in_progress: rows.filter((r) => r.status === "in_progress").length,
      done: rows.filter((r) => r.status === "done").length,
      today: rows.filter((r) => isToday(r.created_at)).length,
    };
  }
}

export const supabaseAdminData = new SupabaseAdminData();
