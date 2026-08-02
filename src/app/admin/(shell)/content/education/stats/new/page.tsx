import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { EduStatForm } from "@/components/admin/content/education/stats/edu-stat-form";
import { createEduStat } from "../actions";

export default function NewEduStatPage() {
  return (
    <ContentFormShell
      backHref="/admin/content/education/stats"
      backLabel="교육 성과"
      title="교육 성과 추가"
    >
      <EduStatForm onSave={createEduStat} />
    </ContentFormShell>
  );
}
