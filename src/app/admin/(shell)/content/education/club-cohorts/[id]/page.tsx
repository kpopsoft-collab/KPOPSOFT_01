import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { CohortForm } from "@/components/admin/content/education/club-cohorts/cohort-form";
import { updateCohort } from "../actions";

export default async function EditCohortPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().education.clubCohorts.get(id);
  if (!item) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/education/club-cohorts"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          클럽 기수
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          클럽 기수 수정
        </h1>
      </div>
      <CohortForm initial={item} onSave={updateCohort.bind(null, id)} />
    </div>
  );
}
