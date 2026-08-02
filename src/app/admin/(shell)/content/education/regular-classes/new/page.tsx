import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RegularClassForm } from "@/components/admin/content/education/regular-classes/regular-class-form";
import { createRegularClass } from "../actions";

export default function NewRegularClassPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/education/regular-classes"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          정규 클래스
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          정규 클래스 추가
        </h1>
      </div>
      <RegularClassForm onSave={createRegularClass} />
    </div>
  );
}
