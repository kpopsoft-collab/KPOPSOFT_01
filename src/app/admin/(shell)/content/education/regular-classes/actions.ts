"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { EducationRegularClass } from "@/lib/admin/content-types";

type Input = Omit<EducationRegularClass, "id" | "sortOrder">;

const LIST = "/admin/content/education/regular-classes";
/** 공개 페이지도 함께 무효화한다 — 어드민에서 고친 게 바로 보이지 않으면 고친 줄 모른다. */
const PUBLIC = "/education";

export async function createRegularClass(input: Input) {
  await getContentData().education.regularClasses.create(input);
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
  redirect(LIST);
}

export async function updateRegularClass(id: string, input: Input) {
  await getContentData().education.regularClasses.update(id, input);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  revalidatePath(PUBLIC);
  redirect(LIST);
}

export async function deleteRegularClass(id: string) {
  await getContentData().education.regularClasses.remove(id);
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
}

export async function setRegularClassPublished(id: string, next: boolean) {
  await getContentData().education.regularClasses.update(id, { isPublished: next });
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
}
