"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import type { Accent } from "@/lib/site";
import {
  PILLAR_KEYS,
  pillarKeyLabel,
  type HomePillarExample,
  type PillarKey,
} from "@/lib/admin/content-types";
import {
  CheckboxField,
  SelectField,
  StringListField,
  TextAreaField,
  TextField,
} from "@/components/admin/content/fields";
import { AccentPicker } from "@/components/admin/content/accent-picker";
import { ImageUpload } from "@/components/admin/content/image-upload";

type Input = Omit<HomePillarExample, "id" | "sortOrder">;

export function PillarExampleForm({
  initial,
  onSave,
}: {
  initial?: HomePillarExample;
  onSave: (input: Input) => Promise<void>;
}) {
  const [pillarKey, setPillarKey] = useState<PillarKey>(initial?.pillarKey ?? "software");
  const [key, setKey] = useState(initial?.key ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [client, setClient] = useState(initial?.client ?? "");
  const [headline, setHeadline] = useState(initial?.headline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [highlights, setHighlights] = useState<string[]>(initial?.highlights ?? []);
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl);
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt ?? "");
  const [accent, setAccent] = useState<Accent>(initial?.accent ?? "blue");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = Boolean(name.trim() && headline.trim()) && !pending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        start(() =>
          onSave({
            pillarKey,
            key: key.trim() || `${pillarKey}-${Date.now()}`,
            name: name.trim(),
            client: client.trim(),
            headline: headline.trim(),
            description: description.trim(),
            highlights: highlights.map((h) => h.trim()).filter(Boolean),
            ...(imageUrl ? { imageUrl } : {}),
            imageAlt: imageAlt.trim(),
            accent,
            isPublished,
          }),
        );
      }}
      className="flex max-w-2xl flex-col gap-6"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField
          label="소속 카드"
          value={pillarKey}
          onChange={setPillarKey}
          options={PILLAR_KEYS.map((k) => ({ value: k, label: pillarKeyLabel[k] }))}
          hint="Education 카드는 슬라이드 대신 교육 페이지로 이동합니다."
        />
        {/* 카드 하단 태그 문자열과 같게 유지한다 — 카드에서 본 단어와 모달
            제목이 다르면 같은 대상이라는 걸 알아채기 어렵다. */}
        <TextField label="유형명" value={name} onChange={setName} required placeholder="웹 서비스" />
      </div>

      <TextField label="헤드라인" value={headline} onChange={setHeadline} required />
      <TextAreaField label="설명" value={description} onChange={setDescription} rows={4} />

      <StringListField
        label="실제로 하는 일"
        values={highlights}
        onChange={setHighlights}
        placeholder="예) 기획 · 화면 설계 → 개발 → 배포까지 한 팀에서 진행"
        addLabel="항목 추가"
      />

      {/* 비우면 화면에 "예시"로 표기된다. 지어낸 레퍼런스를 만들지 않기 위해
          실제 사례일 때만 채운다. */}
      <TextField
        label="고객사명"
        value={client}
        onChange={setClient}
        placeholder="실제 사례일 때만 — 비우면 '예시'로 표기됩니다"
      />

      <ImageUpload value={imageUrl} onChange={setImageUrl} bucket="work" label="사례 이미지" />
      <TextField label="이미지 대체 텍스트" value={imageAlt} onChange={setImageAlt} />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink/70">강조 색상</span>
        <AccentPicker value={accent} onChange={setAccent} />
      </div>

      <TextField label="식별 키" value={key} onChange={setKey} placeholder="비우면 자동 생성" />
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
          href="/admin/content/pillar-examples"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
