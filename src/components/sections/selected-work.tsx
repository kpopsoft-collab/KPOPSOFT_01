"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { TagList } from "@/components/ui/tag";
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
import { AccentVisual } from "@/components/ui/accent-visual";
import { accentBg, selectedWork, sectionId } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Selected Work (docs/기획서.md §9, docs/디자인.md §4/§6/§8).
 *
 * No real project photography exists yet, so each row's "visual" is a flat
 * brand-shape composition keyed to the item's accent color instead of a gray
 * image placeholder — consistent with the shape vocabulary in §5 and the
 * "no gradients / no glossy imagery" rule in §1. A large editorial row list
 * (not a card grid) gives this section its own rhythm, distinct from the
 * Business Overview and Program card grids (§8).
 *
 * Clicking a row opens a case-study Sheet (summary → 배경/문제/해결/결과) that
 * ends with the contact CTA — the site has no per-project detail routes yet, so
 * an overlay keeps the landing-page flow intact instead of navigating away.
 */
export function SelectedWork() {
  return (
    <Section id={sectionId.work}>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <Eyebrow dotClassName="bg-brand-blue">WORK</Eyebrow>
          <h2 className="text-section mt-6 text-ink">
            아이디어에서
            <br />
            운영까지, 직접 만듭니다.
          </h2>
        </div>
        <p className="max-w-sm text-body-lg text-ink/70">
          다양한 산업의 파트너와 함께 소프트웨어와 AI 솔루션을 기획부터 운영까지
          만들어온 프로젝트입니다.
        </p>
      </div>

      <div className="mt-14 border-t border-ink/10 lg:mt-20">
        {selectedWork.map((item, index) => (
          <WorkRow key={item.title} item={item} index={index} />
        ))}
      </div>
    </Section>
  );
}

function WorkRow({
  item,
  index,
}: {
  item: (typeof selectedWork)[number];
  index: number;
}) {
  const categories = item.category.split(" · ");

  return (
    <Sheet>
      <SheetTrigger className="group -mx-3 grid w-full grid-cols-1 items-center gap-6 rounded-2xl border-b border-ink/10 px-3 py-8 text-left transition-colors hover:bg-ink/[0.03] focus-visible:bg-ink/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50 md:grid-cols-12 md:gap-8 md:py-10">
        <AccentVisual accent={item.accent} className="md:col-span-2" />

        <div className="flex items-center gap-3 md:col-span-2 md:flex-col md:items-start md:gap-1.5">
          <span className="text-sm font-semibold text-ink/35" aria-hidden>
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-eyebrow text-ink/60">{item.client}</span>
        </div>

        <h3 className="text-xl leading-tight font-extrabold tracking-tight text-ink md:col-span-5 md:text-2xl lg:text-3xl">
          {item.title}
        </h3>

        <TagList tags={categories} className="md:col-span-2" />

        <div className="flex justify-start md:col-span-1 md:justify-end">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ink/25 text-ink transition-colors duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-ivory"
            aria-hidden
          >
            <ArrowUpRight className="size-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
          <span className="sr-only">{item.title} 자세히 보기</span>
        </div>
      </SheetTrigger>

      <WorkDetail item={item} categories={categories} />
    </Sheet>
  );
}

function WorkDetail({
  item,
  categories,
}: {
  item: (typeof selectedWork)[number];
  categories: string[];
}) {
  // Focus the top of the panel on open (instead of base-ui's default of the
  // first tabbable element, which is the footer CTA far down the scroll
  // container) so every case study opens scrolled to its visual, not mid-way.
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
          <AccentVisual accent={item.accent} className="h-44 md:h-52" />
          <div className="flex flex-col gap-3">
            <span className="text-eyebrow text-ink/60">{item.client}</span>
            <SheetTitle className="text-2xl leading-tight font-extrabold tracking-tight text-ink md:text-3xl">
              {item.title}
            </SheetTitle>
            <SheetDescription className="text-body-lg text-ink/70">
              {item.summary}
            </SheetDescription>
            <TagList tags={categories} className="mt-1" />
          </div>
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-8 px-6 pb-2 md:px-8">
        <DetailBlock label="배경 · 문제">{item.challenge}</DetailBlock>
        <DetailBlock label="접근 · 해결">{item.solution}</DetailBlock>

        <div className="flex flex-col gap-3">
          <span className="text-eyebrow text-ink/50">결과</span>
          <ul className="flex flex-col gap-2">
            {item.results.map((result) => (
              <li
                key={result}
                className="flex items-start gap-2.5 text-body-lg text-ink"
              >
                <span
                  className={cn(
                    "mt-2 size-1.5 shrink-0 rounded-full",
                    accentBg[item.accent],
                  )}
                  aria-hidden
                />
                {result}
              </li>
            ))}
          </ul>
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
          이런 프로젝트, 함께 만들기
          <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
}

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-eyebrow text-ink/50">{label}</span>
      <p className="text-body-lg text-ink/80">{children}</p>
    </div>
  );
}
