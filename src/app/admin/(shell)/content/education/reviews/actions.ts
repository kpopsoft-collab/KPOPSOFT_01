"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { EducationReview } from "@/lib/admin/content-types";

type Input = Omit<EducationReview, "id" | "sortOrder">;

const LIST = "/admin/content/education/reviews";
/** 공개 페이지도 함께 무효화한다 — 어드민에서 고친 게 바로 보이지 않으면 고친 줄 모른다. */
const PUBLIC = "/education";

export async function createReview(input: Input) {
  await getContentData().education.reviews.create(input);
  revalidateTag("edu-reviews", "max");
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
  redirect(LIST);
}

export async function updateReview(id: string, input: Input) {
  await getContentData().education.reviews.update(id, input);
  revalidateTag("edu-reviews", "max");
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  revalidatePath(PUBLIC);
  redirect(LIST);
}

export async function deleteReview(id: string) {
  await getContentData().education.reviews.remove(id);
  revalidateTag("edu-reviews", "max");
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
}

export async function setReviewPublished(id: string, next: boolean) {
  await getContentData().education.reviews.update(id, { isPublished: next });
  revalidateTag("edu-reviews", "max");
  revalidatePath(LIST);
  revalidatePath(PUBLIC);
}
