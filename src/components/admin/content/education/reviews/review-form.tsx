"use client";

import { useState, useTransition } from "react";

import type { Accent } from "@/lib/site";
import type { EducationReview } from "@/lib/admin/content-types";
import {
  CheckboxField,
  NumberField,
  TextAreaField,
  TextField,
} from "@/components/admin/content/fields";
import { AccentPicker } from "@/components/admin/content/accent-picker";
import { FormActions } from "@/components/admin/content/education/form-actions";

type Input = Omit<EducationReview, "id" | "sortOrder">;

export function ReviewForm({
  initial,
  onSave,
}: {
  initial?: EducationReview;
  onSave: (input: Input) => Promise<void>;
}) {
  const [key, setKey] = useState(initial?.key ?? "");
  const [rating, setRating] = useState<number>(initial?.rating ?? 5);
  const [body, setBody] = useState(initial?.body ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [program, setProgram] = useState(initial?.program ?? "");
  const [dateLabel, setDateLabel] = useState(initial?.dateLabel ?? "");
  const [accent, setAccent] = useState<Accent>(initial?.accent ?? "mint");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = Boolean(body.trim() && program.trim()) && !pending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        start(() =>
          onSave({
            key: key.trim() || `review-${Date.now()}`,
            // DB 제약이 1~5라 폼에서 먼저 막는다.
            rating: Math.min(5, Math.max(1, Math.round(rating) || 5)),
            body: body.trim(),
            author: author.trim(),
            program: program.trim(),
            dateLabel: dateLabel.trim(),
            accent,
            isPublished,
          }),
        );
      }}
      className="flex max-w-2xl flex-col gap-6"
    >
      {/* 지어낸 후기를 싣지 않는다 — 실제로 받은 글만 옮겨 적는다. */}
      <TextAreaField label="후기 내용" value={body} onChange={setBody} rows={6} />
      <div className="grid gap-6 sm:grid-cols-2">
        <NumberField label="별점 (1~5)" value={rating} onChange={setRating} />
        <TextField
          label="작성자 표기"
          value={author}
          onChange={setAuthor}
          placeholder="입문 과정 수강생"
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="수강 과정" value={program} onChange={setProgram} required />
        <TextField
          label="수강 시기"
          value={dateLabel}
          onChange={setDateLabel}
          placeholder="2026년 7월"
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink/70">카드 색상</span>
        <AccentPicker value={accent} onChange={setAccent} />
      </div>
      <TextField label="식별 키" value={key} onChange={setKey} placeholder="비우면 자동 생성" />
      <CheckboxField label="공개 노출" checked={isPublished} onChange={setIsPublished} />
      <FormActions
        pending={pending}
        canSave={canSave}
        backHref="/admin/content/education/reviews"
      />
    </form>
  );
}
