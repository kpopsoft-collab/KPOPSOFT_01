"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { EducationPastProgram } from "@/lib/admin/content-types";

type Input = Omit<EducationPastProgram, "id" | "sortOrder">;

const LIST = "/admin/content/education/past-programs";
/** 공개 페이지도 함께 무효화한다 — 어드민에서 고친 게 바로 보이지 않으면 고친 줄 모른다. */
const PUBLIC = "/education";

export async function createPastProgram(input: Input) {
  await getContentData().education.pastPrograms.create(input);
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
  redirect(LIST);
}

export async function updatePastProgram(id: string, input: Input) {
  await getContentData().education.pastPrograms.update(id, input);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  revalidatePath(PUBLIC);
  redirect(LIST);
}

export async function deletePastProgram(id: string) {
  await getContentData().education.pastPrograms.remove(id);
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
}

export async function setPastProgramPublished(id: string, next: boolean) {
  await getContentData().education.pastPrograms.update(id, { isPublished: next });
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
}

/** 갤러리 이미지 — 부모 프로그램 편집 화면 안에서 바로 추가·삭제한다. */
export async function addPastProgramImage(input: {
  programId: string;
  imageUrl: string;
  alt: string;
  caption: string;
  sortOrder: number;
}) {
  await getContentData().education.pastProgramImages.create(input);
  revalidatePath(`${LIST}/${input.programId}`);
  revalidatePath(PUBLIC);
}

export async function removePastProgramImage(id: string, programId: string) {
  await getContentData().education.pastProgramImages.remove(id);
  revalidatePath(`${LIST}/${programId}`);
  revalidatePath(PUBLIC);
}
