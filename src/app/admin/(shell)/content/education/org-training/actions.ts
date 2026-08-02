"use server";

import { revalidatePath } from "next/cache";

import { getContentData } from "@/lib/admin/content-data";
import type { EducationOrgTraining } from "@/lib/admin/content-types";

const PAGE = "/admin/content/education/org-training";

/** 싱글턴이라 create/delete가 없다 — 저장은 항상 같은 행을 갱신한다. */
export async function saveOrgTraining(input: EducationOrgTraining) {
  await getContentData().education.orgTraining.update(input);
  revalidatePath(PAGE);
  revalidatePath("/education");
}
