import { Circle, Star } from "@/components/shapes";
import {
  eduTrackLabel,
  formatClassSchedule,
  type RegularClassDetail,
} from "@/lib/education-content";
import { accentBg, accentOnDark } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * 상세 페이지 히어로 (요구사항 §3.2) — 순번·과정명·부제·설명 +
 * 메타(기간/난이도/일정/트랙), accent 배경 도형.
 *
 * 목록 카드처럼 `accent` 컬럼을 그대로 카드/패널 배경에 쓴다(요구사항 §2.2와
 * 같은 원칙). 카드 여러 장이 아니라 패널 하나뿐이라 이번에는 원색을 그대로
 * 채워도 색끼리 부딪히지 않는다.
 */
export function ProgramDetailHero({ item }: { item: RegularClassDetail }) {
  // 일정 표기는 목록 카드·어드민과 같은 함수를 쓴다(release gate G5).
  // null이면 이 메타 항목 자체를 뺀다.
  const schedule = formatClassSchedule(item);
  const onDark = accentOnDark[item.accent];
  const fg = onDark ? "text-ivory" : "text-ink";
  const fgFaint = onDark ? "text-ivory/10" : "text-ink/10";
  const fgBorder = onDark ? "border-ivory/20" : "border-ink/15";

  return (
    <section className="pt-16 pb-4 md:pt-24">
      <div className="container-editorial">
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl p-8 md:p-14",
            accentBg[item.accent],
            fg,
          )}
        >
          <Circle
            aria-hidden
            className={cn(
              "pointer-events-none absolute -top-10 -right-10 size-32 md:size-44",
              fgFaint,
            )}
          />
          <Star
            aria-hidden
            className={cn(
              "pointer-events-none absolute -bottom-8 left-1/4 size-20 md:size-28",
              fgFaint,
            )}
          />

          <div className="relative max-w-3xl">
            <span className={cn("text-eyebrow", onDark ? "text-ivory/70" : "text-ink/60")}>
              {item.index} · 정규 클래스
            </span>
            <h1 className="text-section mt-4">{item.name}</h1>
            <p className={cn("mt-3 text-lg font-semibold md:text-xl", onDark ? "text-ivory/85" : "text-ink/80")}>
              {item.subtitle}
            </p>
            <p className={cn("mt-6 text-body-lg", onDark ? "text-ivory/80" : "text-ink/75")}>
              {item.description}
            </p>
          </div>

          <dl
            className={cn(
              "relative mt-10 flex flex-wrap gap-x-10 gap-y-5 border-t pt-8",
              fgBorder,
            )}
          >
            <MetaItem label="기간" value={item.duration} onDark={onDark} />
            <MetaItem label="난이도" value={item.level} onDark={onDark} />
            {/* 상시 모집 과정은 startDate/endDate가 없어 schedule이 null이다 —
                그 경우 이 항목 자체가 빠진다(release gate G5). */}
            {schedule ? (
              <MetaItem label="일정" value={schedule} onDark={onDark} />
            ) : null}
            <MetaItem
              label="트랙"
              value={item.tracks.map((track) => eduTrackLabel[track]).join(" · ")}
              onDark={onDark}
            />
          </dl>
        </div>
      </div>
    </section>
  );
}

function MetaItem({
  label,
  value,
  onDark,
}: {
  label: string;
  value: string;
  onDark: boolean;
}) {
  return (
    <div>
      <dt className={cn("text-eyebrow", onDark ? "text-ivory/60" : "text-ink/55")}>
        {label}
      </dt>
      <dd className="mt-1 text-base font-semibold">{value}</dd>
    </div>
  );
}
