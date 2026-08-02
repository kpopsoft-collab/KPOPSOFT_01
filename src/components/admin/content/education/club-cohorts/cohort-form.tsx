"use client";

import { useState, useTransition } from "react";

import {
  CLUB_COHORT_STATUSES,
  clubCohortStatusLabel,
  type ClubCohortStatus,
  type EducationClubCohort,
} from "@/lib/admin/content-types";
import {
  CheckboxField,
  SelectField,
  TextField,
} from "@/components/admin/content/fields";
import { FormActions } from "@/components/admin/content/education/form-actions";

type Input = Omit<EducationClubCohort, "id" | "sortOrder">;

export function CohortForm({
  initial,
  onSave,
}: {
  initial?: EducationClubCohort;
  onSave: (input: Input) => Promise<void>;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [status, setStatus] = useState<ClubCohortStatus>(initial?.status ?? "upcoming");
  const [recruitPeriod, setRecruitPeriod] = useState(initial?.recruitPeriod ?? "");
  const [runPeriod, setRunPeriod] = useState(initial?.runPeriod ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [listPrice, setListPrice] = useState(initial?.listPrice ?? "");
  const [capacity, setCapacity] = useState(initial?.capacity ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [ctaDisabled, setCtaDisabled] = useState(initial?.ctaDisabled ?? false);
  const [showPrice, setShowPrice] = useState(initial?.showPrice ?? true);
  const [showCapacity, setShowCapacity] = useState(initial?.showCapacity ?? false);
  const [showSchedule, setShowSchedule] = useState(initial?.showSchedule ?? true);
  const [showCta, setShowCta] = useState(initial?.showCta ?? true);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = Boolean(label.trim()) && !pending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        start(() =>
          onSave({
            label: label.trim(),
            status,
            recruitPeriod: recruitPeriod.trim(),
            runPeriod: runPeriod.trim(),
            price: price.trim(),
            listPrice: listPrice.trim(),
            capacity: capacity.trim(),
            note: note.trim(),
            ctaDisabled,
            showPrice,
            showCapacity,
            showSchedule,
            showCta,
            isPublished,
          }),
        );
      }}
      className="flex max-w-2xl flex-col gap-6"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="기수" value={label} onChange={setLabel} required placeholder="1기" />
        {/* 날짜로 자동 판단하지 않는다 — 조기 마감·연장 같은 운영 판단이 달력보다 우선한다. */}
        <SelectField
          label="모집 상태"
          value={status}
          onChange={setStatus}
          options={CLUB_COHORT_STATUSES.map((s) => ({ value: s, label: clubCohortStatusLabel[s] }))}
          hint="사이트 배지에 그대로 표시됩니다."
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          label="모집 기간"
          value={recruitPeriod}
          onChange={setRecruitPeriod}
          placeholder="2026년 8월"
        />
        <TextField
          label="운영 기간"
          value={runPeriod}
          onChange={setRunPeriod}
          placeholder="2026년 9월 ~ 12월 (4개월)"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="참가비" value={price} onChange={setPrice} placeholder="79,000원" />
        <TextField
          label="할인 전 정가"
          value={listPrice}
          onChange={setListPrice}
          placeholder="비우면 정가 없이 참가비만 표시"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="정원" value={capacity} onChange={setCapacity} />
        <TextField
          label="보충 문구"
          value={note}
          onChange={setNote}
          placeholder="마감·연기 사유 한 줄"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-ink/15 bg-ivory/60 p-4">
        <span className="text-sm font-semibold text-ink/70">카드에 표시할 항목</span>
        <div className="flex flex-wrap gap-6">
          <CheckboxField label="참가비" checked={showPrice} onChange={setShowPrice} />
          <CheckboxField label="정원" checked={showCapacity} onChange={setShowCapacity} />
          <CheckboxField label="일정" checked={showSchedule} onChange={setShowSchedule} />
          <CheckboxField label="신청 버튼" checked={showCta} onChange={setShowCta} />
        </div>
      </div>

      {/* 버튼을 없애는 것과 다르다 — 사라지면 "신청 자체가 없는 기수"로 읽힌다. */}
      <CheckboxField
        label="신청 버튼 비활성 (모집 상태여도 아직 신청을 받지 않음)"
        checked={ctaDisabled}
        onChange={setCtaDisabled}
      />
      <CheckboxField label="공개 노출" checked={isPublished} onChange={setIsPublished} />
      <FormActions
        pending={pending}
        canSave={canSave}
        backHref="/admin/content/education/club-cohorts"
      />
    </form>
  );
}
