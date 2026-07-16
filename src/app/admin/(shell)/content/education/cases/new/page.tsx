import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CaseForm } from "@/components/admin/content/education/cases/case-form";
import { createCase } from "../actions";

export default function NewEducationCasePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/education/cases"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          교육 사례
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">사례 추가</h1>
        <p className="mt-1 text-sm text-ink/50">저장 후 현장·결과물·상세 갤러리 이미지를 추가할 수 있습니다.</p>
      </div>
      <CaseForm onSave={createCase} />
    </div>
  );
}
