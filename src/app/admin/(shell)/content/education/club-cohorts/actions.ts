"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { EducationClubCohort } from "@/lib/admin/content-types";

type Input = Omit<EducationClubCohort, "id" | "sortOrder">;

const LIST = "/admin/content/education/club-cohorts";
/** 공개 페이지도 함께 무효화한다 — 어드민에서 고친 게 바로 보이지 않으면 고친 줄 모른다. */
const PUBLIC = "/education";

export async function createCohort(input: Input) {
  await getContentData().education.clubCohorts.create(input);
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
  redirect(LIST);
}

export async function updateCohort(id: string, input: Input) {
  await getContentData().education.clubCohorts.update(id, input);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  revalidatePath(PUBLIC);
  redirect(LIST);
}

export async function deleteCohort(id: string) {
  await getContentData().education.clubCohorts.remove(id);
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
}

export async function setCohortPublished(id: string, next: boolean) {
  await getContentData().education.clubCohorts.update(id, { isPublished: next });
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
}
