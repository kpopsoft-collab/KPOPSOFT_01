import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { RegularClassForm } from "@/components/admin/content/education/regular-classes/regular-class-form";
import { updateRegularClass } from "../actions";

export default async function EditRegularClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().education.regularClasses.get(id);
  if (!item) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/education/regular-classes"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          정규 클래스
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          정규 클래스 수정
        </h1>
      </div>
      <RegularClassForm initial={item} onSave={updateRegularClass.bind(null, id)} />
    </div>
  );
}
