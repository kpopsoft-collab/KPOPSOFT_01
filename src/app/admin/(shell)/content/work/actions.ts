"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAction } from "@/lib/admin/auth";
import { getContentData } from "@/lib/admin/content-data";
import type { WorkItem } from "@/lib/admin/content-types";

type WorkInput = Omit<WorkItem, "id" | "sortOrder">;

const LIST = "/admin/content/work";

export async function createWork(input: WorkInput) {
  await requireAdminAction();
  await getContentData().work.create(input);
  revalidatePath(LIST);
  redirect(LIST);
}

export async function updateWork(id: string, input: WorkInput) {
  await requireAdminAction();
  await getContentData().work.update(id, input);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  redirect(LIST);
}

export async function deleteWork(id: string) {
  await requireAdminAction();
  await getContentData().work.remove(id);
  revalidatePath(LIST);
}

export async function setWorkPublished(id: string, next: boolean) {
  await requireAdminAction();
  await getContentData().work.update(id, { isPublished: next });
  revalidatePath(LIST);
}
