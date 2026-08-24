"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { HomePillarExample } from "@/lib/admin/content-types";

type Input = Omit<HomePillarExample, "id" | "sortOrder">;

const LIST = "/admin/content/pillar-examples";

export async function createPillarExample(input: Input) {
  await getContentData().pillarExamples.create(input);
  revalidateTag("home-pillar-examples", "max");
  revalidatePath(LIST);
  revalidatePath("/");
  redirect(LIST);
}

export async function updatePillarExample(id: string, input: Input) {
  await getContentData().pillarExamples.update(id, input);
  revalidateTag("home-pillar-examples", "max");
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  revalidatePath("/");
  redirect(LIST);
}

export async function deletePillarExample(id: string) {
  await getContentData().pillarExamples.remove(id);
  revalidateTag("home-pillar-examples", "max");
  revalidatePath(LIST);
  revalidatePath("/");
}

export async function setPillarExamplePublished(id: string, next: boolean) {
  await getContentData().pillarExamples.update(id, { isPublished: next });
  revalidateTag("home-pillar-examples", "max");
  revalidatePath(LIST);
  revalidatePath("/");
}
