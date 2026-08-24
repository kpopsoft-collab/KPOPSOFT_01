"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { WorkItem } from "@/lib/admin/content-types";

type WorkInput = Omit<WorkItem, "id" | "sortOrder">;

const LIST = "/admin/content/work";

export async function createWork(input: WorkInput) {
  await getContentData().work.create(input);
  revalidateTag("work", "max");
  revalidatePath(LIST);
  redirect(LIST);
}

export async function updateWork(id: string, input: WorkInput) {
  await getContentData().work.update(id, input);
  revalidateTag("work", "max");
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  redirect(LIST);
}

export async function deleteWork(id: string) {
  await getContentData().work.remove(id);
  revalidateTag("work", "max");
  revalidatePath(LIST);
}

export async function setWorkPublished(id: string, next: boolean) {
  await getContentData().work.update(id, { isPublished: next });
  revalidateTag("work", "max");
  revalidatePath(LIST);
}
