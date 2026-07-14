"use server";

/**
 * Inquiry write actions (docs/어드민기획.md §6, §11.8).
 *
 * Talk only to the `getAdminData()` seam. Neon and the explicit local mock both
 * revalidate list and detail routes so the UI reflects each write immediately.
 */

import { revalidatePath } from "next/cache";

import { requireAdminAction } from "@/lib/admin/auth";
import { getAdminData } from "@/lib/admin/data";
import type { InquiryStatus } from "@/lib/admin/types";

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  await requireAdminAction();
  await getAdminData().updateInquiry(id, { status });
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
}

export async function updateInquiryMemo(id: string, memo: string) {
  await requireAdminAction();
  await getAdminData().updateInquiry(id, { memo });
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
}
