import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { EditorialPhoto } from "@/components/ui/editorial-photo";
import { Circle, Plus } from "@/components/shapes";
import { photography } from "@/lib/photography";
import {
  accentText,
  sectionId,
  softwareCategories,
  type Accent,
} from "@/lib/site";
import { cn } from "@/lib/utils";

/** 카테고리의 문의 매핑을 Contact 폼 딥링크(유형/세부 유형 미리 선택)로 변환한다. */
function inquiryHref(inquiry: {
  type: string;
  subtype: string;
}): string {
  return `/?ct=${encodeURIComponent(inquiry.type)}&cs=${encodeURIComponent(
    inquiry.subtype,
  )}#${sectionId.contact}`;
}

/**
 * Software (docs/기획서.md §2 item 5 in the page order; content grounded in
 * §6 "01 SOFTWARE"). docs/디자인.md §8 calls this out explicitly as a
 * "large case-study oriented layout" — the opposite instruction from a
 * plain 5-up equal card grid, and deliberately a different rhythm from
 * BusinessOverview's 7/5/12 article grid.
 *
 * Composition: Web leads as an oversized case-study panel — same white
 * surface as the list (no full-saturation block that shouts over the
 * others), but it earns its size with an editorial poster composition: an
 * outsized "01" index watermark and cropped brand shapes (§5) fill the
 * canvas instead of empty space, and the title carries the accent. The
 * remaining four categories fall into one supporting index list beside it —
 * a lead-plus-list arrangement (§4 warns against repeating the same card
 * grid every section). Category is legible from its index numeral + name,
 * not color alone (§12 accessibility).
 */

// Accent for the lead case-study panel.
const leadAccent: Accent = "blue";

export function Software() {
  const [lead, ...rest] = softwareCategories;

  return (
    <Section id={sectionId.software} className="relative overflow-hidden">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-blue">SOFTWARE</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          필요한 것을
          <br />
          직접 만듭니다.
        </h2>
        <p className="mt-6 text-body-lg text-ink/70">
          웹 서비스와 모바일 앱, 기업용 소프트웨어와 디지털 플랫폼까지 —
          아이디어를 기획에서 멈추지 않고 실제로 작동하는 제품으로
          만듭니다.
        </p>

        {/* Section-level CTA (별개 버튼) — cards deep-link per category, this covers the whole section. */}
        <Link
          href={`/?ct=${encodeURIComponent("프로젝트 문의")}#${sectionId.contact}`}
          className="group mt-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-7 py-3 font-semibold text-white transition-colors hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
        >
          제작 의뢰하기
          <ArrowUpRight
            className="size-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </Link>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 lg:mt-20 lg:grid-cols-12 lg:items-stretch">
        {/* Lead case study — white surface like the list, sized up and filled with an editorial poster composition. */}
        <Link
          href={inquiryHref(lead.inquiry)}
          aria-label={`${lead.title} 프로젝트 문의하기`}
          className="group relative flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-3xl bg-white p-8 transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory md:p-14 lg:col-span-7"
        >
          {/* Poster geometry — an outsized index watermark + cropped brand shapes fill the canvas (§5). */}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-1/2 -right-2 -translate-y-1/2 text-[11rem] leading-none font-extrabold tracking-tighter opacity-[0.07] select-none md:text-[15rem]",
              accentText[leadAccent],
            )}
          >
            01
          </span>
          <Circle
            className={cn(
              "pointer-events-none absolute -bottom-16 -left-14 size-52 opacity-[0.06]",
              accentText[leadAccent],
            )}
          />
          <Plus className="pointer-events-none absolute top-10 right-12 size-8 text-brand-yellow opacity-80 md:size-10" />

          <div className="relative flex items-start justify-between gap-6">
            <span className="text-eyebrow text-ink/50">대표 분야 · Case 01</span>
          </div>

          <div className="relative mt-10 max-w-lg">
            <div className="flex items-center gap-3">
              <h3
                className={cn(
                  "text-4xl font-extrabold tracking-tight md:text-6xl",
                  accentText[leadAccent],
                )}
              >
                {lead.title}
              </h3>
              <ArrowUpRight
                className={cn(
                  "size-8 shrink-0 opacity-60 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 md:size-10",
                  accentText[leadAccent],
                )}
                aria-hidden
              />
            </div>
            <p className="mt-5 max-w-md text-body-lg text-ink/70">{lead.desc}</p>
          </div>
        </Link>

        {/* Supporting index list — the remaining four categories, one shared surface. */}
        <div className="flex flex-col overflow-hidden rounded-3xl bg-white lg:col-span-5">
          {rest.map((category, i) => {
            const index = String(i + 2).padStart(2, "0");

            return (
              <Link
                key={category.title}
                href={inquiryHref(category.inquiry)}
                aria-label={`${category.title} 프로젝트 문의하기`}
                className={cn(
                  "group flex min-h-[44px] flex-1 items-center gap-5 px-6 py-6 transition-colors hover:bg-brand-blue/5 focus-visible:bg-brand-blue/5 focus-visible:outline-none md:px-8",
                  i > 0 && "border-t border-ink/10",
                )}
              >
                <span
                  className="w-8 shrink-0 text-lg font-extrabold text-ink/25 tabular-nums transition-colors group-hover:text-brand-blue/50"
                  aria-hidden
                >
                  {index}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg font-extrabold tracking-tight text-ink">
                    {category.title}
                  </h4>
                  <p className="mt-1 text-sm text-ink/60">{category.desc}</p>
                </div>
                <ArrowUpRight
                  className="size-5 shrink-0 text-ink/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-blue"
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-14 lg:mt-20">
        <p className="text-eyebrow text-ink/50">현장에서 만드는 과정</p>
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <EditorialPhoto
            asset={photography.software.collaboration}
            sizes="(min-width: 1440px) 860px, (min-width: 1024px) 66vw, 100vw"
            className="aspect-video lg:col-span-8"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4">
            <EditorialPhoto
              asset={photography.software.dashboard}
              sizes="(min-width: 1440px) 420px, (min-width: 1024px) 33vw, 100vw"
              className="aspect-[4/3] sm:col-span-2"
            />
            <EditorialPhoto
              asset={photography.software.workstation}
              sizes="(min-width: 1440px) 205px, (min-width: 1024px) 16vw, (min-width: 640px) 50vw, 100vw"
              className="aspect-[4/3]"
            />
            <EditorialPhoto
              asset={photography.software.sketch}
              sizes="(min-width: 1440px) 205px, (min-width: 1024px) 16vw, (min-width: 640px) 50vw, 100vw"
              className="aspect-[4/3]"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
