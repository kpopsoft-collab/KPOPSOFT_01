"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { TextField, CheckboxField } from "@/components/admin/content/fields";

/** Create/edit form for an inquiry type (label + active). */
export function TypeForm({
  initial,
  onSave,
  showActive,
}: {
  initial?: { label: string; isActive: boolean };
  onSave: (input: { label: string; isActive: boolean }) => Promise<void>;
  showActive?: boolean;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [pending, start] = useTransition();

  const canSave = label.trim() && !pending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) start(() => onSave({ label: label.trim(), isActive }));
      }}
      className="flex max-w-xl flex-col gap-6"
    >
      <TextField
        label="유형 이름"
        value={label}
        onChange={setLabel}
        required
        placeholder="예) 프로젝트 문의"
      />

      {showActive && (
        <CheckboxField label="폼에 노출" checked={isActive} onChange={setIsActive} />
      )}

      <div className="flex items-center gap-3 border-t border-ink/10 pt-5">
        <button
          type="submit"
          disabled={!canSave}
          className="inline-flex min-h-11 items-center rounded-full bg-brand-blue px-6 font-semibold text-white transition-colors hover:bg-brand-navy disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <Link
          href="/admin/content/inquiry-options"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
