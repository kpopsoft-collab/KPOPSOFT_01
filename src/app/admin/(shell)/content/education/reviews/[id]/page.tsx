import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { ReviewForm } from "@/components/admin/content/education/reviews/review-form";
import { updateReview } from "../actions";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().education.reviews.get(id);
  if (!item) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/education/reviews"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          수강 후기
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          수강 후기 수정
        </h1>
      </div>
      <ReviewForm initial={item} onSave={updateReview.bind(null, id)} />
    </div>
  );
}
