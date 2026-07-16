"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { EducationFaq } from "@/lib/admin/content-types";

type FaqInput = Omit<EducationFaq, "id" | "sortOrder">;

const LIST = "/admin/content/education/faqs";

export async function createFaq(input: FaqInput) {
  await getContentData().education.faqs.create(input);
  revalidatePath(LIST);
  redirect(LIST);
}

export async function updateFaq(id: string, input: FaqInput) {
  await getContentData().education.faqs.update(id, input);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  redirect(LIST);
}

export async function deleteFaq(id: string) {
  await getContentData().education.faqs.remove(id);
  revalidatePath(LIST);
}

export async function setFaqPublished(id: string, next: boolean) {
  await getContentData().education.faqs.update(id, { isPublished: next });
  revalidatePath(LIST);
}
