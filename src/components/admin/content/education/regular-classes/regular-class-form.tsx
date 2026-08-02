"use client";

import { useState, useTransition } from "react";

import type { Accent } from "@/lib/site";
import {
  EDUCATION_TRACKS,
  educationTrackLabel,
  type EducationRegularClass,
  type EducationTrack,
} from "@/lib/admin/content-types";
import {
  CheckboxField,
  CheckboxListField,
  StringListField,
  TextAreaField,
  TextField,
} from "@/components/admin/content/fields";
import { AccentPicker } from "@/components/admin/content/accent-picker";
import { ImageUpload } from "@/components/admin/content/image-upload";
import { FormActions } from "@/components/admin/content/education/form-actions";

type Input = Omit<EducationRegularClass, "id" | "sortOrder">;

export function RegularClassForm({
  initial,
  onSave,
}: {
  initial?: EducationRegularClass;
  onSave: (input: Input) => Promise<void>;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [indexLabel, setIndexLabel] = useState(initial?.indexLabel ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [level, setLevel] = useState(initial?.level ?? "");
  const [tracks, setTracks] = useState<EducationTrack[]>(initial?.tracks ?? []);
  const [accent, setAccent] = useState<Accent>(initial?.accent ?? "blue");
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl);
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt ?? "");
  const [imageCaption, setImageCaption] = useState(initial?.imageCaption ?? "");
  const [curriculum, setCurriculum] = useState<string[]>(initial?.curriculum ?? []);
  const [detailHref, setDetailHref] = useState(initial?.detailHref ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = Boolean(name.trim() && slug.trim()) && !pending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        start(() =>
          onSave({
            slug: slug.trim(),
            indexLabel: indexLabel.trim(),
            name: name.trim(),
            subtitle: subtitle.trim(),
            description: description.trim(),
            duration: duration.trim(),
            level: level.trim(),
            tracks,
            accent,
            ...(imageUrl ? { imageUrl } : {}),
            imageAlt: imageAlt.trim(),
            imageCaption: imageCaption.trim(),
            curriculum,
            detailHref: detailHref.trim(),
            seoTitle: seoTitle.trim(),
            seoDescription: seoDescription.trim(),
            isPublished,
          }),
        );
      }}
      className="flex max-w-2xl flex-col gap-6"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="과정명" value={name} onChange={setName} required placeholder="AI 활용" />
        <TextField label="부제" value={subtitle} onChange={setSubtitle} placeholder="AI 도구 마스터" />
      </div>
      <TextAreaField label="설명" value={description} onChange={setDescription} rows={4} />

      <div className="grid gap-6 sm:grid-cols-3">
        <TextField label="순번 표기" value={indexLabel} onChange={setIndexLabel} placeholder="01" />
        <TextField label="기간" value={duration} onChange={setDuration} placeholder="4주" />
        <TextField label="난이도 표기" value={level} onChange={setLevel} placeholder="입문·중급" />
      </div>

      {/* 난이도 표기와 별개다 — 표기에는 "비개발자 환영" 같은 값도 들어오므로,
          목적 선택이 정렬에 쓰는 축은 이쪽 트랙으로 따로 둔다. */}
      <CheckboxListField
        label="학습 트랙 (목적 선택 정렬에 쓰임)"
        options={EDUCATION_TRACKS.map((t) => ({ value: t, label: educationTrackLabel[t] }))}
        values={tracks}
        onChange={(v) => setTracks(v as EducationTrack[])}
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink/70">카드 색상</span>
        <AccentPicker value={accent} onChange={setAccent} />
      </div>

      <ImageUpload value={imageUrl} onChange={setImageUrl} bucket="education" label="과정 이미지" />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="이미지 대체 텍스트" value={imageAlt} onChange={setImageAlt} />
        <TextField label="이미지 캡션" value={imageCaption} onChange={setImageCaption} />
      </div>

      <StringListField label="주차별 커리큘럼" values={curriculum} onChange={setCurriculum} />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="슬러그" value={slug} onChange={setSlug} required placeholder="ai-tools" />
        <TextField
          label="상세 페이지 경로"
          value={detailHref}
          onChange={setDetailHref}
          placeholder="/education/programs/ai-tools"
        />
      </div>
      <TextField label="SEO 제목" value={seoTitle} onChange={setSeoTitle} />
      <TextAreaField label="SEO 설명" value={seoDescription} onChange={setSeoDescription} rows={3} />

      <CheckboxField label="공개 노출" checked={isPublished} onChange={setIsPublished} />
      <FormActions
        pending={pending}
        canSave={canSave}
        backHref="/admin/content/education/regular-classes"
      />
    </form>
  );
}
