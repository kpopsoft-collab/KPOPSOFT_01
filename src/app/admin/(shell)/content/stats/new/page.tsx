import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { StatForm } from "@/components/admin/content/stats/stat-form";
import { createStat } from "../actions";

export default function NewStatPage() {
  return (
    <ContentFormShell backHref="/admin/content/stats" backLabel="수치" title="수치 추가">
      <StatForm onSave={createStat} />
    </ContentFormShell>
  );
}
