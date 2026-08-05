import { Circle, Star } from "@/components/shapes";
import {
  formatClassSchedule,
  type RegularClassDetail,
} from "@/lib/education-content";
import { accentBg, accentOnDark } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * 상세 페이지 히어로 (요구사항 §3.2) — 순번·과정명·부제·설명 + 일정 한 줄,
 * accent 배경 도형.
 *
 * 목록 카드처럼 `accent` 컬럼을 그대로 카드/패널 배경에 쓴다(요구사항 §2.2와
 * 같은 원칙). 카드 여러 장이 아니라 패널 하나뿐이라 이번에는 원색을 그대로
 * 채워도 색끼리 부딪히지 않는다.
 *
 * ⚠️ 기간·난이도·트랙은 여기 없다 — `ProgramSummaryCard`가 갖고 있다
 * (백로그 06 03-화면구조-결정.md D5). 되돌려 여기에 다시 넣으면 같은 값이
 * 한 화면에 두 번 나온다.
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
    // breadcrumb이 바로 위에 붙으므로 위 여백은 예전(pt-16/24)보다 좁다.
    <section className="pt-5 pb-4 md:pt-7">
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
            {/*
              긴 설명(`description`)은 여기 없다 — 본문의 "이 과정은" 블록이
              갖고 있다. 둘 다 그리면 화면이 같은 문장을 두 번 말한다
              (실제로 그렇게 나왔던 것을 2026-08-05에 고쳤다).
              히어로는 짧은 부제 한 줄로 붙잡는 역할만 한다.
            */}
            <p className={cn("mt-3 text-lg font-semibold md:text-xl", onDark ? "text-ivory/85" : "text-ink/80")}>
              {item.subtitle}
            </p>
          </div>

          {/*
            일정은 히어로에서 **한 줄만** 남긴다 — 첫 화면에서 "언제 하는
            과정인가"는 스크롤 전에 보여야 하기 때문이다(02-조사 §2 Obstacles).
            기간·난이도·트랙까지 여기 늘어놓던 `dl`은 요약 카드로 옮겼다
            (백로그 06 D5). 같은 값을 두 곳에 그리면 화면이 두 번 같은 말을
            하고, 정작 스크롤 뒤에는 아무것도 안 보인다.
          */}
          {schedule ? (
            <p
              className={cn(
                "relative mt-8 border-t pt-6 text-base font-semibold",
                fgBorder,
                onDark ? "text-ivory/85" : "text-ink/75",
              )}
            >
              {schedule}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
