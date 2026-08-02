import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { PillarForm } from "@/components/admin/content/pillars/pillar-form";
import { updatePillar } from "../actions";

export default async function EditPillarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().pillars.get(id);
  if (!item) notFound();

  return (
    <ContentFormShell
      backHref="/admin/content/pillars"
      backLabel="핵심 비즈니스"
      title={`${item.title} 카드 수정`}
    >
      <PillarForm initial={item} onSave={updatePillar.bind(null, id)} />
    </ContentFormShell>
  );
}
