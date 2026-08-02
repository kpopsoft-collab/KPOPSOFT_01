"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CoverVisual } from "@/components/ui/cover-visual";
import { TagList } from "@/components/ui/tag";
import { eduSectionId, instructorPrograms } from "@/lib/education-content";
import type { PublicExpert } from "@/lib/public-content";
import { cn } from "@/lib/utils";

/**
 * 데스크톱 한 줄에 들어가는 카드 수. 이 수 이하면 캐러셀을 쓰지 않는다.
 */
const GRID_MAX = 3;

/**
 * 전문 강사진 (수정 요청서 §10).
 *
 * **강사가 3명 이하면 그리드, 4명부터 캐러셀이다.**
 * 요청서는 "선택된 강사를 크게 강조, 다음 강사 카드를 일부 노출"을 요구하지만,
 * 그건 화면에 다 못 담을 만큼 많을 때 성립하는 장치다. 3명뿐인데 캐러셀로
 * 두면 세 번째 카드가 잘린 채 걸려 있고, 화살표를 눌러 봐야 반 칸 움직이고
 * 끝난다 — 잘린 카드는 "더 있다"가 아니라 "레이아웃이 깨졌다"로 읽힌다.
 * 그래서 다 보이면 그냥 다 보여준다.
 *
 * 4명 이상일 때의 이동은 **네이티브 가로 스크롤 + scroll-snap**으로 한다.
 * 직접 transform을 계산하는 캐러셀보다 이쪽이 얻는 게 많다 — 터치 드래그와
 * 관성 스크롤, 트랙패드 두 손가락 스와이프, 키보드 스크롤이 전부 브라우저
 * 기본 동작으로 따라오고, 스크린리더도 카드를 순서대로 읽는다. 화살표 버튼은
 * 그 스크롤을 한 칸씩 움직일 뿐이다.
 *
 * **자동 슬라이드는 없다**(§10). 읽는 도중 카드가 저절로 넘어가면 문장을
 * 놓치고, 되돌리려면 사용자가 캐러셀과 씨름해야 한다.
 *
 * 담당 프로그램(§10)은 확인된 자료가 없어 `instructorPrograms`가 비어 있고,
 * 비어 있으면 그 줄을 그리지 않는다.
 */
export function Instructors({ experts }: { experts: PublicExpert[] }) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const isCarousel = experts.length > GRID_MAX;

  // 활성 카드 판정 — 스크롤 컨테이너의 왼쪽 기준에 가장 가까운 카드.
  const syncActive = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const items = Array.from(scroller.children) as HTMLElement[];
    const anchor = scroller.scrollLeft;

    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    items.forEach((item, index) => {
      const distance = Math.abs(item.offsetLeft - scroller.offsetLeft - anchor);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    });

    setActive(nearest);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    syncActive();
    scroller.addEventListener("scroll", syncActive, { passive: true });
    return () => scroller.removeEventListener("scroll", syncActive);
  }, [syncActive]);

  const scrollBy = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const item = scroller.children[0] as HTMLElement | undefined;
    const step = item ? item.offsetWidth + 24 : scroller.clientWidth * 0.8;

    scroller.scrollBy({
      left: step * direction,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  if (experts.length === 0) return null;

  return (
    <Section id={eduSectionId.instructors} className="scroll-mt-36 bg-ivory">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <Eyebrow dotClassName="bg-brand-navy">강사진</Eyebrow>
          <h2 className="text-section mt-6 text-ink">
            현업에서 경험한 사람이
            <br />
            실무의 방법을 가르칩니다.
          </h2>
          <p className="mt-6 max-w-xl text-body-lg text-ink/70">
            소프트웨어, AI, 디자인과 비즈니스 현장에서
            <br className="hidden sm:inline" /> 직접 프로젝트를 수행한 전문가가
            사례와 실습을 중심으로 교육합니다.
          </p>
        </div>

        {/* 화살표는 카드가 화면에 다 들어오지 않을 때만 의미가 있다. 다 보이는데
            화살표가 있으면 눌러도 아무 일이 없어 고장난 것처럼 보인다. */}
        {isCarousel ? (
          <div className="flex shrink-0 gap-2">
            <ArrowButton
              direction={-1}
              onClick={() => scrollBy(-1)}
              disabled={active === 0}
            />
            <ArrowButton
              direction={1}
              onClick={() => scrollBy(1)}
              disabled={active >= experts.length - 1}
            />
          </div>
        ) : null}
      </div>

      <ul
        ref={scrollerRef}
        className={cn(
          "mt-14 gap-6 lg:mt-20",
          isCarousel
            ? [
                "flex snap-x snap-mandatory overflow-x-auto pb-4",
                // 스크롤바는 숨기되 스크롤 자체는 살린다.
                "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                // 컨테이너 여백까지 끌어 써서 카드가 화면 끝에서 잘리지 않게 한다.
                "-mx-4 px-4 md:mx-0 md:px-0",
              ]
            : // 다 보이는 경우 — 데스크톱 3열, 좁아지면 접힌다.
              "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {experts.map((expert, index) => (
          <li
            key={expert.name}
            className={cn(
              isCarousel &&
                // 다음 카드가 일부 보이도록 100%보다 좁게 둔다(§10).
                "w-[78%] shrink-0 snap-start sm:w-[52%] lg:w-[38%]",
            )}
          >
            <InstructorCard
              expert={expert}
              // 그리드에서는 강조할 대상이 없다 — 전부 같은 무게로 보여준다.
              active={!isCarousel || index === active}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function ArrowButton({
  direction,
  onClick,
  disabled,
}: {
  direction: -1 | 1;
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = direction === -1 ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === -1 ? "이전 강사" : "다음 강사"}
      className="flex size-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors outline-none hover:bg-ink hover:text-ivory focus-visible:ring-3 focus-visible:ring-brand-blue/40 disabled:pointer-events-none disabled:opacity-30"
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

function InstructorCard({
  expert,
  active,
}: {
  expert: PublicExpert;
  active: boolean;
}) {
  const programs = instructorPrograms[expert.name] ?? [];

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-3xl bg-white transition-all duration-300",
        // 활성 카드만 또렷하게. 나머지는 살짝 물러난 상태로 남겨 "다음이
        // 있다"는 사실만 전한다.
        active ? "opacity-100" : "opacity-60",
      )}
    >
      <CoverVisual
        accent={expert.accent}
        imageUrl={expert.image}
        alt={expert.image ? `${expert.name} 프로필 사진` : ""}
        ratio="1/1"
        sizes="(max-width: 640px) 78vw, (max-width: 1024px) 52vw, 38vw"
        monogram={expert.name.charAt(0)}
        label={expert.role}
        className="rounded-none"
      />

      <div className="flex flex-1 flex-col gap-3 p-6 md:p-7">
        <div>
          <p className="text-xl font-extrabold tracking-tight text-ink">
            {expert.name}
          </p>
          <p className="text-sm font-semibold text-ink/60">{expert.role}</p>
        </div>

        <p className="text-sm leading-relaxed text-ink/75">
          &ldquo;{expert.quote}&rdquo;
        </p>

        {programs.length > 0 ? (
          <p className="text-sm text-ink/60">
            <span className="font-semibold text-ink/45">담당 · </span>
            {programs.join(" · ")}
          </p>
        ) : null}

        <TagList tags={[...expert.tags]} className="mt-auto pt-2" />
      </div>
    </article>
  );
}
