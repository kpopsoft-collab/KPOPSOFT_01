"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getInquiryOptionsData } from "@/lib/admin/inquiry-options";

const LIST = "/admin/content/inquiry-options";

/* ---- Types ---- */

export async function createType(input: { label: string }) {
  await getInquiryOptionsData().createType(input);
  revalidatePath(LIST);
  redirect(LIST);
}

export async function updateType(
  id: string,
  input: { label: string; isActive: boolean },
) {
  await getInquiryOptionsData().updateType(id, input);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  redirect(LIST);
}

export async function setTypeActive(id: string, next: boolean) {
  await getInquiryOptionsData().updateType(id, { isActive: next });
  revalidatePath(LIST);
}

export async function deleteType(id: string) {
  await getInquiryOptionsData().deleteType(id);
  revalidatePath(LIST);
}

/* ---- Subtypes (managed within a type) ---- */

export async function addSubtype(
  typeId: string,
  input: { label: string; placeholder: string },
) {
  await getInquiryOptionsData().addSubtype(typeId, input);
  revalidatePath(`${LIST}/${typeId}`);
}

export async function updateSubtype(
  typeId: string,
  subtypeId: string,
  patch: { label?: string; placeholder?: string; isActive?: boolean },
) {
  await getInquiryOptionsData().updateSubtype(typeId, subtypeId, patch);
  revalidatePath(`${LIST}/${typeId}`);
}

export async function deleteSubtype(typeId: string, subtypeId: string) {
  await getInquiryOptionsData().deleteSubtype(typeId, subtypeId);
  revalidatePath(`${LIST}/${typeId}`);
}
