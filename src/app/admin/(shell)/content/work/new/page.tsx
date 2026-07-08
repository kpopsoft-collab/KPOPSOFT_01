import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { WorkForm } from "@/components/admin/content/work/work-form";
import { createWork } from "../actions";

export default function NewWorkPage() {
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
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">프로젝트 추가</h1>
      </div>
      <WorkForm onSave={createWork} />
    </div>
  );
}
