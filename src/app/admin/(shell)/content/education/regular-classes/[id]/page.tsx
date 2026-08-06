import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { RegularClassForm } from "@/components/admin/content/education/regular-classes/regular-class-form";
import { createRegularClass, updateRegularClass } from "../actions";

/** 추가·수정 겸용 라우트 (`id === "new"`가 추가). 제약은 docs/06-admin/06 §3. */
export default async function RegularClassFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";

  // get()이 아니라 getForEdit()이다 — 동반 테이블(업로드 원본)까지 함께 읽어야
  // 폼이 원본을 들고 열린다. get()만 쓰면 원본이 빈 문자열이라 이름만 고쳐
  // 저장해도 HTML이 지워진다(결정기록 01의 07 §3 5-1).
  //
  // `?? undefined` — 리포지터리는 미스를 `null`로 주는데 폼의 `initial`은
  // `EducationRegularClassEdit | undefined`다. `!item` 검사가 `isNew`와 묶여 있어
  // 타입이 좁혀지지 않으므로 여기서 맞춰 준다.
  const item =
    (isNew
      ? undefined
      : await getContentData().education.regularClasses.getForEdit(id)) ?? undefined;
  if (!isNew && !item) notFound();

  return (
    <ContentFormShell
      backHref="/admin/content/education/regular-classes"
      backLabel="정규 클래스"
      title={isNew ? "정규 클래스 추가" : "정규 클래스 수정"}
    >
      <RegularClassForm
        initial={item}
        onSave={isNew ? createRegularClass : updateRegularClass.bind(null, id)}
      />
    </ContentFormShell>
  );
}
