import Link from "next/link";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { TagList } from "@/components/ui/tag";
import { Circle, Star, Wave } from "@/components/shapes";
import {
  accentBg,
  accentOnDark,
  accentText,
  businesses,
  sectionId,
} from "@/lib/site";
import { cn } from "@/lib/utils";

/** 각 카드를 클릭하면 해당 상세 섹션으로 스크롤 이동한다(같은 hover/focus 어포던스). */
const cardInteraction =
  "group transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

/**
 * Business Overview (docs/기획서.md §6, docs/디자인.md §4/§6/§8).
 *
 * Deliberately not a 3-up rectangular card grid (§8 warns against every
 * section looking the same): 01 SOFTWARE is a wide, full-accent feature
 * panel; 02 AI SOLUTIONS is a narrower neutral card beside it; 03 EDUCATION
 * breaks the pattern again as a full-width horizontal band. Each block
 * carries its own large index numeral as a graphic element and its own
 * shape from the brand vocabulary, so category is legible from shape +
 * title, not color alone (§12 accessibility).
 */
export function BusinessOverview() {
  const [software, aiSolutions, education] = businesses;

  return (
    <Section id={sectionId.business} className="relative overflow-hidden">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-red">핵심 사업</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          필요한 기술에 따라
          <br />
          시작점도 달라집니다.
        </h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 lg:mt-20 lg:grid-cols-12">
        {/* 01 SOFTWARE — featured block, the only full-saturation surface. */}
        <Link
          href={`#${sectionId.software}`}
          aria-label={`${software.title} 섹션으로 이동`}
          className={cn(
            "relative flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-3xl p-8 md:p-12 lg:col-span-7",
            cardInteraction,
            accentBg[software.accent],
            accentOnDark[software.accent] ? "text-ivory" : "text-ink",
          )}
        >
          <Circle className="pointer-events-none absolute -bottom-20 -left-14 size-56 opacity-10" />

          <div className="relative flex items-start justify-between gap-6">
            <span className="text-display leading-none opacity-35" aria-hidden>
              {software.index}
            </span>
            <Circle className="size-10 shrink-0 opacity-90" />
          </div>

          <div className="relative mt-10 max-w-md">
            <h3 className="text-2xl font-extrabold tracking-tight md:text-4xl">
              {software.title}
            </h3>
            <p
              className={cn(
                "mt-4 text-body-lg",
                accentOnDark[software.accent] ? "text-ivory/80" : "text-ink/70",
              )}
            >
              {software.summary}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {software.items.map((item) => (
                <li
                  key={item}
                  className={cn(
                    "rounded-full border px-3 py-2 text-[0.8125rem] leading-none font-medium",
                    accentOnDark[software.accent]
                      ? "border-ivory/40 text-ivory/90"
                      : "border-ink/25 text-ink/80",
                  )}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Link>

        {/* 02 AI SOLUTIONS — neutral surface, accent lives in text + shape only. */}
        <Link
          href={`#${sectionId.aiSolutions}`}
          aria-label={`${aiSolutions.title} 섹션으로 이동`}
          className={cn(
            "relative flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-3xl bg-white p-8 md:p-12 lg:col-span-5",
            cardInteraction,
          )}
        >
          <div className="flex items-start justify-between gap-6">
            <span
              className={cn("text-display leading-none", accentText[aiSolutions.accent])}
              aria-hidden
            >
              {aiSolutions.index}
            </span>
            <Star className={cn("size-10 shrink-0", accentText[aiSolutions.accent])} />
          </div>

          <div className="mt-10">
            <h3
              className={cn(
                "text-2xl font-extrabold tracking-tight md:text-4xl",
                accentText[aiSolutions.accent],
              )}
            >
              {aiSolutions.title}
            </h3>
            <p className="mt-4 text-body-lg text-ink/70">{aiSolutions.summary}</p>
            <TagList tags={[...aiSolutions.items]} className="mt-6" />
          </div>
        </Link>

        {/* 03 EDUCATION — breaks the pattern again: a full-width horizontal band. */}
        <Link
          href={`#${sectionId.education}`}
          aria-label={`${education.title} 섹션으로 이동`}
          className={cn(
            "relative flex flex-col gap-8 overflow-hidden rounded-3xl bg-white p-8 md:flex-row md:items-center md:gap-12 md:p-12 lg:col-span-12",
            cardInteraction,
          )}
        >
          <div className="flex shrink-0 items-center gap-6 md:flex-col md:items-start md:gap-4">
            <span
              className={cn("text-display leading-none", accentText[education.accent])}
              aria-hidden
            >
              {education.index}
            </span>
            <Wave className={cn("w-24 md:w-28", accentText[education.accent])} />
          </div>

          <div className="h-px w-full shrink-0 bg-ink/10 md:h-24 md:w-px" />

          <div className="flex-1">
            <h3
              className={cn(
                "text-2xl font-extrabold tracking-tight md:text-4xl",
                accentText[education.accent],
              )}
            >
              {education.title}
            </h3>
            <p className="mt-4 max-w-2xl text-body-lg text-ink/70">
              {education.summary}
            </p>
            <TagList tags={[...education.items]} className="mt-6" />
          </div>
        </Link>
      </div>
    </Section>
  );
}
