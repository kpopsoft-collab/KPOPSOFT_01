"use client";

import { useState, useTransition } from "react";

import type { Accent } from "@/lib/site";
import type { EducationClubTier } from "@/lib/admin/content-types";
import {
  CheckboxField,
  NumberField,
  StringListField,
  TextField,
} from "@/components/admin/content/fields";
import { AccentPicker } from "@/components/admin/content/accent-picker";
import { FormActions } from "@/components/admin/content/education/form-actions";

type Input = Omit<EducationClubTier, "id" | "sortOrder">;

export function TierForm({
  initial,
  onSave,
}: {
  initial?: EducationClubTier;
  onSave: (input: Input) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [points, setPoints] = useState<string[]>(initial?.points ?? []);
  const [accent, setAccent] = useState<Accent>(initial?.accent ?? "mint");
  const [characterSrc, setCharacterSrc] = useState(initial?.characterSrc ?? "");
  const [characterWidth, setCharacterWidth] = useState<number>(initial?.characterWidth ?? 0);
  const [characterHeight, setCharacterHeight] = useState<number>(initial?.characterHeight ?? 0);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [pending, start] = useTransition();

  const canSave = Boolean(name.trim()) && !pending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        start(() =>
          onSave({
            name: name.trim(),
            role: role.trim(),
            points,
            accent,
            characterSrc: characterSrc.trim(),
            characterWidth: Math.round(characterWidth) || 0,
            characterHeight: Math.round(characterHeight) || 0,
            isPublished,
          }),
        );
      }}
      className="flex max-w-2xl flex-col gap-6"
    >
      <TextField label="유형 이름" value={name} onChange={setName} required placeholder="바이브데이저" />
      <TextField label="한 줄 역할" value={role} onChange={setRole} placeholder="함께 배우는 사람" />
      <StringListField label="이런 분에게" values={points} onChange={setPoints} />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink/70">카드 색상</span>
        <AccentPicker value={accent} onChange={setAccent} />
        <span className="text-xs font-medium text-ink/45">
          캐릭터 색과 다른 색을 고르세요 — 같으면 캐릭터가 배경에 묻힙니다.
        </span>
      </div>
      <TextField
        label="캐릭터 이미지 경로"
        value={characterSrc}
        onChange={setCharacterSrc}
        placeholder="/assets/vibedays-role-master.svg"
      />
      {/* 원본 크기를 행마다 적는다 — 한 값으로 뭉뚱그리면 next/image가 잘못된
          비율로 자리를 잡아 캐릭터 옆에 빈 여백이 생긴다. */}
      <div className="grid gap-6 sm:grid-cols-2">
        <NumberField label="캐릭터 원본 가로(px)" value={characterWidth} onChange={setCharacterWidth} />
        <NumberField label="캐릭터 원본 세로(px)" value={characterHeight} onChange={setCharacterHeight} />
      </div>
      <CheckboxField label="공개 노출" checked={isPublished} onChange={setIsPublished} />
      <FormActions
        pending={pending}
        canSave={canSave}
        backHref="/admin/content/education/club-tiers"
      />
    </form>
  );
}
