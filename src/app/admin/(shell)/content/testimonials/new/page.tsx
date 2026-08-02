import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { TestimonialForm } from "@/components/admin/content/testimonials/testimonial-form";
import { createTestimonial } from "../actions";

export default async function NewTestimonialPage() {
  const data = getContentData();
  const [programs, cases] = await Promise.all([
    data.education.regularClasses.list(),
    data.education.pastPrograms.list(),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/testimonials"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          후기
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">후기 추가</h1>
      </div>
      <TestimonialForm programs={programs} cases={cases} onSave={createTestimonial} />
    </div>
  );
}
