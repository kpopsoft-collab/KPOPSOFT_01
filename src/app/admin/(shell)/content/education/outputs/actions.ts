"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { EducationOutput } from "@/lib/admin/content-types";

type OutputInput = Omit<EducationOutput, "id" | "sortOrder">;

const LIST = "/admin/content/education/outputs";

export async function createOutput(input: OutputInput) {
  const row = await getContentData().education.outputs.create(input);
  revalidatePath(LIST);
  redirect(`${LIST}/${row.id}`);
}

export async function updateOutput(id: string, input: OutputInput) {
  await getContentData().education.outputs.update(id, input);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  redirect(LIST);
}

export async function deleteOutput(id: string) {
  await getContentData().education.outputs.remove(id);
  revalidatePath(LIST);
}

export async function setOutputPublished(id: string, next: boolean) {
  await getContentData().education.outputs.update(id, { isPublished: next });
  revalidatePath(LIST);
}
