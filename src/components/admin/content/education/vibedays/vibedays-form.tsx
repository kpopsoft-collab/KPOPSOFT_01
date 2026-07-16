"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import type { VibedaysRole } from "@/lib/admin/content-types";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/content/fields";
import { ImageUpload } from "@/components/admin/content/image-upload";

type VibedaysRoleInput = Omit<VibedaysRole, "id" | "sortOrder">;

export function VibedaysRoleForm({
  initial,
  onSave,
}: {
  initial?: VibedaysRole;
  onSave: (input: VibedaysRoleInput) => Promise<void>;
}) {
  const [roleName, setRoleName] = useState(initial?.roleName ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [characterImageUrl, setCharacterImageUrl] = useState<string | undefined>(
    initial?.characterImageUrl,
  );
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = roleName.trim() && !pending;

  const submit = () =>
    start(() =>
      onSave({
        roleName: roleName.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        characterImageUrl,
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
      <TextField label="역할명" value={roleName} onChange={setRoleName} required placeholder="NEW VIBER" />
      <TextField label="한 줄 태그라인" value={tagline} onChange={setTagline} placeholder="새로운 도구를 발견하는 사람" />
      <TextAreaField label="역할 설명" value={description} onChange={setDescription} />

      <ImageUpload
        value={characterImageUrl}
        onChange={setCharacterImageUrl}
        bucket="education"
        label="캐릭터 이미지"
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
          href="/admin/content/education/vibedays"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
