import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { CohortForm } from "@/components/admin/content/education/club-cohorts/cohort-form";
import { createCohort } from "../actions";

export default function NewCohortPage() {
  return (
    <ContentFormShell
      backHref="/admin/content/education/club-cohorts"
      backLabel="클럽 기수"
      title="클럽 기수 추가"
    >
      <CohortForm onSave={createCohort} />
    </ContentFormShell>
  );
}
