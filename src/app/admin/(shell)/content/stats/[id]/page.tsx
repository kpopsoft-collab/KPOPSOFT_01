import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { StatForm } from "@/components/admin/content/stats/stat-form";
import { updateStat } from "../actions";

export default async function EditStatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().stats.get(id);
  if (!item) notFound();

  return (
    <ContentFormShell backHref="/admin/content/stats" backLabel="수치" title="수치 수정">
      <StatForm initial={item} onSave={updateStat.bind(null, id)} />
    </ContentFormShell>
  );
}
