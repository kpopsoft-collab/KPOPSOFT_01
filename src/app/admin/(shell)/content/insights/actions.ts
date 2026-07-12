"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAction } from "@/lib/admin/auth";
import { getContentData } from "@/lib/admin/content-data";
import type { Insight } from "@/lib/admin/content-types";

type InsightInput = Omit<Insight, "id" | "sortOrder">;

const LIST = "/admin/content/insights";

export async function createInsight(input: InsightInput) {
  await requireAdminAction();
  await getContentData().insights.create(input);
  revalidatePath(LIST);
  redirect(LIST);
}

export async function updateInsight(id: string, input: InsightInput) {
  await requireAdminAction();
  await getContentData().insights.update(id, input);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  redirect(LIST);
}

export async function deleteInsight(id: string) {
  await requireAdminAction();
  await getContentData().insights.remove(id);
  revalidatePath(LIST);
}

export async function setInsightPublished(id: string, next: boolean) {
  await requireAdminAction();
  await getContentData().insights.update(id, { isPublished: next });
  revalidatePath(LIST);
}
