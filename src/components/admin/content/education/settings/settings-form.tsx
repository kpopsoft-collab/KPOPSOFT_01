"use client";

import { useState, useTransition } from "react";

import {
  EDUCATION_SECTION_KEYS,
  educationSectionLabel,
  type EducationPageSettings,
  type EducationSectionConfig,
  type EducationSectionKey,
} from "@/lib/admin/content-types";
import { TextField, TextAreaField, CheckboxField, NumberField } from "@/components/admin/content/fields";
import { ImageUpload } from "@/components/admin/content/image-upload";

/** Education Hero/CTA/섹션 노출 설정 (§27.1) — 싱글턴 폼. */
export function EducationSettingsForm({
  initial,
  onSave,
}: {
  initial: EducationPageSettings;
  onSave: (input: EducationPageSettings) => Promise<void>;
}) {
  const [heroEyebrow, setHeroEyebrow] = useState(initial.heroEyebrow);
  const [heroTitle, setHeroTitle] = useState(initial.heroTitle);
  const [heroDescription, setHeroDescription] = useState(initial.heroDescription);
  const [heroImageUrl, setHeroImageUrl] = useState<string | undefined>(initial.heroImageUrl);
  const [heroCtaPrimaryLabel, setHeroCtaPrimaryLabel] = useState(initial.heroCtaPrimaryLabel);
  const [heroCtaPrimaryHref, setHeroCtaPrimaryHref] = useState(initial.heroCtaPrimaryHref);
  const [heroCtaSecondaryLabel, setHeroCtaSecondaryLabel] = useState(
    initial.heroCtaSecondaryLabel,
  );
  const [heroCtaSecondaryHref, setHeroCtaSecondaryHref] = useState(
    initial.heroCtaSecondaryHref,
  );
  const [vibedaysTitle, setVibedaysTitle] = useState(initial.vibedaysTitle);
  const [vibedaysDescription, setVibedaysDescription] = useState(initial.vibedaysDescription);
  const [sections, setSections] = useState<
    Partial<Record<EducationSectionKey, EducationSectionConfig>>
  >(initial.sections);
  const [pending, start] = useTransition();

  const sectionConfig = (key: EducationSectionKey): EducationSectionConfig =>
    sections[key] ?? { isPublished: true, order: EDUCATION_SECTION_KEYS.indexOf(key) };

  const patchSection = (key: EducationSectionKey, patch: Partial<EducationSectionConfig>) =>
    setSections((prev) => ({ ...prev, [key]: { ...sectionConfig(key), ...patch } }));

  const submit = () =>
    start(() =>
      onSave({
        heroEyebrow: heroEyebrow.trim(),
        heroTitle,
        heroDescription,
        heroImageUrl,
        heroCtaPrimaryLabel: heroCtaPrimaryLabel.trim(),
        heroCtaPrimaryHref: heroCtaPrimaryHref.trim(),
        heroCtaSecondaryLabel: heroCtaSecondaryLabel.trim(),
        heroCtaSecondaryHref: heroCtaSecondaryHref.trim(),
        vibedaysTitle,
        vibedaysDescription,
        sections,
      }),
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex max-w-3xl flex-col gap-10"
    >
      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-extrabold text-ink">Hero</h2>
        <TextField label="Eyebrow" value={heroEyebrow} onChange={setHeroEyebrow} placeholder="KPOPSOFT EDUCATION" />
        <TextAreaField label="Title" value={heroTitle} onChange={setHeroTitle} rows={2} />
        <TextAreaField label="Description" value={heroDescription} onChange={setHeroDescription} rows={3} />
        <ImageUpload value={heroImageUrl} onChange={setHeroImageUrl} bucket="education" label="Hero 이미지" />
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField label="Primary CTA 문구" value={heroCtaPrimaryLabel} onChange={setHeroCtaPrimaryLabel} placeholder="교육 프로그램 보기" />
          <TextField label="Primary CTA 링크" value={heroCtaPrimaryHref} onChange={setHeroCtaPrimaryHref} placeholder="#programs" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField label="Secondary CTA 문구" value={heroCtaSecondaryLabel} onChange={setHeroCtaSecondaryLabel} placeholder="기업 교육 상담" />
          <TextField label="Secondary CTA 링크" value={heroCtaSecondaryHref} onChange={setHeroCtaSecondaryHref} placeholder="#contact-form" />
        </div>
      </section>

      <section className="flex flex-col gap-6 border-t border-ink/10 pt-8">
        <h2 className="text-lg font-extrabold text-ink">VIBEDAYS CLUB 소개</h2>
        <TextAreaField label="섹션 제목" value={vibedaysTitle} onChange={setVibedaysTitle} rows={2} />
        <TextAreaField label="소개 문구" value={vibedaysDescription} onChange={setVibedaysDescription} rows={4} />
      </section>

      <section className="flex flex-col gap-4 border-t border-ink/10 pt-8">
        <div>
          <h2 className="text-lg font-extrabold text-ink">섹션 공개 여부 · 노출 순서</h2>
          <p className="mt-1 text-sm text-ink/55">
            콘텐츠가 충분하지 않은 섹션(예: 교육 사례, 후기)은 숨길 수 있습니다.
          </p>
        </div>
        <ul className="flex flex-col gap-2">
          {EDUCATION_SECTION_KEYS.map((key) => {
            const cfg = sectionConfig(key);
            return (
              <li
                key={key}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                  {educationSectionLabel[key]}
                </span>
                <div className="w-24">
                  <NumberField
                    label="순서"
                    value={cfg.order}
                    onChange={(v) => patchSection(key, { order: v })}
                  />
                </div>
                <CheckboxField
                  label="공개"
                  checked={cfg.isPublished}
                  onChange={(v) => patchSection(key, { isPublished: v })}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex items-center gap-3 border-t border-ink/10 pt-5">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-full bg-brand-blue px-6 font-semibold text-white transition-colors hover:bg-brand-navy disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
