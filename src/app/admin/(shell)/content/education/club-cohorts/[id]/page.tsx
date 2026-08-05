import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { CohortForm } from "@/components/admin/content/education/club-cohorts/cohort-form";
import { updateCohort } from "../actions";

export default async function EditCohortPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().education.clubCohorts.get(id);
  if (!item) notFound();

  return (
    <ContentFormShell
      backHref="/admin/content/education/club-cohorts"
      backLabel="클럽 기수"
      title="클럽 기수 수정"
    >
      <CohortForm initial={item} onSave={updateCohort.bind(null, id)} />
    </ContentFormShell>
  );
}
