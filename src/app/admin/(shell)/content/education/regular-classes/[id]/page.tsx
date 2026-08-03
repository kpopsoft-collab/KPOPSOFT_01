import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { RegularClassForm } from "@/components/admin/content/education/regular-classes/regular-class-form";
import { updateRegularClass } from "../actions";

export default async function EditRegularClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().education.regularClasses.get(id);
  if (!item) notFound();

  return (
    <ContentFormShell
      backHref="/admin/content/education/regular-classes"
      backLabel="정규 클래스"
      title="정규 클래스 수정"
    >
      <RegularClassForm initial={item} onSave={updateRegularClass.bind(null, id)} />
    </ContentFormShell>
  );
}
