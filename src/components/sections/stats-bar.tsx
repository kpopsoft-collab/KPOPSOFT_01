"use client";

/**
 * 통계바 (docs/02-home/ §SECTION 04).
 *
 * ver2에서는 About Summary 안에 붙어 있었지만 ver3에서 **독립 블록**으로
 * 분리됐다. 배경색을 깔아 위아래 섹션과 시각적으로 끊는다.
 *
 * 위치는 Hero 바로 다음, What We Do 앞이다 — 무엇을 하는 회사인지 설명하기
 * 전에 얼마나 해 왔는지를 먼저 보여주기 위해서다. 헤더의 `ABOUT` 앵커도
 * 이 섹션이라, 첫 화면 가까이 있는 편이 링크 동작으로도 자연스럽다.
 *
 * ver2의 긴 About 섹션은 없애되 그 카피를 통째로 버리지는 않는다 — 통계 위
 * 짧은 리드로 압축해 남기고, 헤더 네비의 `ABOUT` 앵커(`#about`)도 이 섹션이
 * 이어받는다. 앵커를 지우면 헤더 링크가 갈 곳을 잃는다.
 *
 * 숫자는 스크롤 진입 시 카운트업하지만(docs/04-design-system/ §10), 최종값을 먼저
 * 렌더한 뒤 애니메이션한다 — observer가 안 돌거나 JS가 없어도 값은 정확하다.
 * `prefers-reduced-motion`이면 카운트업을 건너뛴다.
 */
import { useEffect, useRef, useState } from "react";

import { Section } from "@/components/layout/section";
import { sectionId, statsFootnote } from "@/lib/site";
import type { PublicStat } from "@/lib/public-content";

const formatNumber = (n: number) => Math.round(n).toLocaleString("ko-KR");

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (!active) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const duration = 1000;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    let frame: number;
    let startTime: number | undefined;

    const tick = (now: number) => {
      startTime ??= now;
      const progress = Math.min((now - startTime) / duration, 1);
      setValue(easeOutCubic(progress) * target);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return value;
}

function Stat({
  value,
  suffix,
  label,
  active,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
}) {
  const displayValue = useCountUp(value, active);

  return (
    <div className="flex flex-col gap-2">
      <dd className="order-1 text-4xl leading-none font-black tracking-tight text-ivory tabular-nums md:text-5xl">
        {formatNumber(displayValue)}
        <span className="ml-0.5">{suffix}</span>
      </dd>
      {/* 요청서 §5: 수치와 항목명이 명확히 구분되게 둔다. 굵기·크기 차이만으로는
          약해서, 항목명 위에 짧은 구분선을 얹고 밝기를 올렸다. */}
      <dt className="order-2 border-t border-ivory/25 pt-3 text-base font-semibold text-ivory/85">
        {label}
      </dt>
    </div>
  );
}

export function StatsBar({ stats }: { stats: PublicStat[] }) {
  const [active, setActive] = useState(false);
  const observedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = observedRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (stats.length === 0) return null;

  return (
    <Section id={sectionId.numbers} className="bg-brand-navy py-16 md:py-20">
      <div ref={observedRef}>
        {/*
          리드는 한 줄로 끝낸다. 이 섹션의 근거는 아래 숫자이지 문장이 아니다.
          이전 카피("문제를 먼저 이해하고 실제로 사용할 수 있는…")는 어느 회사나
          할 수 있는 말이라 바로 아래 구체적인 수치의 힘을 오히려 깎았다.

          `<h2>`로 두는 이유 — 헤더 `ABOUT` 앵커가 이 섹션이라, 제목이 없으면
          건너뛴 사람에게 섹션의 정체가 전달되지 않는다.
        */}
        <h2 className="text-2xl leading-tight font-extrabold tracking-tight text-ivory md:text-3xl">
          성과로 증명한 KPOPSOFT
        </h2>

        <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {stats.map((stat) => (
            <Stat
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              active={active}
            />
          ))}
        </dl>

        {/* 각주가 지나치게 작거나 흐리지 않게 (요청서 §5). ivory/45는 네이비
            위에서 대비가 부족해 읽히지 않았다. */}
        <p className="mt-10 text-sm text-ivory/70 md:text-base">
          {statsFootnote}
        </p>
      </div>
    </Section>
  );
}
