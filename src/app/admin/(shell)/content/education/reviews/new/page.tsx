import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { ReviewForm } from "@/components/admin/content/education/reviews/review-form";
import { createReview } from "../actions";

export default function NewReviewPage() {
  return (
    <ContentFormShell
      backHref="/admin/content/education/reviews"
      backLabel="수강 후기"
      title="수강 후기 추가"
    >
      <ReviewForm onSave={createReview} />
    </ContentFormShell>
  );
}
