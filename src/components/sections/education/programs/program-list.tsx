"use client";

import { useMemo, useState } from "react";

import { eduTrackLabel, type RegularClass } from "@/lib/education-content";

import { ProgramCard } from "./program-card";
import { TrackFilter, type TrackFilterValue } from "./track-filter";

/**
 * 트랙 필터 상태 + 카드 그리드 (요구사항 §2.2 / 계획 §3).
 *
 * `items`는 이미 공개(published) + sortOrder 순으로 온 목록이다 — 이 컴포넌트는
 * 필터링만 하고 순서를 바꾸지 않는다. 전체 0건(공개 과정 자체가 없음)은 이
 * 컴포넌트를 아예 렌더하지 않는 방식으로 페이지가 처리한다(§2.3) — 여기서
 * 다루는 0건은 "트랙을 골랐더니 해당 과정이 없는" 경우뿐이다.
 */
export function ProgramList({ items }: { items: RegularClass[] }) {
  const [track, setTrack] = useState<TrackFilterValue>("all");

  const shown = useMemo(
    () =>
      track === "all" ? items : items.filter((c) => c.tracks.includes(track)),
    [items, track],
  );

  return (
    <>
      <div className="mt-10">
        <TrackFilter value={track} onChange={setTrack} />
      </div>

      {shown.length === 0 ? (
        <div className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-ink/10 bg-white px-6 py-8 lg:mt-20">
          <p className="text-body-lg text-ink/70">
            {/* track이 "all"이면 items 자체가 비어야 하므로(전체 0건은 페이지가
                이 컴포넌트를 렌더하지 않고 걸러낸다) 이 분기는 실질적으로
                beginner/practical일 때만 온다. 타입은 좁혀지지 않으므로
                문구만 안전하게 분기해 둔다. */}
            {track === "all" ? "선택한" : eduTrackLabel[track]} 트랙에 해당하는
            과정이 아직 없습니다.
          </p>
          <button
            type="button"
            onClick={() => setTrack("all")}
            className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-ink/60 underline underline-offset-4 transition-colors outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-brand-blue/40"
          >
            전체 보기
          </button>
        </div>
      ) : (
        <ul className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
          {shown.map((item) => (
            <li key={item.slug} className="flex">
              <ProgramCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
