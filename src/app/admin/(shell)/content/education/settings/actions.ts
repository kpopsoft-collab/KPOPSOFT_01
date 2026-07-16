"use server";

import { revalidatePath } from "next/cache";

import { getContentData } from "@/lib/admin/content-data";
import type { EducationPageSettings } from "@/lib/admin/content-types";

const PAGE = "/admin/content/education/settings";

export async function updateEducationSettings(input: EducationPageSettings) {
  await getContentData().education.settings.update(input);
  revalidatePath(PAGE);
}
