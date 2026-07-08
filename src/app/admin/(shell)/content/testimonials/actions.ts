"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import type { Testimonial } from "@/lib/admin/content-types";

type TestimonialInput = Omit<Testimonial, "id" | "sortOrder">;

const LIST = "/admin/content/testimonials";

export async function createTestimonial(input: TestimonialInput) {
  await getContentData().testimonials.create(input);
  revalidatePath(LIST);
  redirect(LIST);
}

export async function updateTestimonial(id: string, input: TestimonialInput) {
  await getContentData().testimonials.update(id, input);
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  redirect(LIST);
}

export async function deleteTestimonial(id: string) {
  await getContentData().testimonials.remove(id);
  revalidatePath(LIST);
}

export async function setTestimonialPublished(id: string, next: boolean) {
  await getContentData().testimonials.update(id, { isPublished: next });
  revalidatePath(LIST);
}
