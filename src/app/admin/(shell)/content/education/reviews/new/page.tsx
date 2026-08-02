import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ReviewForm } from "@/components/admin/content/education/reviews/review-form";
import { createReview } from "../actions";

export default function NewReviewPage() {
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
          수강 후기 추가
        </h1>
      </div>
      <ReviewForm onSave={createReview} />
    </div>
  );
}
