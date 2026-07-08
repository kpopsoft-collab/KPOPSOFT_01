"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import type { InquirySubtypeOption } from "@/lib/admin/inquiry-options";
import {
  addSubtype,
  updateSubtype,
  deleteSubtype,
} from "@/app/admin/(shell)/content/inquiry-options/actions";

const inputClass =
  "w-full rounded-2xl border border-ink/15 bg-ivory/60 px-4 py-2.5 text-base font-medium text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-brand-blue focus:bg-white";

function SubtypeRow({
  typeId,
  subtype,
}: {
  typeId: string;
  subtype: InquirySubtypeOption;
}) {
  const router = useRouter();
  const [label, setLabel] = useState(subtype.label);
  const [placeholder, setPlaceholder] = useState(subtype.placeholder);
  const [pending, start] = useTransition();

  const dirty = label !== subtype.label || placeholder !== subtype.placeholder;

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border p-4",
        !subtype.isActive && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="세부 유형 이름"
          className={cn(inputClass, "flex-1 font-semibold")}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(() =>
              updateSubtype(typeId, subtype.id, { isActive: !subtype.isActive }),
            )
          }
          aria-pressed={subtype.isActive}
          className={cn(
            "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors disabled:opacity-50",
            subtype.isActive ? "bg-brand-mint/20 text-ink" : "bg-ink/5 text-ink/45",
          )}
        >
          {subtype.isActive ? (
            <Eye className="size-3.5" aria-hidden />
          ) : (
            <EyeOff className="size-3.5" aria-hidden />
          )}
          {subtype.isActive ? "노출" : "숨김"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm(`세부 유형 '${subtype.label}'을(를) 삭제할까요?`)) return;
            run(() => deleteSubtype(typeId, subtype.id));
          }}
          aria-label="세부 유형 삭제"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-ink/15 text-ink/70 transition-colors hover:border-brand-red hover:text-brand-red disabled:opacity-50"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      <textarea
        value={placeholder}
        onChange={(e) => setPlaceholder(e.target.value)}
        rows={2}
        placeholder="문의 내용 입력칸 예시 문구"
        className={cn(inputClass, "resize-y leading-relaxed")}
      />

      {dirty && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(() => updateSubtype(typeId, subtype.id, { label, placeholder }))
          }
          className="w-fit rounded-full bg-brand-blue px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy disabled:opacity-50"
        >
          {pending ? "저장 중…" : "변경 저장"}
        </button>
      )}
    </div>
  );
}

export function SubtypeManager({
  typeId,
  subtypes,
}: {
  typeId: string;
  subtypes: InquirySubtypeOption[];
}) {
  const router = useRouter();
  const [newLabel, setNewLabel] = useState("");
  const [newPlaceholder, setNewPlaceholder] = useState("");
  const [pending, start] = useTransition();

  const add = () =>
    start(async () => {
      await addSubtype(typeId, {
        label: newLabel.trim(),
        placeholder: newPlaceholder.trim(),
      });
      setNewLabel("");
      setNewPlaceholder("");
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {subtypes.length === 0 && (
          <p className="rounded-2xl border border-dashed border-ink/15 p-6 text-center text-sm text-ink/45">
            세부 유형이 없습니다. 아래에서 추가하세요.
          </p>
        )}
        {subtypes.map((s) => (
          <SubtypeRow key={s.id} typeId={typeId} subtype={s} />
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-ink/20 bg-ivory/40 p-4">
        <p className="text-sm font-semibold text-ink/70">세부 유형 추가</p>
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="세부 유형 이름 (예: 웹 프로젝트)"
          className={cn(inputClass, "font-semibold")}
        />
        <textarea
          value={newPlaceholder}
          onChange={(e) => setNewPlaceholder(e.target.value)}
          rows={2}
          placeholder="문의 내용 입력칸 예시 문구"
          className={cn(inputClass, "resize-y leading-relaxed")}
        />
        <button
          type="button"
          disabled={!newLabel.trim() || pending}
          onClick={add}
          className="inline-flex w-fit min-h-9 items-center gap-1.5 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink/80 transition-colors hover:border-brand-blue hover:text-brand-blue disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden />
          추가
        </button>
      </div>
    </div>
  );
}
