import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { InsightForm } from "@/components/admin/content/insights/insight-form";
import { updateInsight } from "../actions";

export default async function EditInsightPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().insights.get(id);
  if (!item) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/insights"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Insights
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">글 수정</h1>
      </div>
      <InsightForm initial={item} onSave={updateInsight.bind(null, id)} />
    </div>
  );
}
