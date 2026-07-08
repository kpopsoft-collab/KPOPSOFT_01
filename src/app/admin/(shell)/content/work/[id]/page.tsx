import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { WorkForm } from "@/components/admin/content/work/work-form";
import { updateWork } from "../actions";

export default async function EditWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().work.get(id);
  if (!item) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/work"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Work
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">프로젝트 수정</h1>
      </div>
      <WorkForm initial={item} onSave={updateWork.bind(null, id)} />
    </div>
  );
}
