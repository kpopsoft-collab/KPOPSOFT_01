"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { inquiryOptions, type Accent } from "@/lib/site";
import type { Insight } from "@/lib/admin/content-types";
import {
  TextField,
  TextAreaField,
  CheckboxField,
  StringListField,
} from "@/components/admin/content/fields";
import { AccentPicker } from "@/components/admin/content/accent-picker";
import { ImageUpload } from "@/components/admin/content/image-upload";

type InsightInput = Omit<Insight, "id" | "sortOrder">;

const selectClass =
  "h-12 w-full rounded-2xl border border-ink/15 bg-ivory/60 px-4 text-base font-medium text-ink outline-none transition-colors focus:border-brand-blue focus:bg-white";

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "");
}

export function InsightForm({
  initial,
  onSave,
}: {
  initial?: Insight;
  onSave: (input: InsightInput) => Promise<void>;
}) {
  const [tag, setTag] = useState(initial?.tag ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [accent, setAccent] = useState<Accent>(initial?.accent ?? "blue");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [body, setBody] = useState<string[]>(initial?.body ?? []);
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl);
  const [inquiryType, setInquiryType] = useState(initial?.inquiryType ?? "");
  const [inquirySubtype, setInquirySubtype] = useState(initial?.inquirySubtype ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const subtypes =
    inquiryOptions.find((o) => o.type === inquiryType)?.subtypes ?? [];
  const canSave = title.trim() && slug.trim() && !pending;

  const submit = () =>
    start(() =>
      onSave({
        tag: tag.trim(),
        title: title.trim(),
        date: date.trim(),
        slug: slugify(slug),
        accent,
        excerpt: excerpt.trim(),
        body: body.map((p) => p.trim()).filter(Boolean),
        imageUrl,
        inquiryType: inquiryType || undefined,
        inquirySubtype: inquiryType ? inquirySubtype || undefined : undefined,
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
        <TextField label="태그" value={tag} onChange={setTag} placeholder="AI Automation" />
        <TextField label="날짜" value={date} onChange={setDate} placeholder="2026.06" />
      </div>
      <TextField label="제목" value={title} onChange={setTitle} required placeholder="업무 자동화, 어디서부터 시작해야 할까" />
      <TextField
        label="슬러그 (URL)"
        value={slug}
        onChange={setSlug}
        required
        placeholder="insight-1"
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink/70">색상</span>
        <AccentPicker value={accent} onChange={setAccent} />
      </div>

      <ImageUpload value={imageUrl} onChange={setImageUrl} label="커버 이미지" />

      <TextAreaField label="요약 (Excerpt)" value={excerpt} onChange={setExcerpt} />

      <StringListField
        label="본문 (문단별)"
        values={body}
        onChange={setBody}
        placeholder="문단 내용"
        multiline
        addLabel="문단 추가"
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold text-ink/70">
          문의 연결 — 유형
          <select
            value={inquiryType}
            onChange={(e) => {
              setInquiryType(e.target.value);
              setInquirySubtype("");
            }}
            className={selectClass}
          >
            <option value="">연결 안 함</option>
            {inquiryOptions.map((o) => (
              <option key={o.type} value={o.type}>
                {o.type}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-ink/70">
          세부 유형
          <select
            value={inquirySubtype}
            onChange={(e) => setInquirySubtype(e.target.value)}
            disabled={!inquiryType}
            className={`${selectClass} disabled:opacity-50`}
          >
            <option value="">선택 안 함</option>
            {subtypes.map((s) => (
              <option key={s.label} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

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
          href="/admin/content/insights"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
