import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { ExpertForm } from "@/components/admin/content/experts/expert-form";
import { updateExpert } from "../actions";

export default async function EditExpertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expert = await getContentData().experts.get(id);
  if (!expert) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/experts"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          강사진
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          강사 수정
        </h1>
      </div>
      <ExpertForm initial={expert} onSave={updateExpert.bind(null, id)} />
    </div>
  );
}
