"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAction } from "@/lib/admin/auth";
import { getContentData } from "@/lib/admin/content-data";
import type { Expert } from "@/lib/admin/content-types";

type ExpertInput = Omit<Expert, "id" | "sortOrder">;

const LIST = "/admin/content/experts";

export async function createExpert(input: ExpertInput) {
  await requireAdminAction();
  await getContentData().experts.create(input);
  revalidatePath(LIST);
  redirect(LIST);
}

export async function updateExpert(id: string, input: ExpertInput) {
  await requireAdminAction();
  await getContentData().experts.update(id, input);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  redirect(LIST);
}

export async function deleteExpert(id: string) {
  await requireAdminAction();
  await getContentData().experts.remove(id);
  revalidatePath(LIST);
}

export async function setExpertPublished(id: string, next: boolean) {
  await requireAdminAction();
  await getContentData().experts.update(id, { isPublished: next });
  revalidatePath(LIST);
}
