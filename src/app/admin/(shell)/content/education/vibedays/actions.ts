"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { VibedaysRole } from "@/lib/admin/content-types";

type VibedaysRoleInput = Omit<VibedaysRole, "id" | "sortOrder">;

const LIST = "/admin/content/education/vibedays";

export async function createVibedaysRole(input: VibedaysRoleInput) {
  await getContentData().education.vibedaysRoles.create(input);
  revalidatePath(LIST);
  redirect(LIST);
}

export async function updateVibedaysRole(id: string, input: VibedaysRoleInput) {
  await getContentData().education.vibedaysRoles.update(id, input);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  redirect(LIST);
}

export async function deleteVibedaysRole(id: string) {
  await getContentData().education.vibedaysRoles.remove(id);
  revalidatePath(LIST);
}

export async function setVibedaysRolePublished(id: string, next: boolean) {
  await getContentData().education.vibedaysRoles.update(id, { isPublished: next });
  revalidatePath(LIST);
}
