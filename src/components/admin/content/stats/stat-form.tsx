"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import type { Stat } from "@/lib/admin/content-types";
import {
  TextField,
  NumberField,
  CheckboxField,
} from "@/components/admin/content/fields";

type StatInput = Omit<Stat, "id" | "sortOrder">;

export function StatForm({
  initial,
  onSave,
}: {
  initial?: Stat;
  onSave: (input: StatInput) => Promise<void>;
}) {
  const [value, setValue] = useState<number>(initial?.value ?? 0);
  const [suffix, setSuffix] = useState(initial?.suffix ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = label.trim() && !pending;

  const submit = () =>
    start(() =>
      onSave({
        value: Math.round(value) || 0,
        suffix: suffix.trim(),
        label: label.trim(),
        isPublished,
      }),
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) submit();
      }}
      className="flex max-w-2xl flex-col gap-6"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <NumberField label="수치" value={value} onChange={setValue} />
        <TextField label="접미사" value={suffix} onChange={setSuffix} placeholder="+ 또는 %" />
      </div>
      <TextField label="설명" value={label} onChange={setLabel} required placeholder="완료 프로젝트" />

      <CheckboxField label="공개 노출" checked={isPublished} onChange={setIsPublished} />

      <div className="flex items-center gap-3 border-t border-ink/10 pt-5">
        <button
          type="submit"
          disabled={!canSave}
          className="inline-flex min-h-11 items-center rounded-full bg-brand-blue px-6 font-semibold text-white transition-colors hover:bg-brand-navy disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <Link
          href="/admin/content/stats"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
