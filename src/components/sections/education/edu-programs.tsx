"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CoverVisual } from "@/components/ui/cover-visual";
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
import { educationSectionId, sectionId } from "@/lib/site";
import { type EduProgram, eduPrograms } from "@/lib/education-content";
import { cn } from "@/lib/utils";

/** 모집 상태는 텍스트로도 드러나 색상만으로 구분되지 않는다(§31). */
const statusStyle: Record<EduProgram["status"], string> = {
  "모집 중": "bg-brand-blue text-white",
  "모집 예정": "bg-ink/80 text-ivory",
  "상시 문의": "bg-brand-navy text-ivory",
  마감: "bg-ink/30 text-ivory",
};

/**
 * SECTION 04 — 대표 교육 프로그램 (docs §9).
 *
 * Six cards, image-led (4:3, §9 "이미지 원칙" — object-fit cover, no gradient
 * overlay). Cards without a confirmed result photo yet fall back to the
 * brand-shape Placeholder via `CoverVisual` (§25) instead of stretching a
 * mismatched stock photo over them. "자세히 보기" opens a detail Sheet,
 * matching the same pattern the home Education section already uses for
 * program rows — no separate route needed for the 1차 scope (§4/§34).
 */
export function EduPrograms() {
  return (
    <Section id={educationSectionId.programs} className="bg-ivory">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-blue">PROGRAMS</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          현재 수준과 목표에 맞는
          <br />
          프로그램을 선택하세요.
        </h2>
        <p className="mt-6 max-w-xl text-body-lg text-ink/70">
          AI를 처음 활용하는 단계부터, 직접 서비스와 업무 도구를 제작하는
          과정까지 실습 중심으로 구성했습니다.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
        {eduPrograms.map((program) => (
          <ProgramCard key={program.slug} program={program} />
        ))}
      </div>
    </Section>
  );
}

function ProgramCard({ program }: { program: EduProgram }) {
  return (
    <Sheet>
      <SheetTrigger
        className={cn(
          "group flex flex-col overflow-hidden rounded-3xl bg-white text-left transition-transform duration-200",
          "hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory",
        )}
      >
        <div className="relative">
          <CoverVisual
            accent={program.accent}
            imageUrl={program.image?.src}
            alt={program.image?.alt ?? ""}
            ratio="4/3"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="rounded-none [&_img]:transition-transform [&_img]:duration-300 group-hover:[&_img]:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
            <span className="text-eyebrow rounded-full bg-ink/70 px-3 py-1.5 text-ivory">
              {program.emotionalLabel}
            </span>
            <span
              className={cn(
                "text-eyebrow rounded-full px-3 py-1.5",
                statusStyle[program.status],
              )}
            >
              {program.status}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-6 md:p-7">
          <h3 className="text-xl font-extrabold tracking-tight text-ink">
            {program.name}
          </h3>
          <p className="text-base text-ink/70">{program.description}</p>
          <p className="mt-1 text-sm font-semibold text-ink/60">
            {program.audience}
          </p>
          <p className="text-sm text-ink/50">
            {program.difficulty} · {program.format}
          </p>

          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink">
            자세히 보기
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden
            />
          </span>
        </div>
      </SheetTrigger>

      <ProgramDetail program={program} />
    </Sheet>
  );
}

function ProgramDetail({ program }: { program: EduProgram }) {
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
            accent={program.accent}
            imageUrl={program.image?.src}
            alt={program.image?.alt ?? ""}
            ratio="4/3"
            sizes="(max-width: 640px) 100vw, 36rem"
          />
          <div className="flex flex-col gap-3">
            <span className="text-eyebrow text-ink/50">
              {program.emotionalLabel} · PROGRAM {program.index}
            </span>
            <SheetTitle className="text-2xl leading-tight font-extrabold tracking-tight text-ink md:text-3xl">
              {program.name}
            </SheetTitle>
            <SheetDescription className="text-body-lg text-ink/70">
              {program.description}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-5 px-6 pb-2 md:px-8">
        <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-ink/10 bg-white p-5 text-sm">
          <div>
            <dt className="text-ink/45">추천 대상</dt>
            <dd className="mt-1 font-semibold text-ink">{program.audience}</dd>
          </div>
          <div>
            <dt className="text-ink/45">난이도</dt>
            <dd className="mt-1 font-semibold text-ink">{program.difficulty}</dd>
          </div>
          <div>
            <dt className="text-ink/45">교육 방식</dt>
            <dd className="mt-1 font-semibold text-ink">{program.format}</dd>
          </div>
          <div>
            <dt className="text-ink/45">모집 상태</dt>
            <dd className="mt-1 font-semibold text-ink">{program.status}</dd>
          </div>
        </dl>
      </div>

      <SheetFooter className="mt-8 gap-3 border-t border-ink/10 p-6 md:p-8">
        <SheetClose
          nativeButton={false}
          render={
            <Link
              href={`/?ct=${encodeURIComponent("교육 문의")}&cs=${encodeURIComponent(
                program.name,
              )}#${sectionId.contact}`}
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
