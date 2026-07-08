import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { StatForm } from "@/components/admin/content/stats/stat-form";
import { updateStat } from "../actions";

export default async function EditStatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().stats.get(id);
  if (!item) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/stats"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          수치
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">수치 수정</h1>
      </div>
      <StatForm initial={item} onSave={updateStat.bind(null, id)} />
    </div>
  );
}
