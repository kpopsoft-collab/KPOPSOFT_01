import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { EduStatForm } from "@/components/admin/content/education/stats/edu-stat-form";
import { updateEduStat } from "../actions";

export default async function EditEduStatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().education.stats.get(id);
  if (!item) notFound();

  return (
    <ContentFormShell
      backHref="/admin/content/education/stats"
      backLabel="교육 성과"
      title="교육 성과 수정"
    >
      <EduStatForm initial={item} onSave={updateEduStat.bind(null, id)} />
    </ContentFormShell>
  );
}
