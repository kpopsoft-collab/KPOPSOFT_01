"use client";

/**
 * Company Numbers (docs/기획서.md §13, docs/디자인.md §10 MOTION: "number
 * counting" is an explicitly encouraged effect).
 *
 * Four stats laid out as a flat, editorial data row — large numerals carry
 * the accent color (60/25/15 budget: neutral ivory background, accent on
 * numerals only). Numbers count up from 0 once the
 * section scrolls into view. The initial render always shows the final
 * value so the section is correct with JavaScript disabled or before the
 * observer fires; the count-up is a progressive-enhancement layer on top.
 */
import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { accentText, sectionId, stats, type Accent } from "@/lib/site";
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
    <div className="flex flex-col items-start gap-4 border-t border-ink/10 pt-6 md:pt-8">
      {/* Sized to fit its grid column (2-col mobile / 4-col desktop) so the
          numeral + suffix never collide with the neighbouring stat. */}
      <p
        className={cn(
          "text-4xl font-extrabold leading-none tracking-tight tabular-nums sm:text-5xl lg:text-6xl",
          accentText[accent],
        )}
      >
        {formatNumber(displayValue)}
        <span className="ml-0.5">{suffix}</span>
      </p>
      <p className="text-body-lg text-ink/70">{label}</p>
    </div>
  );
}

export function CompanyNumbers() {
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
    <Section id={sectionId.numbers} className="bg-ivory">
      <div ref={observedRef} className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-mint">숫자로 보는 KPOPSOFT</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          말보다 결과로
          <br />
          증명해 왔습니다.
        </h2>
      </div>

      <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 lg:mt-20 lg:grid-cols-4 lg:gap-x-8">
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
    </Section>
  );
}
