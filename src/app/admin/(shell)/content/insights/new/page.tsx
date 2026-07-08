import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { InsightForm } from "@/components/admin/content/insights/insight-form";
import { createInsight } from "../actions";

export default function NewInsightPage() {
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
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">글 추가</h1>
      </div>
      <InsightForm onSave={createInsight} />
    </div>
  );
}
