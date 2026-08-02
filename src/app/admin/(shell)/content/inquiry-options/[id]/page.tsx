import { notFound } from "next/navigation";

import { getInquiryOptionsData } from "@/lib/admin/inquiry-options";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { TypeForm } from "@/components/admin/content/inquiry-options/type-form";
import { SubtypeManager } from "@/components/admin/content/inquiry-options/subtype-manager";
import { updateType } from "../actions";

export default async function EditInquiryTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const type = await getInquiryOptionsData().getType(id);
  if (!type) notFound();

  return (
    <ContentFormShell
      backHref="/admin/content/inquiry-options"
      backLabel="문의 옵션"
      title={type.label}
      className="gap-8"
    >
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold tracking-wide text-ink/50 uppercase">
          유형 정보
        </h2>
        <TypeForm
          initial={{ label: type.label, isActive: type.isActive }}
          onSave={updateType.bind(null, id)}
          showActive
        />
      </section>

      <section className="flex flex-col gap-4 border-t border-ink/10 pt-8">
        <h2 className="text-sm font-bold tracking-wide text-ink/50 uppercase">
          세부 유형 ({type.subtypes.length})
        </h2>
        <SubtypeManager typeId={id} subtypes={type.subtypes} />
      </section>
    </ContentFormShell>
  );
}
