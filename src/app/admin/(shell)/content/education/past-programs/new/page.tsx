import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { PastProgramForm } from "@/components/admin/content/education/past-programs/past-program-form";
import { createPastProgram } from "../actions";

export default function NewPastProgramPage() {
  return (
    <ContentFormShell
      backHref="/admin/content/education/past-programs"
      backLabel="지난 프로그램"
      title="지난 프로그램 추가"
    >
      <PastProgramForm onSave={createPastProgram} />
    </ContentFormShell>
  );
}
