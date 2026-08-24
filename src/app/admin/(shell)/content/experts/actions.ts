"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { Expert } from "@/lib/admin/content-types";

type ExpertInput = Omit<Expert, "id" | "sortOrder">;

const LIST = "/admin/content/experts";

export async function createExpert(input: ExpertInput) {
  await getContentData().experts.create(input);
  revalidateTag("experts", "max");
  revalidatePath(LIST);
  redirect(LIST);
}

export async function updateExpert(id: string, input: ExpertInput) {
  await getContentData().experts.update(id, input);
  revalidateTag("experts", "max");
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  redirect(LIST);
}

export async function deleteExpert(id: string) {
  await getContentData().experts.remove(id);
  revalidateTag("experts", "max");
  revalidatePath(LIST);
}

export async function setExpertPublished(id: string, next: boolean) {
  await getContentData().experts.update(id, { isPublished: next });
  revalidateTag("experts", "max");
  revalidatePath(LIST);
}
