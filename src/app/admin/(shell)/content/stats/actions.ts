"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { Stat } from "@/lib/admin/content-types";

type StatInput = Omit<Stat, "id" | "sortOrder">;

const LIST = "/admin/content/stats";

export async function createStat(input: StatInput) {
  await getContentData().stats.create(input);
  revalidatePath(LIST);
  redirect(LIST);
}

export async function updateStat(id: string, input: StatInput) {
  await getContentData().stats.update(id, input);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  redirect(LIST);
}

export async function deleteStat(id: string) {
  await getContentData().stats.remove(id);
  revalidatePath(LIST);
}

export async function setStatPublished(id: string, next: boolean) {
  await getContentData().stats.update(id, { isPublished: next });
  revalidatePath(LIST);
}
