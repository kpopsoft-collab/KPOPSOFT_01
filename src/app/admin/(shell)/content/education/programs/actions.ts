"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { EducationProgram } from "@/lib/admin/content-types";

type ProgramInput = Omit<EducationProgram, "id" | "sortOrder">;

const LIST = "/admin/content/education/programs";

export async function createProgram(input: ProgramInput) {
  const row = await getContentData().education.programs.create(input);
  revalidatePath(LIST);
  redirect(`${LIST}/${row.id}`);
}

export async function updateProgram(id: string, input: ProgramInput) {
  await getContentData().education.programs.update(id, input);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  redirect(LIST);
}

export async function deleteProgram(id: string) {
  await getContentData().education.programs.remove(id);
  revalidatePath(LIST);
}

export async function setProgramPublished(id: string, next: boolean) {
  await getContentData().education.programs.update(id, { isPublished: next });
  revalidatePath(LIST);
}
