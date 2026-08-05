"use client";

import { type EduTrack, eduTrackLabel } from "@/lib/education-content";
import { cn } from "@/lib/utils";

export type TrackFilterValue = EduTrack | "all";

const OPTIONS: { id: TrackFilterValue; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "beginner", label: eduTrackLabel.beginner },
  { id: "practical", label: eduTrackLabel.practical },
];

/** 필터 칩. 탭 타겟 44px 이상, `aria-pressed`로 선택 상태를 알린다(§접근성). */
export function TrackFilter({
  value,
  onChange,
}: {
  value: TrackFilterValue;
  onChange: (value: TrackFilterValue) => void;
}) {
  return (
    <div role="group" aria-label="트랙 필터" className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors outline-none",
              "focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected
                ? "bg-ink text-ivory"
                : "border border-ink/15 text-ink/70 hover:border-ink/40 hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
