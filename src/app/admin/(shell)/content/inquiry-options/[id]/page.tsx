import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getInquiryOptionsData } from "@/lib/admin/inquiry-options";
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
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <Link
          href="/admin/content/inquiry-options"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          문의 옵션
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          {type.label}
        </h1>
      </div>

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
    </div>
  );
}
