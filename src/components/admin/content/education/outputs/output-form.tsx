"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import type { EducationOutput, EducationProgram } from "@/lib/admin/content-types";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/content/fields";
import { ImageUpload } from "@/components/admin/content/image-upload";

type OutputInput = Omit<EducationOutput, "id" | "sortOrder">;

const selectClass =
  "h-12 w-full rounded-2xl border border-ink/15 bg-ivory/60 px-4 text-base font-medium text-ink outline-none transition-colors focus:border-brand-blue focus:bg-white";

export function OutputForm({
  initial,
  programs,
  onSave,
}: {
  initial?: EducationOutput;
  programs: EducationProgram[];
  onSave: (input: OutputInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [programId, setProgramId] = useState(initial?.programId ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(
    initial?.coverImageUrl,
  );
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = title.trim() && !pending;

  const submit = () =>
    start(() =>
      onSave({
        title: title.trim(),
        programId: programId || undefined,
        category: category.trim(),
        description: description.trim(),
        coverImageUrl,
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
      <TextField label="제목" value={title} onChange={setTitle} required placeholder="반복 보고서 자동화" />

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold text-ink/70">
          관련 프로그램
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className={selectClass}
          >
            <option value="">연결 안 함</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <TextField label="카테고리" value={category} onChange={setCategory} placeholder="AI Workflow" />
      </div>

      <TextAreaField label="설명" value={description} onChange={setDescription} placeholder="업무 데이터를 입력하면 보고서 초안을 자동 생성하는 도구" />

      <ImageUpload
        value={coverImageUrl}
        onChange={setCoverImageUrl}
        bucket="education"
        label="대표 이미지"
      />

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
          href="/admin/content/education/outputs"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
