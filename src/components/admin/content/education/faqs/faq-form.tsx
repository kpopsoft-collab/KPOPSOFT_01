"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import {
  EDUCATION_FAQ_CATEGORIES,
  educationFaqCategoryLabel,
  type EducationFaq,
  type EducationFaqCategory,
} from "@/lib/admin/content-types";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/content/fields";

type FaqInput = Omit<EducationFaq, "id" | "sortOrder">;

const selectClass =
  "h-12 w-full rounded-2xl border border-ink/15 bg-ivory/60 px-4 text-base font-medium text-ink outline-none transition-colors focus:border-brand-blue focus:bg-white";

export function FaqForm({
  initial,
  onSave,
}: {
  initial?: EducationFaq;
  onSave: (input: FaqInput) => Promise<void>;
}) {
  const [category, setCategory] = useState<EducationFaqCategory>(
    initial?.category ?? "personal",
  );
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = question.trim() && answer.trim() && !pending;

  const submit = () =>
    start(() =>
      onSave({
        category,
        question: question.trim(),
        answer: answer.trim(),
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
      <label className="flex flex-col gap-2 text-sm font-semibold text-ink/70">
        카테고리
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as EducationFaqCategory)}
          className={selectClass}
        >
          {EDUCATION_FAQ_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {educationFaqCategoryLabel[c]}
            </option>
          ))}
        </select>
      </label>

      <TextField label="질문" value={question} onChange={setQuestion} required placeholder="개발 경험이 없어도 참여할 수 있나요?" />
      <TextAreaField label="답변" value={answer} onChange={setAnswer} rows={5} />

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
          href="/admin/content/education/faqs"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
