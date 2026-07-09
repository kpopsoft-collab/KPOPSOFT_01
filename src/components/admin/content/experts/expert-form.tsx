"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import type { Accent } from "@/lib/site";
import type { Expert } from "@/lib/admin/content-types";
import {
  TextField,
  TextAreaField,
  CheckboxField,
  StringListField,
} from "@/components/admin/content/fields";
import { AccentPicker } from "@/components/admin/content/accent-picker";
import { ImageUpload } from "@/components/admin/content/image-upload";

type ExpertInput = Omit<Expert, "id" | "sortOrder">;

/** Shared create/edit form for an expert. */
export function ExpertForm({
  initial,
  onSave,
}: {
  initial?: Expert;
  onSave: (input: ExpertInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [accent, setAccent] = useState<Accent>(initial?.accent ?? "blue");
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = name.trim() && role.trim() && !pending;

  const submit = () =>
    start(() =>
      onSave({
        name: name.trim(),
        role: role.trim(),
        quote: quote.trim(),
        tags: tags.map((t) => t.trim()).filter(Boolean),
        accent,
        imageUrl,
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
        <TextField label="이름" value={name} onChange={setName} required placeholder="홍길동" />
        <TextField label="역할" value={role} onChange={setRole} required placeholder="Software Lead" />
      </div>

      <TextAreaField
        label="한줄 소개"
        value={quote}
        onChange={setQuote}
        placeholder="강사를 소개하는 한 문장"
      />

      <StringListField
        label="태그"
        values={tags}
        onChange={setTags}
        placeholder="예) AI Automation"
        addLabel="태그 추가"
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink/70">색상</span>
        <AccentPicker value={accent} onChange={setAccent} />
      </div>

      <ImageUpload
        value={imageUrl}
        onChange={setImageUrl}
        bucket="experts"
        label="강사 사진"
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
          href="/admin/content/experts"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
