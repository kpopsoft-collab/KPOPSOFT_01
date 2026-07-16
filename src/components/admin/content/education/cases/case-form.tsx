"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import {
  EDUCATION_FORMATS,
  educationFormatLabel,
  type EducationCase,
  type EducationFormat,
} from "@/lib/admin/content-types";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/content/fields";
import { ImageUpload } from "@/components/admin/content/image-upload";

type CaseInput = Omit<EducationCase, "id" | "sortOrder">;

const selectClass =
  "h-12 w-full rounded-2xl border border-ink/15 bg-ivory/60 px-4 text-base font-medium text-ink outline-none transition-colors focus:border-brand-blue focus:bg-white";

export function CaseForm({
  initial,
  onSave,
}: {
  initial?: EducationCase;
  onSave: (input: CaseInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [targetAudience, setTargetAudience] = useState(initial?.targetAudience ?? "");
  const [participantCount, setParticipantCount] = useState(initial?.participantCount ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [format, setFormat] = useState<EducationFormat | "">(initial?.format ?? "");
  const [goal, setGoal] = useState(initial?.goal ?? "");
  const [mainTask, setMainTask] = useState(initial?.mainTask ?? "");
  const [outputs, setOutputs] = useState(initial?.outputs ?? "");
  const [outcome, setOutcome] = useState(initial?.outcome ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(
    initial?.coverImageUrl,
  );
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = title.trim() && !pending;

  const submit = () =>
    start(() =>
      onSave({
        title: title.trim(),
        industry: industry.trim(),
        companyName: companyName.trim(),
        targetAudience: targetAudience.trim(),
        participantCount: participantCount.trim(),
        duration: duration.trim(),
        format: format || undefined,
        goal: goal.trim(),
        mainTask: mainTask.trim(),
        outputs: outputs.trim(),
        outcome: outcome.trim(),
        coverImageUrl,
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
      <TextField label="사례명" value={title} onChange={setTitle} required placeholder="제조기업 AI 업무 자동화 워크숍" />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="산업군" value={industry} onChange={setIndustry} placeholder="제조업" />
        <TextField label="기업명 또는 익명명" value={companyName} onChange={setCompanyName} placeholder="A社 (비공개)" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="교육 대상" value={targetAudience} onChange={setTargetAudience} placeholder="운영 및 관리 실무자" />
        <TextField label="참여 인원" value={participantCount} onChange={setParticipantCount} placeholder="30명" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="진행 기간 / 형태" value={duration} onChange={setDuration} placeholder="6시간 실습형 워크숍" />
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

      <TextAreaField label="교육 목표" value={goal} onChange={setGoal} rows={2} />
      <TextAreaField label="주요 과제" value={mainTask} onChange={setMainTask} rows={2} />
      <TextAreaField label="결과물" value={outputs} onChange={setOutputs} rows={2} />
      <TextAreaField label="성과" value={outcome} onChange={setOutcome} rows={2} />

      <ImageUpload
        value={coverImageUrl}
        onChange={setCoverImageUrl}
        bucket="education"
        label="대표 이미지"
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
          href="/admin/content/education/cases"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
