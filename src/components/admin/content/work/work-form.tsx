"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import type { Accent } from "@/lib/site";
import type { WorkItem } from "@/lib/admin/content-types";
import {
  TextField,
  TextAreaField,
  CheckboxField,
  StringListField,
} from "@/components/admin/content/fields";
import { AccentPicker } from "@/components/admin/content/accent-picker";
import { ImageUpload } from "@/components/admin/content/image-upload";
import { GalleryField } from "@/components/admin/content/work/gallery-field";

type WorkInput = Omit<WorkItem, "id" | "sortOrder">;



export function WorkForm({
  initial,
  onSave,
}: {
  initial?: WorkItem;
  onSave: (input: WorkInput) => Promise<void>;
}) {
  const [client, setClient] = useState(initial?.client ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [accent, setAccent] = useState<Accent>(initial?.accent ?? "blue");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [challenge, setChallenge] = useState(initial?.challenge ?? "");
  const [solution, setSolution] = useState(initial?.solution ?? "");
  const [results, setResults] = useState<string[]>(initial?.results ?? []);
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl);
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.imageUrls ?? []);
  const [scope, setScope] = useState<string[]>(initial?.scope ?? []);
  const [features, setFeatures] = useState<string[]>(initial?.features ?? []);
  const [userFlow, setUserFlow] = useState(initial?.userFlow ?? "");
  const [externalUrl, setExternalUrl] = useState(initial?.externalUrl ?? "");
  const [showOnHome, setShowOnHome] = useState(initial?.showOnHome ?? true);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = client.trim() && title.trim() && !pending;

  const submit = () =>
    start(() =>
      onSave({
        client: client.trim(),
        title: title.trim(),
        category: category.trim(),
        accent,
        summary: summary.trim(),
        challenge: challenge.trim(),
        solution: solution.trim(),
        results: results.map((r) => r.trim()).filter(Boolean),
        imageUrl,
        imageUrls,
        scope: scope.map((s) => s.trim()).filter(Boolean),
        features: features.map((f) => f.trim()).filter(Boolean),
        userFlow: userFlow.trim(),
        externalUrl: externalUrl.trim(),
        showOnHome,
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
        <TextField label="클라이언트" value={client} onChange={setClient} required placeholder="커머스 스타트업" />
        <TextField label="카테고리" value={category} onChange={setCategory} placeholder="Internal Tools · AI Automation" />
      </div>
      <TextField label="프로젝트명" value={title} onChange={setTitle} required placeholder="주문 운영 자동화 어드민" />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink/70">색상</span>
        <AccentPicker value={accent} onChange={setAccent} />
      </div>

      <ImageUpload
        value={imageUrl}
        onChange={setImageUrl}
        bucket="work"
        label="커버 이미지"
      />

      <GalleryField values={imageUrls} onChange={setImageUrls} />

      <TextAreaField label="요약" value={summary} onChange={setSummary} placeholder="프로젝트 한두 문장 요약" />
      <TextAreaField label="문제 (Challenge)" value={challenge} onChange={setChallenge} />
      <TextAreaField label="해결 (Solution)" value={solution} onChange={setSolution} />

      <StringListField
        label="성과 (Results)"
        values={results}
        onChange={setResults}
        placeholder="예) 주문 처리 시간 70% 단축"
        addLabel="성과 추가"
      />

      {/* 아래 넷은 상세 시트(사례 패널)에 나온다. 비워 두면 그 블록이 통째로
          빠지므로, 사례마다 있는 것만 채우면 된다. */}
      <StringListField
        label="작업 범위 (Scope)"
        values={scope}
        onChange={setScope}
        placeholder="예) 기획 · 화면 설계"
        addLabel="범위 추가"
      />

      <StringListField
        label="주요 기능 (Features)"
        values={features}
        onChange={setFeatures}
        placeholder="예) 업종별 추천 솔루션"
        addLabel="기능 추가"
      />

      <TextAreaField
        label="사용자 흐름"
        value={userFlow}
        onChange={setUserFlow}
        placeholder="방문 → 업종 선택 → 상담 신청"
      />

      <TextField
        label="사이트 주소"
        value={externalUrl}
        onChange={setExternalUrl}
        placeholder="https://... (있으면 '사이트 방문하기' 버튼이 생깁니다)"
      />

      <div className="flex flex-wrap items-center gap-6">
        {/* 끄면 홈 포트폴리오에서 빠지고 `/work` 목록에는 남는다. */}
        <CheckboxField label="홈 노출" checked={showOnHome} onChange={setShowOnHome} />
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
          href="/admin/content/work"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
