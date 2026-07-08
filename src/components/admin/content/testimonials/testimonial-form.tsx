"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import type { Testimonial } from "@/lib/admin/content-types";
import {
  TextField,
  TextAreaField,
  CheckboxField,
} from "@/components/admin/content/fields";

type TestimonialInput = Omit<Testimonial, "id" | "sortOrder">;

export function TestimonialForm({
  initial,
  onSave,
}: {
  initial?: Testimonial;
  onSave: (input: TestimonialInput) => Promise<void>;
}) {
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [program, setProgram] = useState(initial?.program ?? "");
  const [result, setResult] = useState(initial?.result ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = quote.trim() && author.trim() && !pending;

  const submit = () =>
    start(() =>
      onSave({
        quote: quote.trim(),
        author: author.trim(),
        program: program.trim(),
        result: result.trim(),
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
      <TextAreaField label="후기 내용" value={quote} onChange={setQuote} placeholder="고객 후기 한 문장" />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="작성자" value={author} onChange={setAuthor} required placeholder="제조업 · 운영팀" />
        <TextField label="프로그램" value={program} onChange={setProgram} placeholder="기업 맞춤형 교육" />
      </div>
      <TextField label="성과" value={result} onChange={setResult} placeholder="반복 업무 40% 감소" />

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
          href="/admin/content/testimonials"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
