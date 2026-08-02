import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { EduStatForm } from "@/components/admin/content/education/stats/edu-stat-form";
import { createEduStat } from "../actions";

export default function NewEduStatPage() {
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
          교육 성과 추가
        </h1>
      </div>
      <EduStatForm onSave={createEduStat} />
    </div>
  );
}
