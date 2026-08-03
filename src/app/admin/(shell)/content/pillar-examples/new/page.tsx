import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { PillarExampleForm } from "@/components/admin/content/pillars/pillar-example-form";
import { createPillarExample } from "../actions";

export default function NewPillarExamplePage() {
  return (
    <ContentFormShell
      backHref="/admin/content/pillar-examples"
      backLabel="핵심 비즈니스 사례"
      title="사례 추가"
    >
      <PillarExampleForm onSave={createPillarExample} />
    </ContentFormShell>
  );
}
