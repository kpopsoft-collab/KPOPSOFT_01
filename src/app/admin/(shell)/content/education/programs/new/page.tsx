import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { ProgramForm } from "@/components/admin/content/education/programs/program-form";
import { createProgram } from "../actions";

export default async function NewEducationProgramPage() {
  const experts = await getContentData().experts.list();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/education/programs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          교육 프로그램
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">프로그램 추가</h1>
        <p className="mt-1 text-sm text-ink/50">저장 후 결과물·현장 갤러리 이미지를 추가할 수 있습니다.</p>
      </div>
      <ProgramForm experts={experts} onSave={createProgram} />
    </div>
  );
}
