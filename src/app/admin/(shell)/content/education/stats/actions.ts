"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { EducationStat } from "@/lib/admin/content-types";

type Input = Omit<EducationStat, "id" | "sortOrder">;

const LIST = "/admin/content/education/stats";
/** 공개 페이지도 함께 무효화한다 — 어드민에서 고친 게 바로 보이지 않으면 고친 줄 모른다. */
const PUBLIC = "/education";

export async function createEduStat(input: Input) {
  await getContentData().education.stats.create(input);
  revalidateTag("edu-stats", "max");
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
  redirect(LIST);
}

export async function updateEduStat(id: string, input: Input) {
  await getContentData().education.stats.update(id, input);
  revalidateTag("edu-stats", "max");
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  revalidatePath(PUBLIC);
  redirect(LIST);
}

export async function deleteEduStat(id: string) {
  await getContentData().education.stats.remove(id);
  revalidateTag("edu-stats", "max");
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
}

export async function setEduStatPublished(id: string, next: boolean) {
  await getContentData().education.stats.update(id, { isPublished: next });
  revalidateTag("edu-stats", "max");
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
}
