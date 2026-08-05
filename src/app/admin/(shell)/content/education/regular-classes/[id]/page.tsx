import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { RegularClassForm } from "@/components/admin/content/education/regular-classes/regular-class-form";
import { createRegularClass, updateRegularClass } from "../actions";

/**
 * 추가·수정 화면을 한 파일에서 처리한다. `/new`는 별도 세그먼트 없이 이 동적
 * 라우트에 `id === "new"`로 들어온다.
 *
 * 그래서 **`new`는 이 컬렉션에서 쓸 수 없는 id다.** 목록의 `EditLink`가 넘기는
 * 값은 슬러그가 아니라 행 id(`mock-content.ts`는 `xxx_1` 꼴, Supabase는 uuid)라
 * 실제로 충돌할 일은 없지만, id 생성 방식을 바꿀 때는 이 제약을 같이 본다.
 *
 * 추가 화면은 조회를 하지 않는다 — `isNew`면 `getContentData()`를 아예 부르지
 * 않는다. 다만 이 파일이 동적 라우트이므로 `/new`도 정적으로 프리렌더되지는
 * 않는다(합치기 전에는 정적이었다).
 */
export default async function RegularClassFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";

  // get()이 아니라 getForEdit()이다 — 동반 테이블(업로드 원본)까지 함께 읽어야
  // 폼이 원본을 들고 열린다. get()만 쓰면 원본이 빈 문자열이라 이름만 고쳐
  // 저장해도 HTML이 지워진다(백로그 01의 07 §3 5-1).
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
