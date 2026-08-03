import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { WorkForm } from "@/components/admin/content/work/work-form";
import { createWork } from "../actions";

export default function NewWorkPage() {
  return (
    <ContentFormShell backHref="/admin/content/work" backLabel="Work" title="프로젝트 추가">
      <WorkForm onSave={createWork} />
    </ContentFormShell>
  );
}
