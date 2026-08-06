import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { ReviewForm } from "@/components/admin/content/education/reviews/review-form";
import { createReview, updateReview } from "../actions";

/** 추가·수정 겸용 라우트 (`id === "new"`가 추가). 제약은 docs/06-admin/06 §3. */
export default async function ReviewFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";

  // isNew면 조회를 아예 하지 않는다 — 없는 행을 매번 찾지 않으려고.
  // `?? undefined`는 리포지터리의 null을 폼의 `initial?: T`에 맞추는 것이다.
  const item =
    (isNew ? undefined : await getContentData().education.reviews.get(id)) ?? undefined;
  if (!isNew && !item) notFound();

  return (
    <ContentFormShell
      backHref="/admin/content/education/reviews"
      backLabel="수강 후기"
      title={isNew ? "수강 후기 추가" : "수강 후기 수정"}
    >
      <ReviewForm initial={item} onSave={isNew ? createReview : updateReview.bind(null, id)} />
    </ContentFormShell>
  );
}
