import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { RegularClassForm } from "@/components/admin/content/education/regular-classes/regular-class-form";
import { createRegularClass } from "../actions";

export default function NewRegularClassPage() {
  return (
    <ContentFormShell
      backHref="/admin/content/education/regular-classes"
      backLabel="정규 클래스"
      title="정규 클래스 추가"
    >
      <RegularClassForm onSave={createRegularClass} />
    </ContentFormShell>
  );
}
