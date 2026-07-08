"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { TagList } from "@/components/ui/tag";
import { AccentVisual } from "@/components/ui/accent-visual";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { accentBg, programs, sectionId } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Education / Programs (docs/기획서.md §6, docs/디자인.md §6 Program Cards,
 * §8 PROGRAMS).
 *
 * Editorial list layout: eight programs stacked as full-width rows separated by
 * hairline rules. Reads top-to-bottom like a curriculum index rather than an
 * asymmetric card matrix — easier to scan across the list. Each row leads with
 * its index number and name (category never carried by color alone, §12);
 * brand color stays out of the surface entirely, showing only in the arrow fill
 * on hover.
 *
 * Clicking a row opens a program-detail Sheet (요약 → 이런 분께 → 커리큘럼 →
 * 수료 후) ending in the contact CTA — mirrors Selected Work, since programs
 * have no dedicated routes yet and an overlay keeps the landing flow intact.
 */
export function Education() {
  return (
    <Section id={sectionId.education} className="relative overflow-hidden">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-mint">교육 프로그램</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          만들면서 배우는
          <br />
          실무형 교육 프로그램.
        </h2>
        <p className="mt-6 text-body-lg text-ink/70">
          AI와 디지털 기술을 실제 프로젝트를 통해 학습하는 실무 중심의 교육
          프로그램을 운영합니다.
        </p>
      </div>

      <ul className="mt-14 border-t border-ink/10 lg:mt-20">
        {programs.map((program) => (
          <ProgramRow key={program.name} program={program} />
        ))}
      </ul>
    </Section>
  );
}

function ProgramRow({ program }: { program: (typeof programs)[number] }) {
  return (
    <li>
      <Sheet>
        <SheetTrigger
          className={cn(
            "group relative flex w-full items-center gap-5 border-b border-ink/10 py-6 text-left md:gap-8 md:py-8",
            "transition-[padding] duration-200 md:hover:pl-4",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60",
          )}
        >
          <span
            className="w-8 shrink-0 text-sm font-semibold text-ink/40 md:w-10"
            aria-hidden
          >
            {program.index}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-extrabold tracking-tight text-ink md:text-2xl">
              {program.name}
            </h3>
            <p className="mt-2 text-body-lg text-ink/70">{program.desc}</p>
          </div>

          <div className="hidden shrink-0 lg:block">
            <TagList tags={[...program.tags]} />
          </div>

          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full border border-ink/25 text-ink transition-colors duration-200",
              "group-hover:bg-ink group-hover:text-ivory",
            )}
            aria-hidden
          >
            <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
          <span className="sr-only">{program.name} 프로그램 자세히 보기</span>
        </SheetTrigger>

        <ProgramDetail program={program} />
      </Sheet>
    </li>
  );
}

function ProgramDetail({ program }: { program: (typeof programs)[number] }) {
  // Focus the top of the panel on open (not base-ui's default first tabbable,
  // which is the footer CTA far down the scroll container) so every program
  // opens scrolled to its visual. Matches Selected Work's WorkDetail.
  const topRef = useRef<HTMLDivElement>(null);

  return (
    <SheetContent
      side="right"
      initialFocus={topRef}
      className="w-full gap-0 overflow-y-auto bg-ivory data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
    >
      <SheetHeader className="gap-5 p-6 pt-14 md:p-8 md:pt-16">
        <div
          ref={topRef}
          tabIndex={-1}
          className="flex flex-col gap-5 outline-none"
        >
          <AccentVisual accent={program.accent} className="h-44 md:h-52" />
          <div className="flex flex-col gap-3">
            <span className="text-eyebrow text-ink/50">
              PROGRAM {program.index}
            </span>
            <SheetTitle className="text-2xl leading-tight font-extrabold tracking-tight text-ink md:text-3xl">
              {program.name}
            </SheetTitle>
            <SheetDescription className="text-body-lg text-ink/70">
              {program.summary}
            </SheetDescription>
            <TagList tags={[...program.tags]} className="mt-1" />
          </div>
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-8 px-6 pb-2 md:px-8">
        <div className="flex flex-col gap-3">
          <span className="text-eyebrow text-ink/50">이런 분께 추천</span>
          <ul className="flex flex-col gap-2">
            {program.audience.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-body-lg text-ink/80"
              >
                <span
                  className={cn(
                    "mt-2 size-1.5 shrink-0 rounded-full",
                    accentBg[program.accent],
                  )}
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-eyebrow text-ink/50">커리큘럼</span>
          <ol className="flex flex-col gap-2.5">
            {program.curriculum.map((item, i) => (
              <li
                key={item}
                className="flex items-start gap-3 text-body-lg text-ink/80"
              >
                <span
                  className="mt-0.5 w-5 shrink-0 text-sm font-semibold text-ink/35"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-2.5 rounded-2xl border border-ink/10 bg-ink/[0.03] p-5">
          <span className="text-eyebrow text-ink/50">수료 후</span>
          <p className="text-body-lg font-medium text-ink">{program.outcome}</p>
        </div>
      </div>

      <SheetFooter className="mt-8 gap-3 border-t border-ink/10 p-6 md:p-8">
        <SheetClose
          nativeButton={false}
          render={
            <Link
              href={`#${sectionId.contact}`}
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-brand-blue px-7 text-[0.95rem] font-semibold whitespace-nowrap text-white transition-all outline-none hover:bg-brand-navy focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          }
        >
          이 프로그램 문의하기
          <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
}
