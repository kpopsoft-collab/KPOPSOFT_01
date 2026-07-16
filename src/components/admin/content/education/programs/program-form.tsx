"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import {
  EDUCATION_FORMATS,
  EDUCATION_RECRUIT_STATUSES,
  educationFormatLabel,
  educationRecruitStatusLabel,
  type EducationFormat,
  type EducationProgram,
  type EducationRecruitStatus,
} from "@/lib/admin/content-types";
import type { Expert } from "@/lib/admin/content-types";
import {
  TextField,
  TextAreaField,
  CheckboxField,
  CheckboxListField,
  DateField,
} from "@/components/admin/content/fields";
import { ImageUpload } from "@/components/admin/content/image-upload";

type ProgramInput = Omit<EducationProgram, "id" | "sortOrder">;

const selectClass =
  "h-12 w-full rounded-2xl border border-ink/15 bg-ivory/60 px-4 text-base font-medium text-ink outline-none transition-colors focus:border-brand-blue focus:bg-white";

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "");
}

export function ProgramForm({
  initial,
  experts,
  onSave,
}: {
  initial?: EducationProgram;
  experts: Expert[];
  onSave: (input: ProgramInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [vibeLabel, setVibeLabel] = useState(initial?.vibeLabel ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [targetAudience, setTargetAudience] = useState(initial?.targetAudience ?? "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [format, setFormat] = useState<EducationFormat | "">(initial?.format ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [recruitStatus, setRecruitStatus] = useState<EducationRecruitStatus>(
    initial?.recruitStatus ?? "hidden",
  );
  const [recruitStartDate, setRecruitStartDate] = useState(initial?.recruitStartDate ?? "");
  const [recruitEndDate, setRecruitEndDate] = useState(initial?.recruitEndDate ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(
    initial?.coverImageUrl,
  );
  const [heroImageUrl, setHeroImageUrl] = useState<string | undefined>(
    initial?.heroImageUrl,
  );
  const [instructorIds, setInstructorIds] = useState<string[]>(initial?.instructorIds ?? []);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [hasDetailPage, setHasDetailPage] = useState(initial?.hasDetailPage ?? false);
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = name.trim() && slug.trim() && !pending;

  const submit = () =>
    start(() =>
      onSave({
        name: name.trim(),
        slug: slugify(slug),
        vibeLabel: vibeLabel.trim(),
        category: category.trim(),
        summary: summary.trim(),
        description: description.trim(),
        targetAudience: targetAudience.trim(),
        difficulty: difficulty.trim(),
        duration: duration.trim(),
        format: format || undefined,
        location: location.trim(),
        price: price.trim(),
        recruitStatus,
        recruitStartDate: recruitStartDate || undefined,
        recruitEndDate: recruitEndDate || undefined,
        coverImageUrl,
        heroImageUrl,
        instructorIds,
        isFeatured,
        hasDetailPage,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
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
        <TextField label="프로그램명" value={name} onChange={setName} required placeholder="AI 활용 입문" />
        <TextField label="슬러그 (URL)" value={slug} onChange={setSlug} required placeholder="ai-intro" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="감성 라벨" value={vibeLabel} onChange={setVibeLabel} placeholder="START DAY" />
        <TextField label="카테고리" value={category} onChange={setCategory} placeholder="개인 · 입문" />
      </div>

      <TextAreaField label="한 줄 설명" value={summary} onChange={setSummary} rows={2} placeholder="생성형 AI의 기본 개념과 주요 도구를 이해하고 업무에 활용하기 위한 기초를 익힙니다." />
      <TextAreaField label="상세 설명" value={description} onChange={setDescription} rows={5} />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="추천 대상" value={targetAudience} onChange={setTargetAudience} placeholder="AI를 처음 접하는 실무자" />
        <TextField label="난이도" value={difficulty} onChange={setDifficulty} placeholder="입문" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="교육 시간" value={duration} onChange={setDuration} placeholder="3시간" />
        <label className="flex flex-col gap-2 text-sm font-semibold text-ink/70">
          교육 방식
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as EducationFormat | "")}
            className={selectClass}
          >
            <option value="">선택 안 함</option>
            {EDUCATION_FORMATS.map((f) => (
              <option key={f} value={f}>
                {educationFormatLabel[f]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="교육 장소" value={location} onChange={setLocation} placeholder="KPOPSOFT 오피스" />
        <TextField label="가격" value={price} onChange={setPrice} placeholder="협의 또는 300,000원" />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-semibold text-ink/70">
          모집 상태
          <select
            value={recruitStatus}
            onChange={(e) => setRecruitStatus(e.target.value as EducationRecruitStatus)}
            className={selectClass}
          >
            {EDUCATION_RECRUIT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {educationRecruitStatusLabel[s]}
              </option>
            ))}
          </select>
        </label>
        <DateField label="모집 시작일" value={recruitStartDate} onChange={setRecruitStartDate} />
        <DateField label="모집 종료일" value={recruitEndDate} onChange={setRecruitEndDate} />
      </div>

      <ImageUpload
        value={coverImageUrl}
        onChange={setCoverImageUrl}
        bucket="education"
        label="대표 이미지"
      />
      <ImageUpload
        value={heroImageUrl}
        onChange={setHeroImageUrl}
        bucket="education"
        label="상세 Hero 이미지"
      />

      <CheckboxListField
        label="담당 강사"
        options={experts.map((e) => ({ value: e.id, label: e.name }))}
        values={instructorIds}
        onChange={setInstructorIds}
        emptyLabel="등록된 강사가 없습니다. 강사진 메뉴에서 먼저 추가해 주세요."
      />

      <div className="flex flex-wrap items-center gap-6">
        <CheckboxField label="대표 프로그램" checked={isFeatured} onChange={setIsFeatured} />
        <CheckboxField label="상세 페이지 사용" checked={hasDetailPage} onChange={setHasDetailPage} />
        <CheckboxField label="공개 노출" checked={isPublished} onChange={setIsPublished} />
      </div>

      <details className="rounded-2xl border border-ink/10 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink/70">
          SEO (상세 페이지 확장 대비)
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <TextField label="SEO 제목" value={seoTitle} onChange={setSeoTitle} />
          <TextAreaField label="SEO 설명" value={seoDescription} onChange={setSeoDescription} rows={2} />
        </div>
      </details>

      <div className="flex items-center gap-3 border-t border-ink/10 pt-5">
        <button
          type="submit"
          disabled={!canSave}
          className="inline-flex min-h-11 items-center rounded-full bg-brand-blue px-6 font-semibold text-white transition-colors hover:bg-brand-navy disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <Link
          href="/admin/content/education/programs"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
