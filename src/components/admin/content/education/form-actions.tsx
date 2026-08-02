"use client";

import Link from "next/link";

/** 저장·취소 줄 — 교육 폼 7종이 같은 모양을 쓰도록 한 군데로 모았다. */
export function FormActions({
  pending,
  canSave,
  backHref,
}: {
  pending: boolean;
  canSave: boolean;
  backHref: string;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-ink/10 pt-5">
      <button
        type="submit"
        disabled={!canSave}
        className="inline-flex min-h-11 items-center rounded-full bg-brand-blue px-6 font-semibold text-white transition-colors hover:bg-brand-navy disabled:opacity-50"
      >
        {pending ? "저장 중…" : "저장"}
      </button>
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
      >
        취소
      </Link>
    </div>
  );
}
