import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { ExpertForm } from "@/components/admin/content/experts/expert-form";
import { updateExpert } from "../actions";

export default async function EditExpertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expert = await getContentData().experts.get(id);
  if (!expert) notFound();

  return (
    <ContentFormShell backHref="/admin/content/experts" backLabel="강사진" title="강사 수정">
      <ExpertForm initial={expert} onSave={updateExpert.bind(null, id)} />
    </ContentFormShell>
  );
}
