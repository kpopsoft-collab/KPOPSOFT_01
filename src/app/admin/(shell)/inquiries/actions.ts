"use server";

/**
 * Inquiry write actions (docs/어드민기획.md §6, §11.8).
 *
 * Talk only to the `getAdminData()` seam — today that's the in-memory mock,
 * later the Supabase adapter. Both revalidate the list + detail routes so the
 * UI reflects the write immediately (no client-side cache to invalidate).
 */

import { revalidatePath } from "next/cache";

import { getAdminData } from "@/lib/admin/data";
import type { InquiryStatus } from "@/lib/admin/types";

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  await getAdminData().updateInquiry(id, { status });
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
}

export async function updateInquiryMemo(id: string, memo: string) {
  await getAdminData().updateInquiry(id, { memo });
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
}
