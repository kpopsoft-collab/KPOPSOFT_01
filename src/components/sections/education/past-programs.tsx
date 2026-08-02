"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CoverVisual } from "@/components/ui/cover-visual";
import { Tag } from "@/components/ui/tag";
import {
  ImageLightbox,
  ImageLightboxContent,
  ImageLightboxTrigger,
} from "@/components/ui/image-lightbox";
import {
  eduCategories,
  eduSectionId,
  type PastProgram,
  pastPrograms,
} from "@/lib/education-content";

/**
 * 교육 사례 및 결과물 (수정 요청서 §9).
 *
 * ver3의 "지난 프로그램"이 이 섹션으로 흡수됐다. 제목과 앵커가 바뀐 이유는
 * 담을 것이 늘어서다 — 지난 프로그램뿐 아니라 기업교육 사례, 정규 교육 사례,
 * 클럽 활동과 세미나, 수강생 결과물까지 한 곳에서 보여주기로 했다(§9).
 *
 * **다만 지금 실제로 있는 자료는 지난 프로그램 3건뿐이다.** 요청서가 지정한
 * 두 줄 마키 갤러리는 카드가 양쪽으로 흐를 만큼 쌓였을 때 의미가 있고,
 * 3건으로 돌리면 같은 카드가 반복해서 지나가며 오히려 사례가 적다는 사실만
 * 강조된다. 그래서 카테고리 축과 섹션 자리를 먼저 잡아 두고, 마키는 자료가
 * 채워지면 켠다 — §18이 "확인되지 않은 사례를 만들지 말 것"을 못 박고 있어
 * 빈 카테고리를 그럴듯한 더미로 메우지 않는다.
 *
 * Desktop은 고정폭 이미지 열 + 정보, Mobile은 이미지 상단형으로 마크업 자체를
 * 바꾼다(데스크톱 행을 좁게 눌러 담지 않는다).
 */
/**
 * 접힌 상태에서 보여줄 사례 수.
 *
 * 행 하나가 사진까지 포함해 화면을 꽤 차지하므로, 처음부터 전부 펼치면 이
 * 섹션 하나가 페이지의 절반을 먹는다. 사례는 어드민에서 계속 늘어날 값이라
 * 상한이 없기도 하다.
 */
const COLLAPSED_COUNT = 2;

export function PastPrograms() {
  const [expanded, setExpanded] = useState(false);

  if (pastPrograms.length === 0) return null;

  const hasMore = pastPrograms.length > COLLAPSED_COUNT;
  const visible =
    expanded || !hasMore ? pastPrograms : pastPrograms.slice(0, COLLAPSED_COUNT);

  return (
    <Section id={eduSectionId.cases} className="scroll-mt-36 bg-ivory">
      {/* 보조 문구와 같은 줄, 오른쪽 끝에 전체보기를 둔다(사용자 지시).
          `items-end`라 문구가 몇 줄이든 버튼이 마지막 줄에 맞춰 앉는다. */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
        <div className="max-w-2xl">
          <Eyebrow dotClassName="bg-brand-yellow">교육 사례</Eyebrow>
          <h2 className="text-section mt-6 text-ink">
            배우고, 직접 만든 결과들
          </h2>
          <p className="mt-6 text-body-lg text-ink/70">
            기업교육과 정규 과정, 바이브데이즈에서
            <br className="hidden sm:inline" /> 함께 배우고 만든 실제 과정과
            결과물을 확인해보세요.
          </p>
        </div>

        {/* 전부 보이는 상태에서 버튼이 남아 있으면 눌러도 아무 일이 없다. */}
        {hasMore ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="group inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full border border-ink/15 px-5 text-sm font-semibold text-ink transition-colors outline-none hover:border-ink/40 focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory md:self-auto"
          >
            {expanded ? "접기" : `전체보기 (${pastPrograms.length})`}
            <ArrowRight
              className={cn(
                "size-4 transition-transform duration-200",
                expanded
                  ? "-rotate-90"
                  : "rotate-90 group-hover:translate-y-0.5",
              )}
              aria-hidden
            />
          </button>
        ) : null}
      </div>

      <ul className="mt-14 flex flex-col gap-6 lg:mt-20">
        {visible.map((item) => (
          <li key={item.slug}>
            <ProgramRow item={item} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function categoryName(item: PastProgram) {
  return eduCategories.find((c) => c.id === item.category)?.shortName ?? "";
}

function ProgramFacts({ item }: { item: PastProgram }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Tag className="border-ink/15 font-semibold text-ink/75">
          {categoryName(item)}
        </Tag>
        <span className="text-sm font-medium text-ink/50">{item.period}</span>
      </div>

      <h3 className="mt-4 text-xl font-extrabold tracking-tight text-ink md:text-2xl">
        {item.title}
      </h3>
      <p className="mt-3 text-base leading-relaxed text-ink/70">
        {item.summary}
      </p>

      <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="text-ink/45">대상</dt>
          <dd className="font-medium text-ink">
            {item.audience} {item.participants}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink/45">기간</dt>
          <dd className="font-medium text-ink">{item.duration}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink/45">결과물</dt>
          <dd className="font-medium text-ink">{item.outcome}</dd>
        </div>
      </dl>
    </>
  );
}

function ProgramCover({ item }: { item: PastProgram }) {
  const badge = item.galleryCount > 0 && (
    <span
      className="absolute right-3 bottom-3 rounded-full bg-ink/70 px-3 py-1.5 text-xs font-semibold text-ivory"
      aria-hidden
    >
      +{item.galleryCount}
    </span>
  );

  return (
    <ImageLightbox>
      <div className="group relative">
        <ImageLightboxTrigger
          className="block w-full rounded-none outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40"
          aria-label={`${item.title} 사진 확대 보기`}
        >
          <CoverVisual
            accent={item.accent}
            imageUrl={item.coverImage.src}
            alt={item.coverImage.alt}
            ratio="4/3"
            sizes="(max-width: 1024px) 100vw, 22rem"
            className="rounded-none [&_img]:transition-transform [&_img]:duration-300 group-hover:[&_img]:scale-[1.03]"
          />
        </ImageLightboxTrigger>
        {badge}
      </div>
      <ImageLightboxContent
        src={item.coverImage.src}
        alt={item.coverImage.alt}
        caption={
          item.coverImage.caption ??
          `${item.period} · ${item.title}${
            item.galleryCount > 0 ? ` (외 ${item.galleryCount}장)` : ""
          }`
        }
      />
    </ImageLightbox>
  );
}

function ProgramRow({ item }: { item: PastProgram }) {
  return (
    <article className="overflow-hidden rounded-3xl bg-white">
      {/* Desktop — 가로 리스트형. */}
      <div className="hidden lg:flex lg:items-stretch">
        <div className="w-80 shrink-0">
          <ProgramCover item={item} />
        </div>
        <div className="flex flex-1 flex-col justify-center p-10">
          <ProgramFacts item={item} />
        </div>
      </div>

      {/* Mobile / tablet — 이미지 상단형. */}
      <div className="lg:hidden">
        <ProgramCover item={item} />
        <div className="p-7">
          <ProgramFacts item={item} />
        </div>
      </div>
    </article>
  );
}
