"use client";

import { useState, useTransition } from "react";

import type { EducationFaq } from "@/lib/admin/content-types";
import {
  CheckboxField,
  TextAreaField,
  TextField,
} from "@/components/admin/content/fields";
import { FormActions } from "@/components/admin/content/education/form-actions";

type FaqInput = Omit<EducationFaq, "id" | "sortOrder">;

export function FaqForm({
  initial,
  onSave,
}: {
  initial?: EducationFaq;
  onSave: (input: FaqInput) => Promise<void>;
}) {
  const [key, setKey] = useState(initial?.key ?? "");
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = Boolean(question.trim() && answer.trim()) && !pending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        start(() =>
          onSave({
            key: key.trim() || slugify(question),
            question: question.trim(),
            answer: answer.trim(),
            isPublished,
          }),
        );
      }}
      className="flex max-w-2xl flex-col gap-6"
    >
      <TextField label="질문" value={question} onChange={setQuestion} required />
      <TextAreaField label="답변" value={answer} onChange={setAnswer} rows={6} />
      <TextField
        label="식별 키"
        value={key}
        onChange={setKey}
        placeholder="비우면 질문에서 자동 생성"
      />
      <CheckboxField label="공개 노출" checked={isPublished} onChange={setIsPublished} />
      <FormActions
        pending={pending}
        canSave={canSave}
        backHref="/admin/content/education/faqs"
      />
    </form>
  );
}

/** 한글 질문에서도 충돌하지 않을 키를 만든다 — 영문·숫자만 남기고 나머지는 하이픈. */
function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `faq-${Date.now()}`;
}
