"use server";

import { revalidatePath } from "next/cache";

import { getContentData } from "@/lib/admin/content-data";
import type { EducationImage, EducationImageInput } from "@/lib/admin/content-types";

/**
 * Shared image-gallery actions for programs/outputs/cases (Education §24).
 * Bound per-caller with the owning entity's edit-page path so the gallery
 * re-renders after every mutation — mirrors the row-actions.tsx pattern used
 * by every other CMS collection.
 */

/** Returns the created row (with its real DB id) so the client can edit/remove
 * it immediately without a full page reload. */
export async function addEducationImage(
  revalidateHref: string,
  input: EducationImageInput,
): Promise<EducationImage> {
  const row = await getContentData().education.images.create(input);
  revalidatePath(revalidateHref);
  return row;
}

export async function updateEducationImage(
  revalidateHref: string,
  id: string,
  patch: Partial<EducationImageInput>,
) {
  await getContentData().education.images.update(id, patch);
  revalidatePath(revalidateHref);
}

export async function removeEducationImage(revalidateHref: string, id: string) {
  await getContentData().education.images.remove(id);
  revalidatePath(revalidateHref);
}
