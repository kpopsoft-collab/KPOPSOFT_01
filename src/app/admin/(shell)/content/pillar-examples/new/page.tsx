import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PillarExampleForm } from "@/components/admin/content/pillars/pillar-example-form";
import { createPillarExample } from "../actions";

export default function NewPillarExamplePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/pillar-examples"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          핵심 비즈니스 사례
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">사례 추가</h1>
      </div>
      <PillarExampleForm onSave={createPillarExample} />
    </div>
  );
}
