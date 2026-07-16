"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { EducationCase } from "@/lib/admin/content-types";

type CaseInput = Omit<EducationCase, "id" | "sortOrder">;

const LIST = "/admin/content/education/cases";

export async function createCase(input: CaseInput) {
  const row = await getContentData().education.cases.create(input);
  revalidatePath(LIST);
  redirect(`${LIST}/${row.id}`);
}

export async function updateCase(id: string, input: CaseInput) {
  await getContentData().education.cases.update(id, input);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  redirect(LIST);
}

export async function deleteCase(id: string) {
  await getContentData().education.cases.remove(id);
  revalidatePath(LIST);
}

export async function setCasePublished(id: string, next: boolean) {
  await getContentData().education.cases.update(id, { isPublished: next });
  revalidatePath(LIST);
}
