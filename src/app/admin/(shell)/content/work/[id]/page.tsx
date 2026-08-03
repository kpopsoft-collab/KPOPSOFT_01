import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { WorkForm } from "@/components/admin/content/work/work-form";
import { updateWork } from "../actions";

export default async function EditWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().work.get(id);
  if (!item) notFound();

  return (
    <ContentFormShell backHref="/admin/content/work" backLabel="Work" title="프로젝트 수정">
      <WorkForm initial={item} onSave={updateWork.bind(null, id)} />
    </ContentFormShell>
  );
}
