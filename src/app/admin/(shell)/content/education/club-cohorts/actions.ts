"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { EducationClubCohort } from "@/lib/admin/content-types";

type Input = Omit<EducationClubCohort, "id" | "sortOrder">;

const LIST = "/admin/content/education/club-cohorts";
/** 공개 페이지도 함께 무효화한다 — 어드민에서 고친 게 바로 보이지 않으면 고친 줄 모른다. */
const PUBLIC = "/education";

export async function createCohort(input: Input) {
  await getContentData().education.clubCohorts.create(input);
  revalidateTag("edu-club-cohorts", "max");
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
  redirect(LIST);
}

export async function updateCohort(id: string, input: Input) {
  await getContentData().education.clubCohorts.update(id, input);
  revalidateTag("edu-club-cohorts", "max");
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  revalidatePath(PUBLIC);
  redirect(LIST);
}

export async function deleteCohort(id: string) {
  await getContentData().education.clubCohorts.remove(id);
  revalidateTag("edu-club-cohorts", "max");
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
}

// setCohortPublished 없음 — 기수 테이블에 is_published 컬럼이 없다(결정기록 04).
// 숨기는 축은 status(예: "ended") 하나다.
