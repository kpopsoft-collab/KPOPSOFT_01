"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EditorialPhoto } from "@/components/ui/editorial-photo";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Tag } from "@/components/ui/tag";
import { photography } from "@/lib/photography";
import { accentBg, educationTracks, sectionId } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Six purpose-led tracks, each revealing the same 입문 → 실무 → 프로젝트 path. */
export function Education() {
  const [openTrackId, setOpenTrackId] = useState<string | null>(
    educationTracks[0].id,
  );

  return (
    <Section id={sectionId.education} className="relative overflow-hidden">
      <div className="max-w-3xl">
        <Eyebrow dotClassName="bg-brand-mint">교육 프로그램</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          목적에 따라 배우고,
          <br />
          프로젝트로 완성합니다.
        </h2>
        <p className="mt-6 max-w-2xl text-body-lg text-ink/70">
          AI 기초부터 업무 활용, 바이브 코딩, 자동화, 콘텐츠·동영상 제작까지.
          모든 트랙은 입문·실무·프로젝트 순서로 이어집니다.
        </p>
      </div>

      <div className="mt-14 grid gap-4 lg:mt-20 lg:grid-cols-12">
        <EditorialPhoto
          asset={photography.education.classroom}
          sizes="(min-width: 1440px) 860px, (min-width: 1024px) 66vw, 100vw"
          className="aspect-video lg:col-span-8"
        />
        <EditorialPhoto
          asset={photography.education.workshop}
          sizes="(min-width: 1440px) 420px, (min-width: 1024px) 34vw, 100vw"
          className="aspect-[4/3] lg:col-span-4"
        />
      </div>

      <Accordion
        value={openTrackId ? [openTrackId] : []}
        onValueChange={(value) => {
          const next = value[value.length - 1];
          setOpenTrackId(typeof next === "string" ? next : null);
        }}
        className="mt-8 border-t border-ink/10 lg:mt-10"
      >
        {educationTracks.map((track) => (
          <AccordionItem
            key={track.id}
            value={track.id}
            className="border-b border-ink/10"
          >
            <AccordionTrigger
              className={cn(
                "min-h-12 w-full items-center gap-4 rounded-none py-6 no-underline hover:no-underline md:gap-8 md:py-8",
                "transition-[padding] duration-200 md:hover:px-4",
                "[&_[data-slot=accordion-trigger-icon]]:size-5 [&_[data-slot=accordion-trigger-icon]]:text-ink/55",
              )}
            >
              <span
                className="w-7 shrink-0 text-sm font-semibold text-ink/40 md:w-10"
                aria-hidden
              >
                {track.index}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-xl font-extrabold tracking-tight text-ink md:text-2xl">
                  {track.title}
                </span>
                <span className="mt-2 block max-w-2xl text-base leading-7 font-normal text-ink/65 md:text-lg">
                  {track.description}
                </span>
              </span>

              <span className="hidden shrink-0 flex-wrap gap-2 lg:flex">
                {track.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </span>
            </AccordionTrigger>

            <AccordionContent className="pb-8 md:pb-10">
              <div className="border-l border-ink/10 pl-4 sm:ml-11 sm:pl-6 md:ml-18 md:pl-8">
                <div className="grid gap-8 md:grid-cols-3 md:gap-6">
                  {track.stages.map((stage, stageIndex) => (
                    <section key={stage.level}>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            accentBg[track.accent],
                          )}
                          aria-hidden
                        />
                        <span className="text-eyebrow text-ink/50">
                          {String(stageIndex + 1).padStart(2, "0")} · {stage.level}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-extrabold tracking-tight text-ink">
                        {stage.title}
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {stage.modules.map((module) => (
                          <li
                            key={module}
                            className="flex items-start gap-2.5 text-base leading-7 text-ink/70"
                          >
                            <span
                              className="mt-3 size-1 shrink-0 rounded-full bg-ink/35"
                              aria-hidden
                            />
                            {module}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-5 border-t border-ink/10 pt-6 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-2xl">
                    <span className="text-eyebrow text-ink/45">과정 결과</span>
                    <p className="mt-2 text-base leading-7 font-medium text-ink/80 md:text-lg">
                      {track.outcome}
                    </p>
                  </div>
                  <Link
                    href={`/?ct=${encodeURIComponent("교육 문의")}&cs=${encodeURIComponent(track.inquirySubtype)}#${sectionId.contact}`}
                    data-accordion-link-style="custom"
                    className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-brand-blue px-6 text-[0.95rem] font-semibold whitespace-nowrap text-white no-underline transition-colors outline-none hover:bg-brand-navy hover:text-white focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:self-auto"
                  >
                    이 교육 상담하기
                    <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}
