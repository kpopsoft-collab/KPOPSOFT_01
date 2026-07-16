"use client";

/**
 * About Summary + Numbers (docs/KPOPSOFT_Home_Landing_ver2.md §SECTION 03).
 *
 * ver2 explicitly asks for a short trust block compressed into ~50–70vh, not
 * two stacked sections — so copy and the four stats share one `Section` and
 * sit side-by-side on desktop (text left, numbers right) instead of the
 * previous full-height CompanyIntroduction → CompanyNumbers sequence. Numbers
 * still count up on scroll-into-view (docs/디자인.md §10 encourages "number
 * counting"), but the section renders final values immediately so it's
 * correct before the observer fires or with JS disabled.
 */
import { useEffect, useRef, useState } from "react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Arch, Circle, Star, Wave } from "@/components/shapes";
import { accentText, sectionId, statsFootnote, type Accent } from "@/lib/site";
import type { PublicStat } from "@/lib/public-content";
import { cn } from "@/lib/utils";

const accents: Accent[] = ["blue", "red", "yellow", "mint"];

const formatNumber = (n: number) => Math.round(n).toLocaleString("ko-KR");

/** Counts from 0 to `target` over ~1s ease-out once `active` becomes true. */
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
  accent,
  active,
}: {
  value: number;
  suffix: string;
  label: string;
  accent: Accent;
  active: boolean;
}) {
  const displayValue = useCountUp(value, active);

  return (
    <div className="flex flex-col items-start gap-2 border-t border-ink/10 pt-4">
      <p
        className={cn(
          "text-3xl leading-none font-extrabold tracking-tight tabular-nums sm:text-4xl",
          accentText[accent],
        )}
      >
        {formatNumber(displayValue)}
        <span className="ml-0.5">{suffix}</span>
      </p>
      <p className="text-sm text-ink/60">{label}</p>
    </div>
  );
}

export function AboutSummary({ stats }: { stats: PublicStat[] }) {
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

  return (
    <Section id={sectionId.about} className="relative overflow-hidden">
      <Arch
        className="pointer-events-none absolute bottom-0 left-0 -z-10 hidden size-32 text-brand-yellow/80 lg:block xl:size-40"
        aria-hidden
      />

      <div
        ref={observedRef}
        className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-8"
      >
        {/* Copy block */}
        <div className="lg:col-span-7">
          <Eyebrow>ABOUT</Eyebrow>
          <h2 className="text-section mt-6 max-w-[18ch] text-ink">
            답답했던 문제에,
            <br />
            필요한 기술로 답합니다.
          </h2>

          <div className="mt-6 flex items-center gap-4">
            <Circle className="size-5 text-brand-blue" aria-hidden />
            <Star className="size-6 text-brand-red" aria-hidden />
            <Wave className="h-5 w-16 text-brand-mint" aria-hidden />
          </div>

          <div className="mt-6 max-w-[52ch] space-y-4 text-body-lg text-ink/70">
            <p>
              KPOPSOFT는 화려해 보이지만 실제 도움이 되지 않는 기술을 권하지
              않습니다.
            </p>
            <p>
              고객이 해결하려는 문제와 기대하는 결과를 먼저 이해하고, 실제로
              사용할 수 있는 소프트웨어와 AI 솔루션을 만듭니다.
            </p>
          </div>
        </div>

        {/* Numbers */}
        <div className="lg:col-span-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8">
            {stats.map((stat, index) => (
              <Stat
                key={stat.label}
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
                accent={accents[index % accents.length]}
                active={active}
              />
            ))}
          </div>
          <p className="mt-6 text-sm text-ink/45">{statsFootnote}</p>
        </div>
      </div>
    </Section>
  );
}
