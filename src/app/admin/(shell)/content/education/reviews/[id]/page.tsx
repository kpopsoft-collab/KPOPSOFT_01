import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
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
    <ContentFormShell
      backHref="/admin/content/education/reviews"
      backLabel="수강 후기"
      title="수강 후기 수정"
    >
      <ReviewForm initial={item} onSave={updateReview.bind(null, id)} />
    </ContentFormShell>
  );
}
