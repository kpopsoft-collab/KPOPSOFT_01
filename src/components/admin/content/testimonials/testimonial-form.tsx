"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import type {
  EducationPastProgram,
  EducationRegularClass,
  Testimonial,
} from "@/lib/admin/content-types";
import {
  TextField,
  TextAreaField,
  CheckboxField,
} from "@/components/admin/content/fields";
import { ImageUpload } from "@/components/admin/content/image-upload";

type TestimonialInput = Omit<Testimonial, "id" | "sortOrder">;

const selectClass =
  "h-12 w-full rounded-2xl border border-ink/15 bg-ivory/60 px-4 text-base font-medium text-ink outline-none transition-colors focus:border-brand-blue focus:bg-white";

export function TestimonialForm({
  initial,
  programs,
  cases,
  onSave,
}: {
  initial?: Testimonial;
  /** Education §28 — 관계형 연결 옵션. 빈 배열이면 선택지가 없을 뿐 폼은 정상 동작. */
  /** 관련 정규 클래스 — DB FK가 education_regular_classes를 가리킨다. */
  programs?: EducationRegularClass[];
  /** 관련 지난 프로그램 — DB FK가 education_past_programs를 가리킨다. */
  cases?: EducationPastProgram[];
  onSave: (input: TestimonialInput) => Promise<void>;
}) {
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [program, setProgram] = useState(initial?.program ?? "");
  const [result, setResult] = useState(initial?.result ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl);
  const [showOnEducation, setShowOnEducation] = useState(initial?.showOnEducation ?? false);
  const [programId, setProgramId] = useState(initial?.programId ?? "");
  const [caseId, setCaseId] = useState(initial?.caseId ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = quote.trim() && author.trim() && !pending;

  const submit = () =>
    start(() =>
      onSave({
        quote: quote.trim(),
        author: author.trim(),
        program: program.trim(),
        result: result.trim(),
        company: company.trim(),
        role: role.trim(),
        imageUrl,
        showOnEducation,
        programId: programId || undefined,
        caseId: caseId || undefined,
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
      <TextAreaField label="후기 내용" value={quote} onChange={setQuote} placeholder="고객 후기 한 문장" />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="작성자 또는 익명명" value={author} onChange={setAuthor} required placeholder="제조업 · 운영팀" />
        <TextField label="프로그램 (텍스트 라벨)" value={program} onChange={setProgram} placeholder="기업 맞춤형 교육" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="회사 또는 산업군" value={company} onChange={setCompany} placeholder="제조업" />
        <TextField label="참여자 역할" value={role} onChange={setRole} placeholder="운영팀" />
      </div>
      <TextField label="주요 성과" value={result} onChange={setResult} placeholder="반복 업무 40% 감소" />

      <ImageUpload
        value={imageUrl}
        onChange={setImageUrl}
        bucket="education"
        label="선택적 이미지 / 결과물 썸네일"
      />

      {(programs?.length ?? 0) > 0 || (cases?.length ?? 0) > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-ink/70">
            관련 프로그램 (관계형 연결)
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className={selectClass}
            >
              <option value="">연결 안 함</option>
              {(programs ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-ink/70">
            관련 지난 프로그램
            <select
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className={selectClass}
            >
              <option value="">연결 안 함</option>
              {(cases ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-6">
        <CheckboxField
          label="Education 페이지 노출"
          checked={showOnEducation}
          onChange={setShowOnEducation}
        />
        <CheckboxField label="공개 노출" checked={isPublished} onChange={setIsPublished} />
      </div>

      <div className="flex items-center gap-3 border-t border-ink/10 pt-5">
        <button
          type="submit"
          disabled={!canSave}
          className="inline-flex min-h-11 items-center rounded-full bg-brand-blue px-6 font-semibold text-white transition-colors hover:bg-brand-navy disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <Link
          href="/admin/content/testimonials"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
