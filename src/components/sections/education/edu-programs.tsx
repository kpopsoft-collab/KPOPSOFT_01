"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CoverVisual } from "@/components/ui/cover-visual";
import { CtaButton } from "@/components/ui/cta-button";
import { Tag } from "@/components/ui/tag";
import { VibedaysModal } from "@/components/sections/education/vibedays-modal";
import { useEduExplore } from "@/components/sections/education/explore-context";
import {
  type EduCategoryId,
  eduCategories,
  eduSectionId,
  getProgramHighlight,
  orgTraining,
  type RegularClass,
  regularClassIntro,
  sortRegularClassesByTrack,
} from "@/lib/education-content";
import { accentBg, accentText, educationSectionId } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * 프로그램 (수정 요청서 §7).
 *
 * ver3에서는 세 분류를 위에서 아래로 나열했다. 정보는 다 있었지만 세 개가
 * 같은 무게로 흘러가서 "무엇을 고르는 화면"으로 읽히지 않았다. 요청서가
 * 지정한 Sticky Scroll은 그걸 바꾼다 — **한 번에 하나씩만 읽게 만든다.**
 *
 * 데스크톱 구조: 왼쪽 세 블록이 정상 스크롤하고, 오른쪽 패널이 sticky로
 * 붙어 활성 블록의 사진·대상·방식·결과물로 교체된다. 활성 판정은
 * IntersectionObserver가 아니라 **스크롤 위치 대비 각 블록의 중심 거리**로
 * 한다 — observer의 임계값 방식은 블록 높이가 서로 다를 때(정규 클래스 블록은
 * 4과정이 들어가 훨씬 길다) 짧은 블록이 활성화되지 못한 채 지나간다.
 *
 * 모바일은 sticky를 걷어내고 세로 카드 3장으로 바꾼다(§7). 데스크톱 구성을
 * 좁게 눌러 담는 것이 아니라 마크업 자체가 다르다 — 카드 하나에 제목·대상·
 * 형태·결과물·CTA가 한 번에 보여야 한다는 요구를 좁은 2열 구조로는 만족할 수
 * 없기 때문이다.
 *
 * 앵커 id(`program-org` / `program-regular` / `program-club`)는 홈 Contact의
 * 교육 세부 유형이 직접 가리킨다. 바꾸면 홈 링크가 함께 깨진다.
 */

/** 세 분류의 렌더 순서 — 요청서 §7의 01·02·03 그대로. */
const PROGRAM_ORDER: EduCategoryId[] = ["org", "regular", "club"];

const ANCHOR: Record<EduCategoryId, string> = {
  org: eduSectionId.programOrg,
  regular: eduSectionId.programRegular,
  club: eduSectionId.programClub,
};

export function EduPrograms() {
  const { purpose, category: purposeCategory, clearPurpose } = useEduExplore();
  const [active, setActive] = useState<EduCategoryId>("org");

  const blockRefs = useRef(new Map<EduCategoryId, HTMLDivElement>());

  // 스크롤에 따라 활성 프로그램을 바꾼다(§7). 뷰포트 중앙에 가장 가까운
  // 블록이 이긴다 — 높이가 제각각인 블록들 사이에서 유일하게 안정적인 기준이다.
  useEffect(() => {
    const onScroll = () => {
      const center = window.innerHeight / 2;
      let nearest: EduCategoryId = "org";
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (const [id, el] of blockRefs.current) {
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = id;
        }
      }

      setActive((prev) => (prev === nearest ? prev : nearest));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const classes = sortRegularClassesByTrack(purpose?.track);

  return (
    <Section id={educationSectionId.programs} className="bg-ivory">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-blue">교육 프로그램</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          목적에 맞는 프로그램을 선택하세요.
        </h2>
        <p className="mt-6 text-body-lg text-ink/70">
          {/* `<br>` 뒤 공백을 명시적으로 둔다 — 줄바꿈이 꺼지는 모바일에서
              JSX가 줄 사이 공백을 지워 "환경까지,필요한"으로 붙어 버린다. */}
          개인의 학습 목표부터 조직의 업무 환경까지,
          <br className="hidden sm:inline" /> 필요한 방식과 수준에 맞춰 교육을
          제공합니다.
        </p>
      </div>

      {/* 목적 선택이 무엇을 바꿨는지 밝힌다. 정렬이 조용히 바뀌면 사용자는
          목록이 원래 그런 순서인 줄 알고, 되돌릴 방법도 찾지 못한다. */}
      {purpose ? (
        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl border border-ink/10 bg-white px-5 py-4">
          <span className="text-sm text-ink/70">
            <span className="font-semibold text-ink">{purpose.title}</span>에
            맞춰 정렬했습니다.
          </span>
          <button
            type="button"
            onClick={clearPurpose}
            className="rounded-full px-3 py-1 text-sm font-semibold text-ink/60 underline underline-offset-4 transition-colors outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-brand-blue/40"
          >
            전체 순서로 보기
          </button>
        </div>
      ) : null}

      {/* ---------------- Desktop: Sticky Scroll ---------------- */}
      <div className="mt-14 hidden lg:mt-20 lg:grid lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-6">
          <div className="flex flex-col gap-32">
            {PROGRAM_ORDER.map((id) => (
              <div
                key={id}
                id={ANCHOR[id]}
                ref={(el) => {
                  if (el) blockRefs.current.set(id, el);
                  else blockRefs.current.delete(id);
                }}
                className="scroll-mt-32"
              >
                <ProgramCopy
                  category={id}
                  active={active === id}
                  emphasized={purposeCategory === id}
                  classes={classes}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="sticky top-32">
            <StickyPanel category={active} />
          </div>
        </div>
      </div>

      {/* ---------------- Mobile: 세로 카드 3장 ---------------- */}
      <div className="mt-14 flex flex-col gap-6 lg:hidden">
        {PROGRAM_ORDER.map((id) => (
          <MobileCard
            key={id}
            category={id}
            emphasized={purposeCategory === id}
            classes={classes}
          />
        ))}
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- *
 * 분류별 공통 카피
 * ---------------------------------------------------------------- */

/**
 * 요청서 §7이 확정한 설명문. `education-content.ts`의 기존 카피와 다른
 * 문구라 여기에 둔다 — 기존 카피는 ver3 화면(세로 나열)을 전제로 쓰였고,
 * 확정 문구의 의미를 임의로 바꾸지 말라는 §18에 따라 요청서 쪽을 쓴다.
 */
const COPY: Record<
  EduCategoryId,
  { index: string; title: string; description: string }
> = {
  org: {
    index: "01",
    title: "조직·기업 맞춤 교육",
    description:
      "조직의 목표와 직무, AI 활용 수준을 바탕으로 맞춤형 커리큘럼을 설계합니다.",
  },
  regular: {
    index: "02",
    title: "정규 교육 과정",
    description:
      "AI 입문부터 실무 프로젝트까지 단계적으로 배우고 직접 결과물을 만드는 교육 과정입니다.",
  },
  club: {
    index: "03",
    title: "바이브데이즈 클럽",
    description:
      "스터디와 세미나, 실무 커뮤니티를 통해 AI 활용 경험과 지식을 지속적으로 나눕니다.",
  },
};

function accentOf(category: EduCategoryId) {
  return eduCategories.find((c) => c.id === category)?.accent ?? "blue";
}

function ProgramCopy({
  category,
  active,
  emphasized,
  classes,
}: {
  category: EduCategoryId;
  active: boolean;
  emphasized: boolean;
  classes: RegularClass[];
}) {
  const copy = COPY[category];
  const accent = accentOf(category);

  return (
    <div
      className={cn(
        "transition-opacity duration-500",
        // 비활성 블록을 완전히 숨기지 않고 흐리게만 둔다. 읽던 문장이
        // 사라지면 스크롤을 되돌렸을 때 맥락을 다시 찾아야 한다.
        active ? "opacity-100" : "opacity-45",
      )}
    >
      <div className="flex items-center gap-4 border-t border-ink/15 pt-5">
        <span className="text-eyebrow text-ink/40">{copy.index}</span>
        <span
          aria-hidden
          className={cn(
            "size-2.5 rounded-full transition-transform duration-500",
            accentBg[accent],
            active ? "scale-100" : "scale-0",
          )}
        />
      </div>

      <h3
        className={cn(
          "mt-6 text-3xl leading-tight font-extrabold tracking-tight transition-colors duration-500 md:text-4xl",
          active ? accentText[accent] : "text-ink",
        )}
      >
        {copy.title}
      </h3>

      <p className="mt-5 text-body-lg text-ink/70">{copy.description}</p>

      {category === "regular" ? (
        <div className="mt-10">
          <p className="text-sm font-semibold text-ink/50">
            {regularClassIntro.title}
          </p>
          <ul className="mt-5 flex flex-col gap-3">
            {classes.map((item) => (
              <li key={item.slug}>
                <RegularClassRow item={item} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={cn("mt-10", emphasized && "rounded-2xl")}>
        <ProgramCta category={category} emphasized={emphasized} />
      </div>
    </div>
  );
}

/**
 * 분류별 CTA.
 *
 * 요청서 §7은 조직·기업을 "기업교육 상세 페이지", 정규를 "정규 과정 상세
 * 페이지"로 보내라고 했지만 두 페이지는 이번 범위에서 제외됐다(사용자 결정).
 * 그래서 **라벨을 요청서 문구 그대로 두지 않았다** — 없는 페이지를 가리키는
 * `자세히 보기`는 클릭하기 전까지 알 수 없는 거짓말이 된다. 대신 지금 실제로
 * 할 수 있는 행동(문의·아래 목록)으로 보낸다. 상세 페이지가 생기면 여기만
 * 바꾸면 된다.
 */
function ProgramCta({
  category,
  emphasized,
}: {
  category: EduCategoryId;
  emphasized: boolean;
}) {
  if (category === "org") {
    return (
      <CtaButton
        variant={emphasized ? "primary" : "secondary"}
        href={`#${educationSectionId.inquiry}`}
      >
        {orgTraining.cta.label}
      </CtaButton>
    );
  }

  if (category === "club") {
    return (
      <VibedaysModal>
        <button
          type="button"
          className="group inline-flex h-13 items-center justify-center gap-2 rounded-full border-[1.25px] border-ink/70 px-7 text-[0.95rem] font-semibold text-ink transition-all outline-none hover:bg-ink hover:text-ivory focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
        >
          클럽 알아보기
          <ArrowUpRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </button>
      </VibedaysModal>
    );
  }

  return (
    <CtaButton
      variant={emphasized ? "primary" : "secondary"}
      href={`#${educationSectionId.inquiry}`}
    >
      정규 과정 문의하기
    </CtaButton>
  );
}

function RegularClassRow({ item }: { item: RegularClass }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white px-5 py-4">
      <span className="text-eyebrow text-ink/35">{item.index}</span>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold tracking-tight text-ink">{item.name}</p>
        <p className="truncate text-sm text-ink/60">{item.subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Tag className="border-ink/15 text-xs font-semibold text-ink/75">
          {item.duration}
        </Tag>
        <Tag className="border-ink/15 text-xs font-medium text-ink/60">
          {item.level}
        </Tag>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Sticky 패널 (데스크톱)
 * ---------------------------------------------------------------- */

function StickyPanel({ category }: { category: EduCategoryId }) {
  const highlight = getProgramHighlight(category);
  const accent = accentOf(category);
  const position = PROGRAM_ORDER.indexOf(category) + 1;

  if (!highlight) return null;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white">
      {/* 이미지 교체는 0.5~0.7초(§7·§15). key를 바꿔 새로 마운트시키면
          전환이 페이드가 아니라 깜빡임이 되므로, 같은 노드에 src만 바꾸고
          컨테이너에 transition을 건다. */}
      <div className="relative">
        <CoverVisual
          accent={accent}
          imageUrl={highlight.image.src}
          alt={highlight.image.alt}
          ratio="4/3"
          sizes="45vw"
          className="rounded-none transition-opacity duration-500"
        />
        <span className="absolute top-5 right-5 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-ivory tabular-nums">
          {String(position).padStart(2, "0")} / 03
        </span>
      </div>

      <dl className="flex flex-col gap-5 p-8">
        <PanelFact label="대상" value={highlight.audience} />
        <PanelFact label="방식" value={highlight.format} />
        <PanelFact label="결과물" value={highlight.outcome} />
      </dl>
    </div>
  );
}

function PanelFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-ink/10 pt-4 first:border-t-0 first:pt-0">
      <dt className="text-eyebrow text-ink/40">{label}</dt>
      <dd className="text-base leading-relaxed text-ink/80 transition-opacity duration-500">
        {value}
      </dd>
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * 모바일 카드
 * ---------------------------------------------------------------- */

function MobileCard({
  category,
  emphasized,
  classes,
}: {
  category: EduCategoryId;
  emphasized: boolean;
  classes: RegularClass[];
}) {
  const copy = COPY[category];
  const highlight = getProgramHighlight(category);
  const accent = accentOf(category);

  return (
    <article
      id={ANCHOR[category]}
      className={cn(
        "scroll-mt-32 overflow-hidden rounded-3xl border bg-white transition-colors",
        emphasized ? "border-ink/30" : "border-ink/10",
      )}
    >
      {highlight ? (
        <CoverVisual
          accent={accent}
          imageUrl={highlight.image.src}
          alt={highlight.image.alt}
          ratio="16/9"
          sizes="100vw"
          className="rounded-none"
        />
      ) : null}

      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-ink/40">{copy.index}</span>
          <span
            aria-hidden
            className={cn("size-2 rounded-full", accentBg[accent])}
          />
        </div>

        <h3 className="text-2xl leading-tight font-extrabold tracking-tight text-ink">
          {copy.title}
        </h3>
        <p className="text-base leading-relaxed text-ink/70">
          {copy.description}
        </p>

        {highlight ? (
          <dl className="mt-2 flex flex-col gap-3 rounded-2xl bg-ivory p-5">
            <PanelFact label="대상" value={highlight.audience} />
            <PanelFact label="방식" value={highlight.format} />
            <PanelFact label="결과물" value={highlight.outcome} />
          </dl>
        ) : null}

        {category === "regular" ? (
          <ul className="flex flex-col gap-2">
            {classes.map((item) => (
              <li
                key={item.slug}
                className="flex items-center gap-3 rounded-xl border border-ink/10 px-4 py-3"
              >
                <span className="text-eyebrow text-ink/35">{item.index}</span>
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">
                  {item.name}
                </span>
                <span className="shrink-0 text-sm text-ink/55">
                  {item.duration}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-2">
          <ProgramCta category={category} emphasized={emphasized} />
        </div>
      </div>
    </article>
  );
}

