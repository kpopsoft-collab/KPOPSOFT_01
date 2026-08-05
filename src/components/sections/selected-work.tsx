"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

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
import { NewTabLink } from "@/components/ui/new-tab-link";
import { accentBg, educationSectionId, route, sectionId } from "@/lib/site";
import type { PublicWork } from "@/lib/public-content";
import type { PublicInquiryOption } from "@/lib/public-content";
import {
  getWorkCategories,
  inquiryTargetFor,
  type WorkCategoryId,
  workCategories,
} from "@/lib/work-category";
import { cn } from "@/lib/utils";

/**
 * 포트폴리오 분류 필터를 노출하기 시작하는 사례 수.
 * 이 값 미만이면 필터 없이 전부 보여준다.
 */
const FILTER_MIN_ITEMS = 6;

/** 필터 칩. 탭 타겟 44px 이상 (docs/04-design-system/ 접근성). */
function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors outline-none",
        "focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "bg-ink text-ivory"
          : "border border-ink/15 text-ink/70 hover:border-ink/40 hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}

/**
 * Selected Work — the most important section on the home page.
 *
 * ver2.1 재구성 (성과 중심 균일 그리드): 이전의 "대형 1 + 보조 2 + 가로형"
 * 혼합 레이아웃은 채도 높은 도형 플레이스홀더가 유일한 실제 스크린샷을
 * 압도하고, 정작 설득력 있는 성과 수치가 Sheet 안에 숨어 시선이 흩어졌다.
 * 이제 모든 카드가 동일한 anatomy(비주얼 + 메타 + 제목 + 성과 지표)로
 * 같은 리듬의 그리드에 놓이고, 각 카드 표면에 성과 수치를 노출해 "작동하는
 * 결과물"이 바로 읽히게 한다. 데스크톱은 3열 — 홀수 개일 때 마지막 카드를
 * 가로형으로 늘리던 예외를 없앴다. 크기가 다른 카드는 "이건 더 중요한 사례"로
 * 읽히는데, 실제로는 개수가 홀수라는 사실만 반영한 것이었기 때문이다.
 * 카드 전체가 클릭 타깃(Sheet trigger)이고 hover는 이미지 스케일 + 화살표
 * 넛지로 제한한다(§4/§9, no lift/shadow).
 */
export function SelectedWork({
  items,
  inquiryOptions = [],
}: {
  items: PublicWork[];
  /** 사례 상세 CTA가 문의 폼을 미리 채우는 데 쓴다. */
  inquiryOptions?: PublicInquiryOption[];
}) {
  return (
    <Section id={sectionId.work}>
      {/*
        헤더 구성은 교육 사례 섹션과 같다 — 제목 아래 보조 문구, 그 줄 오른쪽
        끝에 전체보기(사용자 지시). 예전에는 보조 문구가 제목 오른쪽에 붙고
        전체 목록 링크가 카드 아래 가운데 있었는데, 목록을 다 지나쳐야 링크가
        나와서 "더 있다"는 사실을 카드를 다 읽은 뒤에야 알 수 있었다.

        요청서 §8: `우리가 만든 것들`·`우리가 해결한 문제들`은 쓰지 않는다 —
        모든 프로젝트를 문제 해결 사례로만 한정하지 않기 위한 변경이다.
      */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
        <div className="max-w-2xl">
          <Eyebrow dotClassName="bg-brand-blue">PROJECTS</Eyebrow>
          <h2 className="text-section mt-6 text-ink">
            아이디어를 현실로 만든 프로젝트
          </h2>
          <p className="mt-6 text-body-lg text-ink/70">
            웹 서비스부터 업무 플랫폼과 AI 자동화 솔루션까지,
            <br className="hidden sm:inline" /> 다양한 아이디어를 실제로 사용할
            수 있는 서비스로 구현합니다.
          </p>
        </div>

        {/* 전체 목록(`/work`)으로 나간다 — 홈은 대표 사례만 보여주고,
            아카이브는 분류 필터를 항상 열어 둔다(요청서 §8). */}
        <Link
          href={route.work}
          className="group inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full border border-ink/15 px-5 text-sm font-semibold text-ink transition-colors outline-none hover:border-ink/40 focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:self-auto"
        >
          전체보기
          <ArrowUpRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </Link>
      </div>

      <WorkGrid items={items} inquiryOptions={inquiryOptions} />
    </Section>
  );
}

/**
 * 분류 필터 + 카드 그리드. 홈 섹션과 `/work` 아카이브가 같은 것을 쓴다 —
 * 카드 생김새와 상세 패널이 두 곳에서 갈라지지 않게 하기 위해서다.
 */
export function WorkGrid({
  items,
  inquiryOptions = [],
  alwaysShowFilter = false,
}: {
  items: PublicWork[];
  inquiryOptions?: PublicInquiryOption[];
  /** 아카이브에서는 사례 수와 무관하게 필터를 연다. */
  alwaysShowFilter?: boolean;
}) {
  const [active, setActive] = useState<WorkCategoryId | "all">("all");

  // 실제로 사례가 있는 분류만 필터로 노출한다 — 눌렀더니 빈 화면이 나오는
  // 필터는 없느니만 못하다(ver3 §05).
  const availableIds = useMemo(() => {
    const present = new Set<WorkCategoryId>();
    for (const item of items) {
      for (const id of getWorkCategories(item.category)) present.add(id);
    }
    return workCategories.filter((c) => present.has(c.id));
  }, [items]);

  const visible = useMemo(
    () =>
      active === "all"
        ? items
        : items.filter((item) =>
            getWorkCategories(item.category).includes(active),
          ),
    [items, active],
  );

  /*
    필터는 사례가 충분히 쌓인 뒤에만 노출한다.
    사례가 서너 개면 한 화면에 다 보여서 필터가 걸러줄 게 없고, 오히려 카드를
    가려 사례 수가 적다는 인상만 준다. 분류가 하나뿐일 때도 마찬가지다.
    (사례가 FILTER_MIN_ITEMS개 이상이 되면 자동으로 다시 나타난다.)
  */
  const showFilter =
    (alwaysShowFilter || items.length >= FILTER_MIN_ITEMS) &&
    availableIds.length > 1;

  return (
    <>
      {showFilter && (
        <div
          role="group"
          aria-label="포트폴리오 분류 필터"
          className="mt-10 flex flex-wrap gap-2"
        >
          <FilterChip
            label="전체"
            selected={active === "all"}
            onClick={() => setActive("all")}
          />
          {availableIds.map((category) => (
            <FilterChip
              key={category.id}
              label={category.label}
              selected={active === category.id}
              onClick={() => setActive(category.id)}
            />
          ))}
        </div>
      )}

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-20 lg:grid-cols-3">
        {visible.map((item, i) => (
          <WorkCard
            key={item.title}
            item={item}
            inquiryOptions={inquiryOptions}
            priority={i === 0}
          />
        ))}
      </div>
    </>
  );
}

/** Shared hover treatment — image scale + arrow nudge only (§9, no lift/shadow). */
/**
 * 카드에 보여줄 이미지 목록.
 * `imageUrls`가 있으면 그것을, 없으면 `imageUrl` 한 장을 쓴다.
 */
function galleryOf(item: PublicWork): (string | undefined)[] {
  if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls;
  return [item.imageUrl];
}

/** 카드 껍데기. 클릭 타깃은 내부의 투명 SheetTrigger 오버레이가 맡는다. */
const cardShell =
  "flex overflow-hidden rounded-3xl bg-white text-left transition-colors";
const imageScale =
  "rounded-none transition-transform duration-300 ease-out group-hover:scale-[1.03]";
const arrowNudge =
  "size-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5";

/** 균일 그리드 카드 — 전부 같은 세로형(이미지 상 · 본문 하)이다. */
function WorkCard({
  item,
  inquiryOptions,
  priority = false,
}: {
  item: PublicWork;
  inquiryOptions: PublicInquiryOption[];
  priority?: boolean;
}) {
  const categories = item.category.split(" · ");

  return (
    <Sheet>
      {/*
        카드는 대표 이미지 한 장만 보여준다 — 나머지는 상세 패널의 슬라이드에서
        본다. 트리거를 카드 전체로 감싸면 카드 안의 버튼과 중첩되므로(HTML상
        무효), 카드를 덮는 투명 오버레이로 깔고 시각 요소는 그 위에
        `pointer-events-none`으로 얹어 클릭이 오버레이로 통과하게 한다.
      */}
      <div className={cn(cardShell, "group relative flex-col")}>
        <div className="pointer-events-none relative z-10 overflow-hidden">
          <CoverVisual
            accent={item.accent}
            imageUrl={galleryOf(item)[0]}
            alt={item.title}
            ratio="16/9"
            priority={priority}
            monogram={item.client.slice(0, 1)}
            label={categories[0]}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={imageScale}
          />
        </div>

        {/*
          카드 정보 구조는 요청서 §8이 정한 순서를 그대로 따른다 —
          카테고리 → 프로젝트명 → 요약 → 담당 범위 → 이동 버튼.
          담당 범위(`scope`)는 실제 수행 내용이 확인된 사례에만 값이 있고,
          없으면 이 줄 자체가 렌더되지 않는다(임의 추가 금지).
        */}
        <div className="pointer-events-none relative z-10 flex flex-1 flex-col gap-3 p-6 md:p-7">
          <span className="text-eyebrow text-ink/55">
            {categories.join(" · ")}
          </span>

          <h3 className="text-lg leading-tight font-extrabold tracking-tight text-ink md:text-xl">
            {item.title}
          </h3>

          <p className="text-body-lg text-ink/70">{item.summary}</p>

          {/* 하단 줄 — 담당 범위와 이동 버튼을 카드 바닥에 붙여, 요약 길이가
              달라도 모든 카드의 버튼이 같은 높이에 오게 한다(§8). */}
          <div className="mt-auto flex items-end justify-between gap-4 pt-4">
            {item.scope && item.scope.length > 0 ? (
              <p className="text-sm leading-relaxed font-medium text-ink/55">
                <span className="sr-only">담당 범위: </span>
                {item.scope.join(" · ")}
              </p>
            ) : (
              <span />
            )}
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ink/25 text-ink transition-colors duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-ivory"
              aria-hidden
            >
              <ArrowUpRight className={arrowNudge} />
            </span>
          </div>
        </div>

        <SheetTrigger
          aria-label={`${item.title} 자세히 보기`}
          className="absolute inset-0 z-0 rounded-3xl outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
        />
      </div>

      <WorkDetail
        item={item}
        categories={categories}
        inquiryOptions={inquiryOptions}
      />
    </Sheet>
  );
}

/** 자동 롤링 간격. */
const GALLERY_INTERVAL_MS = 4000;

/**
 * 상세 패널 이미지 슬라이드.
 *
 * 세로로 전부 나열하면 본문(배경·문제 / 접근·해결)이 스크롤 아래로 밀려나서,
 * 한 장 높이에 슬라이드로 돌린다. 자동 롤링은 하되 읽기를 방해하지 않도록
 * 세 가지 조건에서 멈춘다 — 포인터가 올라가 있을 때, 안에 포커스가 있을 때,
 * 사용자가 직접 넘긴 뒤. `prefers-reduced-motion`이면 처음부터 돌지 않는다.
 *
 * 도트는 작지만 탭 타겟 44px를 확보하고(투명 패딩), 색만으로 현재 위치를
 * 알리지 않도록 `aria-current`와 sr-only 텍스트를 함께 준다.
 */
function DetailGallery({
  images,
  accent,
  title,
}: {
  images: (string | undefined)[];
  accent: PublicWork["accent"];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = images.length;
  const single = count <= 1;

  useEffect(() => {
    if (single || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      GALLERY_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [single, paused, count]);

  const goTo = (next: number) => {
    setPaused(true); // 직접 넘겼으면 자동 롤링을 멈춘다.
    setIndex(((next % count) + count) % count);
  };

  if (single) {
    return (
      <CoverVisual
        accent={accent}
        imageUrl={images[0]}
        alt={title}
        className="h-44 md:h-52"
      />
    );
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={`${title} 이미지`}
      className="relative"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((src, i) => (
            <div
              key={src ?? i}
              className="w-full shrink-0"
              aria-hidden={i !== index}
            >
              <CoverVisual
                accent={accent}
                imageUrl={src}
                alt={`${title} — 이미지 ${i + 1} / ${count}`}
                className="h-44 rounded-none md:h-52"
              />
            </div>
          ))}
        </div>
      </div>

      <GalleryArrow
        direction="prev"
        onClick={() => goTo(index - 1)}
        label={`${title} 이전 이미지`}
      />
      <GalleryArrow
        direction="next"
        onClick={() => goTo(index + 1)}
        label={`${title} 다음 이미지`}
      />

      {/* 위치 표시는 이미지 위에 얹지 않는다 — 스크린샷을 가린다.
          현재 장수는 화면 밖 텍스트로만 알린다. */}
      <p className="sr-only" aria-live="polite">
        이미지 {index + 1} / {count}
      </p>
    </div>
  );
}

function GalleryArrow({
  direction,
  onClick,
  label,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  label: string;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink/45 text-ivory backdrop-blur-sm transition-colors outline-none hover:bg-ink/70 focus-visible:ring-3 focus-visible:ring-ivory/70",
        direction === "prev" ? "left-2" : "right-2",
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

function WorkDetail({
  item,
  categories,
  inquiryOptions,
}: {
  item: PublicWork;
  categories: string[];
  inquiryOptions: PublicInquiryOption[];
}) {
  /**
   * 사례에 맞는 문의 유형·세부 유형을 미리 채운 채로 Contact로 보낸다.
   * 매칭에 실패하면 파라미터 없이 이동한다 — 엉뚱한 유형이 선택된 채로
   * 도착하는 것보다 아무것도 선택 안 된 편이 낫다.
   *
   * 단 교육 사례는 예외로 `/education` 하단 문의 폼으로 보낸다. 홈 폼에는
   * 교육이 받아야 할 항목(대상·인원·희망 일정)이 없고, 홈에서도 교육 유형은
   * 라디오가 아니라 교육 페이지로 가는 링크다.
   */
  const isEducation = getWorkCategories(item.category).includes("education");
  const target = isEducation ? null : inquiryTargetFor(item, inquiryOptions);

  const contactHref = isEducation
    ? `${route.education}#${educationSectionId.inquiry}`
    : target
      ? `/?ct=${encodeURIComponent(target.ct)}&cs=${encodeURIComponent(
          target.cs,
        )}#${sectionId.contact}`
      : `#${sectionId.contact}`;

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
          <DetailGallery
            images={galleryOf(item)}
            accent={item.accent}
            title={item.title}
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

        {/* 주요 기능 / 핵심 사용자 흐름 — 요청서 §9~§11이 프로젝트별로 확정해 준
            내용이다. 카드 표면은 요약까지만 두고, 여기서 자세히 보여준다. */}
        {item.features && item.features.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-eyebrow text-ink/55">주요 기능</span>
            <ul className="flex flex-col gap-2">
              {item.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-body-lg text-ink/80"
                >
                  <span
                    className={cn(
                      "mt-2 size-1.5 shrink-0 rounded-full",
                      accentBg[item.accent],
                    )}
                    aria-hidden
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {item.flow && (
          <div className="flex flex-col gap-3">
            <span className="text-eyebrow text-ink/55">핵심 사용자 흐름</span>
            <p className="rounded-2xl bg-ink/[0.04] px-5 py-4 text-base leading-relaxed font-semibold text-ink">
              {item.flow}
            </p>
          </div>
        )}

        {item.scope && item.scope.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-eyebrow text-ink/55">담당 범위</span>
            <TagList tags={item.scope} />
          </div>
        )}

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
        {/* 실제 서비스가 공개돼 있으면 새 탭으로 열고 외부 링크 아이콘을
            붙인다(요청서 §9). 새 창으로 열린다는 사실은 sr-only로도 알린다. */}
        {item.externalUrl && (
          <NewTabLink
            href={item.externalUrl}
            variant="secondary"
            icon={ExternalLink}
          >
            사이트 방문하기
          </NewTabLink>
        )}
        <SheetClose
          nativeButton={false}
          render={
            <Link
              href={contactHref}
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-brand-blue px-7 text-[0.95rem] font-semibold whitespace-nowrap text-white transition-all outline-none hover:bg-brand-navy focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          }
        >
          {isEducation ? "이런 교육, 문의하기" : "이런 프로젝트, 함께 만들기"}
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
