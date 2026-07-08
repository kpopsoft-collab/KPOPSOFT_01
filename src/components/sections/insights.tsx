"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Tag } from "@/components/ui/tag";
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
import { Cube, Star, Wave } from "@/components/shapes";
import { accentText, insights, sectionId } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Insights (docs/기획서.md §12, docs/디자인.md §4/§5/§6).
 *
 * A secondary, editorial-lite section — no image placeholders and no large
 * colored panels in the list. Each article gets a small brand-shape icon (from
 * the §5 vocabulary, picked for what it represents) sitting in a neutral chip,
 * keeping the accent color budget minimal while still giving every card its own
 * visual identity.
 *
 * Clicking a card opens a reading Sheet with the article body, ending in a
 * contact CTA that deep-links to the form with this article's topic preselected
 * — mirrors Selected Work / Education so all three surfaces behave the same.
 */
export function Insights() {
  return (
    <Section id={sectionId.insights}>
      <div>
        <Eyebrow dotClassName="bg-brand-sky">INSIGHTS</Eyebrow>
        <h2 className="text-section mt-6 text-ink">생각과 기록</h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8 lg:mt-20">
        {insights.map((item, index) => (
          <ArticleCard key={item.title} item={item} index={index} />
        ))}
      </div>
    </Section>
  );
}

/** Icon pairing per article, keyed by the §5 shape vocabulary. */
const motifs: (typeof Star)[] = [
  Star, // AI — matches the red-accented AI SOLUTIONS section
  Wave, // iteration, continuous learning
  Cube, // build, prototype, 3D
];

function ArticleCard({
  item,
  index,
}: {
  item: (typeof insights)[number];
  index: number;
}) {
  const Icon = motifs[index % motifs.length];

  return (
    <Sheet>
      <SheetTrigger className="group flex w-full flex-col justify-between gap-8 rounded-2xl border border-ink/10 p-6 text-left transition-colors hover:border-ink/25 hover:bg-ink/[0.02] focus-visible:border-ink/25 focus-visible:bg-ink/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50 sm:p-8">
        <div className="flex items-center justify-between">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink/[0.04]"
            aria-hidden
          >
            <Icon className={cn("size-5", accentText[item.accent])} />
          </span>
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ink/25 text-ink transition-colors duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-ivory"
            aria-hidden
          >
            <ArrowUpRight className="size-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>

        <div>
          <Tag>{item.tag}</Tag>
          <h3 className="mt-4 line-clamp-2 min-h-[2lh] text-xl leading-snug font-bold tracking-tight whitespace-pre-line text-ink break-keep md:text-2xl">
            {item.title}
          </h3>
          <p className="mt-4 text-sm text-ink/50">{item.date}</p>
        </div>

        <span className="sr-only">{item.title.replace(/\n/g, " ")} 읽기</span>
      </SheetTrigger>

      <ArticleDetail item={item} />
    </Sheet>
  );
}

function ArticleDetail({ item }: { item: (typeof insights)[number] }) {
  // Focus the top of the panel on open (not base-ui's default first tabbable,
  // the footer CTA far down the scroll container) so every article opens
  // scrolled to its top. Matches Selected Work / Education.
  const topRef = useRef<HTMLDivElement>(null);

  // Deep-link to the contact form with this article's topic preselected.
  const contactHref = `/?ct=${encodeURIComponent(item.inquiry.type)}&cs=${encodeURIComponent(
    item.inquiry.subtype,
  )}#${sectionId.contact}`;

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
            <div className="flex items-center gap-3">
              <Tag>{item.tag}</Tag>
              <span className="text-sm text-ink/50">{item.date}</span>
            </div>
            <SheetTitle className="text-2xl leading-tight font-extrabold tracking-tight text-ink text-balance break-keep md:text-3xl">
              {item.title.replace(/\n/g, " ")}
            </SheetTitle>
            <SheetDescription className="text-body-lg text-ink/70">
              {item.excerpt}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-5 px-6 pb-2 md:px-8">
        {item.body.map((paragraph) => (
          <p key={paragraph} className="text-body-lg leading-relaxed text-ink/80">
            {paragraph}
          </p>
        ))}
      </div>

      <SheetFooter className="mt-8 gap-3 border-t border-ink/10 p-6 md:p-8">
        <SheetClose
          nativeButton={false}
          render={
            <Link
              href={contactHref}
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-brand-blue px-7 text-[0.95rem] font-semibold whitespace-nowrap text-white transition-all outline-none hover:bg-brand-navy focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          }
        >
          이 주제로 문의하기
          <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
}
