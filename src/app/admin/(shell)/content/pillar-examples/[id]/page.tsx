import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { PillarExampleForm } from "@/components/admin/content/pillars/pillar-example-form";
import { updatePillarExample } from "../actions";

export default async function EditPillarExamplePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().pillarExamples.get(id);
  if (!item) notFound();

  return (
    <ContentFormShell
      backHref="/admin/content/pillar-examples"
      backLabel="핵심 비즈니스 사례"
      title="사례 수정"
    >
      <PillarExampleForm initial={item} onSave={updatePillarExample.bind(null, id)} />
    </ContentFormShell>
  );
}
