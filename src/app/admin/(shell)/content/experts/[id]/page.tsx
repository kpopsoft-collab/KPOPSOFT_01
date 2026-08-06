import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { ExpertForm } from "@/components/admin/content/experts/expert-form";
import { createExpert, updateExpert } from "../actions";

/** 추가·수정 겸용 라우트 (`id === "new"`가 추가). 제약은 docs/06-admin/06 §3. */
export default async function ExpertFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";

  // isNew면 조회를 아예 하지 않는다 — 없는 행을 매번 찾지 않으려고.
  // `?? undefined`는 리포지터리의 null을 폼의 `initial?: T`에 맞추는 것이다.
  const item = (isNew ? undefined : await getContentData().experts.get(id)) ?? undefined;
  if (!isNew && !item) notFound();

  return (
    <ContentFormShell
      backHref="/admin/content/experts"
      backLabel="강사진"
      title={isNew ? "강사 추가" : "강사 수정"}
    >
      <ExpertForm initial={item} onSave={isNew ? createExpert : updateExpert.bind(null, id)} />
    </ContentFormShell>
  );
}
