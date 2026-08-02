"use client";

import { useState, useTransition } from "react";

import type { Accent } from "@/lib/site";
import {
  EDUCATION_CATEGORIES,
  educationCategoryLabel,
  type EducationCategoryId,
  type EducationPastProgram,
} from "@/lib/admin/content-types";
import {
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/admin/content/fields";
import { AccentPicker } from "@/components/admin/content/accent-picker";
import { ImageUpload } from "@/components/admin/content/image-upload";
import { FormActions } from "@/components/admin/content/education/form-actions";

type Input = Omit<EducationPastProgram, "id" | "sortOrder">;

export function PastProgramForm({
  initial,
  onSave,
}: {
  initial?: EducationPastProgram;
  onSave: (input: Input) => Promise<void>;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<EducationCategoryId>(initial?.category ?? "regular");
  const [period, setPeriod] = useState(initial?.period ?? "");
  const [audience, setAudience] = useState(initial?.audience ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [outcome, setOutcome] = useState(initial?.outcome ?? "");
  const [accent, setAccent] = useState<Accent>(initial?.accent ?? "blue");
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(initial?.coverImageUrl);
  const [coverImageAlt, setCoverImageAlt] = useState(initial?.coverImageAlt ?? "");
  const [coverImageCaption, setCoverImageCaption] = useState(initial?.coverImageCaption ?? "");
  const [coverUnoptimized, setCoverUnoptimized] = useState(initial?.coverUnoptimized ?? false);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = Boolean(title.trim() && slug.trim()) && !pending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        start(() =>
          onSave({
            slug: slug.trim(),
            title: title.trim(),
            category,
            period: period.trim(),
            audience: audience.trim(),
            duration: duration.trim(),
            summary: summary.trim(),
            outcome: outcome.trim(),
            accent,
            ...(coverImageUrl ? { coverImageUrl } : {}),
            coverImageAlt: coverImageAlt.trim(),
            coverImageCaption: coverImageCaption.trim(),
            coverUnoptimized,
            isPublished,
          }),
        );
      }}
      className="flex max-w-2xl flex-col gap-6"
    >
      <TextField label="프로그램명" value={title} onChange={setTitle} required />
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField
          label="분류"
          value={category}
          onChange={setCategory}
          options={EDUCATION_CATEGORIES.map((c) => ({
            value: c,
            label: educationCategoryLabel[c],
          }))}
        />
        <TextField label="진행 시기" value={period} onChange={setPeriod} placeholder="2026년 7월" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="대상" value={audience} onChange={setAudience} placeholder="AI·코딩 입문자" />
        <TextField label="기간·형태" value={duration} onChange={setDuration} placeholder="2회차 실습형 과정" />
      </div>
      <TextAreaField label="한 줄 요약" value={summary} onChange={setSummary} rows={3} />
      <TextAreaField label="결과물" value={outcome} onChange={setOutcome} rows={3} />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink/70">카드 색상</span>
        <AccentPicker value={accent} onChange={setAccent} />
      </div>

      <ImageUpload
        value={coverImageUrl}
        onChange={setCoverImageUrl}
        bucket="education"
        label="대표 이미지"
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="대체 텍스트" value={coverImageAlt} onChange={setCoverImageAlt} />
        <TextField label="캡션" value={coverImageCaption} onChange={setCoverImageCaption} />
      </div>
      {/* 자산을 같은 이름으로 교체했을 때 이전 이미지가 계속 보이는 것을 막는다. */}
      <CheckboxField
        label="이미지 최적화 건너뛰기 (목업 교체 시 캐시 잔상 방지)"
        checked={coverUnoptimized}
        onChange={setCoverUnoptimized}
      />

      <TextField label="슬러그" value={slug} onChange={setSlug} required placeholder="gemini-oneday-class" />
      <CheckboxField label="공개 노출" checked={isPublished} onChange={setIsPublished} />
      <FormActions
        pending={pending}
        canSave={canSave}
        backHref="/admin/content/education/past-programs"
      />
    </form>
  );
}
