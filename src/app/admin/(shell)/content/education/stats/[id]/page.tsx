import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { EduStatForm } from "@/components/admin/content/education/stats/edu-stat-form";
import { updateEduStat } from "../actions";

export default async function EditEduStatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().education.stats.get(id);
  if (!item) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/education/stats"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          교육 성과
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          교육 성과 수정
        </h1>
      </div>
      <EduStatForm initial={item} onSave={updateEduStat.bind(null, id)} />
    </div>
  );
}
