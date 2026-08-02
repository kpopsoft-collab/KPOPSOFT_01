"use client";

import { useState, useTransition } from "react";

import type { EducationStat } from "@/lib/admin/content-types";
import { CheckboxField, TextField } from "@/components/admin/content/fields";
import { FormActions } from "@/components/admin/content/education/form-actions";

type Input = Omit<EducationStat, "id" | "sortOrder">;

export function EduStatForm({
  initial,
  onSave,
}: {
  initial?: EducationStat;
  onSave: (input: Input) => Promise<void>;
}) {
  const [key, setKey] = useState(initial?.key ?? "");
  const [value, setValue] = useState(initial?.value ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = Boolean(value.trim() && label.trim()) && !pending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        start(() =>
          onSave({
            key: key.trim() || `stat-${Date.now()}`,
            value: value.trim(),
            label: label.trim(),
            isPublished,
          }),
        );
      }}
      className="flex max-w-2xl flex-col gap-6"
    >
      {/* 홈 수치와 달리 표기까지 포함된 문자열이다 — 카운트업이 숫자만 뽑아 센다. */}
      <TextField
        label="수치"
        value={value}
        onChange={setValue}
        required
        placeholder="200+ / 96% / 4"
      />
      <TextField label="설명" value={label} onChange={setLabel} required placeholder="교육 수료생" />
      <TextField
        label="식별 키"
        value={key}
        onChange={setKey}
        placeholder="비우면 자동 생성"
      />
      <CheckboxField label="공개 노출" checked={isPublished} onChange={setIsPublished} />
      <FormActions
        pending={pending}
        canSave={canSave}
        backHref="/admin/content/education/stats"
      />
    </form>
  );
}
