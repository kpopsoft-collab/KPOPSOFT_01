import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Blocks, Check, Circle, Cube, Lightbulb, Ring, Star } from "@/components/shapes";
import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { TagList } from "@/components/ui/tag";
import {
  accentBg,
  businesses,
  labSteps,
  sectionId,
  type Accent,
} from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * AI Prototype Lab process steps (docs/디자인.md §8 "AI PROTOTYPE LAB").
 * Reuses `labSteps` (Idea → Prototype → Test → Build) and pairs each with a
 * shape from the brand vocabulary that matches its meaning: Lightbulb (idea),
 * Ring (experimentation), Check (validation/confirmation), Blocks (assembly).
 * Accents cycle through the palette — red bookends the strip without
 * flooding it, keeping the section's ~15% strong-accent budget in check.
 */
const steps: {
  label: (typeof labSteps)[number];
  caption: string;
  Shape: typeof Star;
  /** All four render as solid (filled) glyphs to match the brand icon set. */
  variant?: "solid" | "outline";
  accent: Accent;
}[] = [
  {
    label: labSteps[0],
    caption: "해결할 문제 정의",
    Shape: Lightbulb,
    accent: "red",
  },
  {
    label: labSteps[1],
    caption: "작동하는 시제품 제작",
    Shape: Cube,
    accent: "yellow",
  },
  {
    label: labSteps[2],
    caption: "사용자·데이터 검증",
    Shape: Check,
    accent: "sky",
  },
  {
    label: labSteps[3],
    caption: "실제 시스템 구축",
    Shape: Blocks,
    accent: "navy",
  },
];

/**
 * AI Solutions (docs/기획서.md §6 "02 AI SOLUTIONS", docs/디자인.md §8
 * "AI PROTOTYPE LAB").
 *
 * Two visual rhythms in one section: an editorial intro (heading + lead +
 * 주요 분야 tags, paired with an orbiting Star composition — the shape the
 * design system reserves for AI insight/discovery) followed by a distinct
 * bordered panel housing the experimental Idea→Prototype→Test→Build strip.
 * The strip is a row of flex-1 nodes joined by arrow connectors on desktop;
 * on mobile it recomposes into a vertical timeline (stacked nodes joined by
 * downward arrows) rather than simply shrinking the horizontal layout, per
 * §11.
 */
export function AiSolutions() {
  const aiSolutions = businesses[1];

  return (
    <Section id={sectionId.aiSolutions} className="relative overflow-hidden">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <Eyebrow dotClassName="bg-brand-red">AI SOLUTIONS</Eyebrow>
          <h2 className="text-section mt-6 text-ink">
            실험으로 끝나는 AI 말고,
            <br />
            업무에서 작동하는 AI로.
          </h2>
          <p className="mt-6 max-w-xl text-body-lg text-ink/70">
            반복 업무 자동화부터 챗봇, 콘텐츠 자동화, 사내 AI Tool까지. AI
            기술의 가능성을 실험하고 실제 업무에 적용할 수 있는 솔루션으로
            구현합니다.
          </p>

          <p className="mt-10 text-eyebrow text-ink/50">주요 분야</p>
          <TagList tags={[...aiSolutions.items]} className="mt-4" />

          <Link
            href={`/?ct=${encodeURIComponent("AI 솔루션 문의")}#${sectionId.contact}`}
            className="group mt-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-7 py-3 font-semibold text-white transition-colors hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
          >
            AI 도입 문의하기
            <ArrowUpRight
              className="size-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </Link>
        </div>

        {/* Orbiting Star composition — Star = AI insight/discovery/innovation. */}
        <div className="relative flex min-h-[14rem] items-center justify-center md:min-h-[20rem] lg:col-span-5">
          <Ring
            variant="outline"
            className="absolute size-48 text-brand-red/25 md:size-64"
          />
          <Circle className="absolute size-14 -translate-x-16 -translate-y-16 text-brand-yellow md:size-20 md:-translate-x-24 md:-translate-y-24" />
          <Star className="relative size-20 text-brand-red md:size-32" />
          <Circle className="absolute size-9 translate-x-16 translate-y-20 text-brand-sky md:size-12 md:translate-x-24 md:translate-y-28" />
        </div>
      </div>

      {/* AI Prototype Lab — experimental process strip. */}
      <div className="relative mt-20 overflow-hidden rounded-3xl border border-ink/10 bg-white p-8 md:mt-28 md:p-12">
        <Star
          variant="outline"
          className="pointer-events-none absolute -top-10 -right-10 size-40 text-brand-red/10 md:size-56"
        />

        <Eyebrow dotClassName="bg-brand-red">AI PROTOTYPE LAB</Eyebrow>
        <h3 className="relative mt-4 max-w-lg text-2xl font-extrabold tracking-tight text-ink md:text-4xl">
          AI 아이디어를 검증하고 구현하는 4단계.
        </h3>

        <ol className="relative mt-14 flex flex-col md:mt-16 md:flex-row md:items-start">
          {steps.map((step, i) => (
            <li key={step.label} className="contents">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-4 text-center md:gap-5">
                <div
                  className={cn(
                    // All four glyphs render white/ivory to match the brand
                    // icon set, regardless of the disc's light/dark accent.
                    "flex size-16 shrink-0 items-center justify-center rounded-full text-ivory md:size-20",
                    accentBg[step.accent],
                  )}
                >
                  <step.Shape variant={step.variant} className="size-7 md:size-9" />
                </div>
                <div>
                  <span className="text-eyebrow text-ink/40">0{i + 1}</span>
                  <h4 className="mt-1 text-xl font-extrabold text-ink md:text-2xl">
                    {step.label}
                  </h4>
                  <p className="mx-auto mt-2 max-w-[15rem] text-base text-ink/70">
                    {step.caption}
                  </p>
                </div>
              </div>

              {i < steps.length - 1 && (
                <div
                  aria-hidden
                  className="flex shrink-0 items-center justify-center text-brand-red/60 md:w-12 md:pt-8 lg:w-16"
                >
                  <span className="block py-3 text-2xl leading-none md:hidden">
                    ↓
                  </span>
                  <span className="hidden text-3xl leading-none md:block">
                    →
                  </span>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
