"use client";

import { useEffect, useRef, useState } from "react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { eduSectionId, eduStats } from "@/lib/education-content";
import { cn } from "@/lib/utils";

/**
 * 교육 성과 (수정 요청서 §6).
 *
 * Count-up은 **섹션에 처음 들어올 때 한 번만** 재생한다(§6 "반복 Count-up
 * 금지"). 스크롤을 오르내릴 때마다 숫자가 다시 0에서 올라가면 읽으려던
 * 값을 매번 놓치고, 페이지가 계속 움직이는 인상만 남는다. 그래서 재생 후
 * observer를 끊는다.
 *
 * 모션 감소를 선호하면 애니메이션 없이 최종 수치만 표시한다(§6).
 *
 * 숫자 형식(`1,800+`, `96%`, `4`)은 데이터가 문자열로 갖고 있다. 접두·접미
 * 기호를 코드가 다시 조립하지 않고 **숫자 부분만 뽑아 세는** 이유 — 형식을
 * 코드로 옮기면 나중에 `120+`가 `120건`이 될 때 컴포넌트를 고쳐야 한다.
 */

/** Count-up 재생 시간(ms). */
const COUNT_MS = 900;
/** 항목별 시작 지연(ms) — §6의 0.1초 간격. */
const STAGGER_MS = 100;

export function EduStats() {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setStarted(true);
        observer.disconnect(); // 최초 1회만(§6).
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (eduStats.length === 0) return null;

  return (
    <Section id={eduSectionId.stats} className="bg-brand-navy py-16 md:py-20">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-mint" className="text-ivory/60">
          교육 성과
        </Eyebrow>
        <h2 className="mt-5 text-3xl leading-tight font-black tracking-tight text-ivory md:text-4xl">
          성과로 확인하는 KPOPSOFT 교육
        </h2>
      </div>

      <dl
        ref={ref}
        className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4"
      >
        {eduStats.map((stat, index) => (
          <div key={stat.label} className="flex flex-col gap-2">
            <dt className="order-2 text-sm font-medium text-ivory/70 md:text-base">
              {stat.label}
            </dt>
            <dd className="order-1 text-4xl leading-none font-black tracking-tight text-ivory tabular-nums md:text-5xl">
              <CountUp value={stat.value} started={started} index={index} />
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-10 text-sm text-ivory/50">2026년 7월 기준 누적 실적</p>
    </Section>
  );
}

/**
 * `1,800+` 같은 표기에서 숫자만 세고 나머지 글자는 그대로 둔다.
 * 자릿수가 변하며 폭이 흔들리지 않도록 `tabular-nums`를 부모에 걸어 뒀다.
 */
function CountUp({
  value,
  started,
  index,
}: {
  value: string;
  started: boolean;
  index: number;
}) {
  const match = value.match(/[\d,]+/);
  const target = match ? Number(match[0].replace(/,/g, "")) : null;

  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    if (!started || target === null) return;

    let frame = 0;

    // 모션 감소 설정에서는 최종 수치만 보여준다(§6). 상태 반영을 한 프레임
    // 미루는 건 렌더 도중 동기 setState를 피하기 위한 것이다.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(() => setCurrent(target));
      return () => cancelAnimationFrame(frame);
    }

    let start: number | null = null;
    const delay = index * STAGGER_MS;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start - delay;

      if (elapsed < 0) {
        frame = requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min(elapsed / COUNT_MS, 1);
      // ease-out — 끝에서 부드럽게 멈춰야 최종 숫자가 읽힌다.
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));

      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, target, index]);

  // 숫자를 못 찾았거나 아직 시작 전이면 원본 문자열을 그대로 보여준다 —
  // JS가 실패해도 최종 수치가 화면에 남는다.
  if (target === null || current === null) {
    return <span className={cn(started && "transition-opacity")}>{value}</span>;
  }

  return <span>{value.replace(/[\d,]+/, current.toLocaleString())}</span>;
}
