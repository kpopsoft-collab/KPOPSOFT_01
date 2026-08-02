"use client";

import { useState, useTransition } from "react";

import type { EducationOrgTraining } from "@/lib/admin/content-types";
import { TextAreaField, TextField } from "@/components/admin/content/fields";
import { ImageUpload } from "@/components/admin/content/image-upload";
import { FormActions } from "@/components/admin/content/education/form-actions";

/**
 * 조직·기업 맞춤 교육은 상품이 하나뿐이라 목록·추가·삭제가 없다.
 * 저장하면 같은 행을 계속 갱신한다.
 */
export function OrgTrainingForm({
  initial,
  onSave,
}: {
  initial: EducationOrgTraining;
  onSave: (input: EducationOrgTraining) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [minParticipants, setMinParticipants] = useState(initial.minParticipants);
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial.imageUrl);
  const [imageAlt, setImageAlt] = useState(initial.imageAlt);
  const [imageCaption, setImageCaption] = useState(initial.imageCaption);
  const [ctaLabel, setCtaLabel] = useState(initial.ctaLabel);
  const [pending, start] = useTransition();

  const canSave = Boolean(title.trim()) && !pending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        start(() =>
          onSave({
            title: title.trim(),
            description,
            minParticipants: minParticipants.trim(),
            ...(imageUrl ? { imageUrl } : {}),
            imageAlt: imageAlt.trim(),
            imageCaption: imageCaption.trim(),
            ctaLabel: ctaLabel.trim(),
          }),
        );
      }}
      className="flex max-w-2xl flex-col gap-6"
    >
      <TextField label="제목" value={title} onChange={setTitle} required />
      {/* 줄바꿈이 화면에 그대로 반영된다 — 의미 단위로 끊어 준다. */}
      <TextAreaField
        label="설명 (줄바꿈 반영)"
        value={description}
        onChange={setDescription}
        rows={4}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          label="최소 인원"
          value={minParticipants}
          onChange={setMinParticipants}
          placeholder="5명 이상"
        />
        <TextField
          label="문의 버튼 문구"
          value={ctaLabel}
          onChange={setCtaLabel}
          placeholder="기업 교육 문의하기"
        />
      </div>

      <ImageUpload value={imageUrl} onChange={setImageUrl} bucket="education" label="대표 이미지" />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="대체 텍스트" value={imageAlt} onChange={setImageAlt} />
        <TextField label="캡션" value={imageCaption} onChange={setImageCaption} />
      </div>

      <FormActions pending={pending} canSave={canSave} backHref="/admin/content/education/org-training" />
    </form>
  );
}
