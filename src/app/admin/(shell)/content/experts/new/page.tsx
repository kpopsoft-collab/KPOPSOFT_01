import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { ExpertForm } from "@/components/admin/content/experts/expert-form";
import { createExpert } from "../actions";

export default function NewExpertPage() {
  return (
    <ContentFormShell backHref="/admin/content/experts" backLabel="강사진" title="강사 추가">
      <ExpertForm onSave={createExpert} />
    </ContentFormShell>
  );
}
