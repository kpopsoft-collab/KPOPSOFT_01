import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PastProgramForm } from "@/components/admin/content/education/past-programs/past-program-form";
import { createPastProgram } from "../actions";

export default function NewPastProgramPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/education/past-programs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          지난 프로그램
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          지난 프로그램 추가
        </h1>
      </div>
      <PastProgramForm onSave={createPastProgram} />
    </div>
  );
}
