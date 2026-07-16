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
import { CoverVisual } from "@/components/ui/cover-visual";
import { accentBg, sectionId } from "@/lib/site";
import type { PublicWork } from "@/lib/public-content";
import { cn } from "@/lib/utils";

/**
 * Selected Work (docs/KPOPSOFT_Home_Landing_ver2.md §SECTION 04) — the most
 * important section on the home page.
 *
 * Deliberately not a repeated card grid (§9 "피해야 할 표현: 모든 카드를 같은
 * 형태로 반복"): the first item renders as a large featured card, the next two
 * as a matched secondary pair beside it, and the rest as full-width horizontal
 * cards below — mirroring "대형 카드 1 + 보조 카드 2 + 가로형 카드 1". Position
 * in the `items` array (site.ts `selectedWork`, ordered so the one real case
 * leads) drives which layout a card gets; there is no separate CTA button per
 * card — the whole card is the click target (Sheet trigger), and hover is
 * limited to an image scale + arrow nudge (no lift/shadow), per §4/§9.
 */
export function SelectedWork({ items }: { items: PublicWork[] }) {
  const [featured, secondA, secondB, ...rest] = items;
  const secondary = [secondA, secondB].filter(Boolean);
  const horizontal = rest;

  return (
    <Section id={sectionId.work}>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <Eyebrow dotClassName="bg-brand-blue">SELECTED WORK</Eyebrow>
          <h2 className="text-section mt-6 text-ink">
            실제로 작동하는
            <br />
            제품과 도구를 만들었습니다.
          </h2>
        </div>
        <p className="max-w-sm text-body-lg text-ink/70">
          고객의 아이디어와 업무 문제를 실제로 사용할 수 있는 서비스와 업무
          도구로 구현했습니다.
        </p>
      </div>

      <div className="mt-14 flex flex-col gap-6 lg:mt-20">
        {featured && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <FeaturedWorkCard item={featured} className="lg:col-span-7" />
            {secondary.length > 0 && (
              <div className="flex flex-col gap-6 lg:col-span-5">
                {secondary.map((item) => (
                  <SecondaryWorkCard
                    key={item.title}
                    item={item}
                    className="flex-1"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {horizontal.map((item) => (
          <HorizontalWorkCard key={item.title} item={item} />
        ))}
      </div>

      {items.length >= 6 && (
        <div className="mt-10 flex justify-center lg:mt-14">
          <Link
            href={`#${sectionId.work}`}
            className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-brand-blue"
          >
            전체 프로젝트 보기
            <ArrowUpRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </Link>
        </div>
      )}
    </Section>
  );
}

/** Shared hover treatment — image scale + arrow nudge only (§9, no lift/shadow). */
const cardTrigger =
  "group flex overflow-hidden rounded-3xl bg-white text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";
const imageScale =
  "rounded-none transition-transform duration-300 ease-out group-hover:scale-[1.03]";
const arrowNudge =
  "size-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5";

function FeaturedWorkCard({
  item,
  className,
}: {
  item: PublicWork;
  className?: string;
}) {
  const categories = item.category.split(" · ");

  return (
    <Sheet>
      <SheetTrigger
        aria-label={`${item.title} 자세히 보기`}
        className={cn(cardTrigger, "flex-col", className)}
      >
        <div className="overflow-hidden">
          <CoverVisual
            accent={item.accent}
            imageUrl={item.imageUrl}
            alt={item.title}
            ratio="3/2"
            priority
            sizes="(max-width: 1024px) 100vw, 58vw"
            className={imageScale}
          />
        </div>

        <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
          <span className="text-eyebrow text-ink/50">
            {item.client} · {categories.join(" · ")}
          </span>

          <div className="flex items-start justify-between gap-6">
            <h3 className="text-2xl leading-tight font-extrabold tracking-tight text-ink md:text-3xl">
              {item.title}
            </h3>
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ink/25 text-ink transition-colors duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-ivory"
              aria-hidden
            >
              <ArrowUpRight className={arrowNudge} />
            </span>
          </div>

          <p className="max-w-lg text-body-lg text-ink/70">{item.summary}</p>
        </div>
      </SheetTrigger>

      <WorkDetail item={item} categories={categories} />
    </Sheet>
  );
}

function SecondaryWorkCard({
  item,
  className,
}: {
  item: PublicWork;
  className?: string;
}) {
  const categories = item.category.split(" · ");

  return (
    <Sheet>
      <SheetTrigger
        aria-label={`${item.title} 자세히 보기`}
        className={cn(cardTrigger, "flex-col", className)}
      >
        <div className="overflow-hidden">
          <CoverVisual
            accent={item.accent}
            imageUrl={item.imageUrl}
            alt={item.title}
            ratio="4/3"
            sizes="(max-width: 1024px) 100vw, 29vw"
            className={imageScale}
          />
        </div>

        <div className="flex flex-1 items-start justify-between gap-4 p-6">
          <div className="min-w-0">
            <span className="text-eyebrow text-ink/50">
              {item.client} · {categories[0]}
            </span>
            <h3 className="mt-2 text-lg leading-tight font-extrabold tracking-tight text-ink">
              {item.title}
            </h3>
          </div>
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-ink/25 text-ink transition-colors duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-ivory"
            aria-hidden
          >
            <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </SheetTrigger>

      <WorkDetail item={item} categories={categories} />
    </Sheet>
  );
}

function HorizontalWorkCard({ item }: { item: PublicWork }) {
  const categories = item.category.split(" · ");

  return (
    <Sheet>
      <SheetTrigger
        aria-label={`${item.title} 자세히 보기`}
        className={cn(cardTrigger, "flex-col md:flex-row md:items-stretch")}
      >
        <div className="overflow-hidden md:w-2/5 md:shrink-0">
          <CoverVisual
            accent={item.accent}
            imageUrl={item.imageUrl}
            alt={item.title}
            ratio="4/3"
            sizes="(max-width: 768px) 100vw, 40vw"
            className={imageScale}
          />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-3 p-6 md:p-8">
          <span className="text-eyebrow text-ink/50">
            {item.client} · {categories.join(" · ")}
          </span>

          <div className="flex items-start justify-between gap-6">
            <h3 className="text-xl leading-tight font-extrabold tracking-tight text-ink md:text-2xl">
              {item.title}
            </h3>
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-ink/25 text-ink transition-colors duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-ivory"
              aria-hidden
            >
              <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>

          <p className="max-w-md text-body-lg text-ink/70">{item.summary}</p>
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
  item: PublicWork;
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
          <CoverVisual
            accent={item.accent}
            imageUrl={item.imageUrl}
            alt={item.title}
            className="h-44 md:h-52"
          />
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

        {item.results.length > 0 && (
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
        )}
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
