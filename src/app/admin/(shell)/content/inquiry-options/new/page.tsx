import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { TypeForm } from "@/components/admin/content/inquiry-options/type-form";
import { createType } from "../actions";

export default function NewInquiryTypePage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/inquiry-options"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          문의 옵션
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          유형 추가
        </h1>
        <p className="mt-2 text-sm text-ink/55">
          유형을 먼저 만든 뒤, 세부 유형은 저장 후 관리 화면에서 추가합니다.
        </p>
      </div>
      <TypeForm onSave={async (input) => {
        "use server";
        await createType({ label: input.label });
      }} />
    </div>
  );
}
