import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ExpertForm } from "@/components/admin/content/experts/expert-form";
import { createExpert } from "../actions";

export default function NewExpertPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/experts"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          강사진
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          강사 추가
        </h1>
      </div>
      <ExpertForm onSave={createExpert} />
    </div>
  );
}
