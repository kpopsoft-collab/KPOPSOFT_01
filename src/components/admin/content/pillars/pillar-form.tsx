"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import type { Accent } from "@/lib/site";
import type { HomePillar } from "@/lib/admin/content-types";
import {
  StringListField,
  TextAreaField,
  TextField,
} from "@/components/admin/content/fields";
import { AccentPicker } from "@/components/admin/content/accent-picker";
import { ImageUpload } from "@/components/admin/content/image-upload";

type Input = Omit<HomePillar, "id" | "sortOrder">;

export function PillarForm({
  initial,
  onSave,
}: {
  initial: HomePillar;
  onSave: (input: Input) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial.imageUrl);
  const [imageAlt, setImageAlt] = useState(initial.imageAlt);
  const [accent, setAccent] = useState<Accent>(initial.accent);
  const [pending, start] = useTransition();

  const canSave = Boolean(title.trim()) && !pending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        start(() =>
          onSave({
            key: initial.key,
            title: title.trim(),
            description: description.trim(),
            tags: tags.map((t) => t.trim()).filter(Boolean),
            ...(imageUrl ? { imageUrl } : {}),
            imageAlt: imageAlt.trim(),
            accent,
            isPublished: initial.isPublished,
          }),
        );
      }}
      className="flex max-w-2xl flex-col gap-6"
    >
      <TextField label="제목" value={title} onChange={setTitle} required />
      <TextAreaField label="설명" value={description} onChange={setDescription} rows={3} />

      {/* 칩이 아니라 가운뎃점으로 이은 한 줄 텍스트로 나간다 — 누를 수 있는
          것처럼 보이면 안 되는 자리다. */}
      <StringListField
        label="다루는 범위"
        values={tags}
        onChange={setTags}
        placeholder="예) 웹 서비스"
        addLabel="범위 추가"
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink/70">카드 색상</span>
        <AccentPicker value={accent} onChange={setAccent} />
      </div>

      <ImageUpload value={imageUrl} onChange={setImageUrl} bucket="work" label="카드 이미지" />
      <TextField label="이미지 대체 텍스트" value={imageAlt} onChange={setImageAlt} />

      <div className="flex items-center gap-3 border-t border-ink/10 pt-5">
        <button
          type="submit"
          disabled={!canSave}
          className="inline-flex min-h-11 items-center rounded-full bg-brand-blue px-6 font-semibold text-white transition-colors hover:bg-brand-navy disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <Link
          href="/admin/content/pillars"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
