import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { StatForm } from "@/components/admin/content/stats/stat-form";
import { createStat } from "../actions";

export default function NewStatPage() {
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
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">수치 추가</h1>
      </div>
      <StatForm onSave={createStat} />
    </div>
  );
}
