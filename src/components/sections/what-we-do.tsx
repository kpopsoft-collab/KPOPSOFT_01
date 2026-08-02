import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CoverVisual } from "@/components/ui/cover-visual";
import { Circle, Star, Wave } from "@/components/shapes";
import { PillarExamplesModal } from "@/components/sections/pillar-examples-modal";
import type { PillarKey } from "@/lib/pillar-examples";
import type { PublicPillar, PublicPillarExample } from "@/lib/public-content";
import { accentText, route, sectionId } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * What We Do 세 기둥 (docs/KPOPSOFT_Home_Landing_ver2.md §SECTION 05).
 *
 * 사이트 태그라인 `SOFTWARE · AI SOLUTIONS · EDUCATION`을 그대로, 세 사업을
 * **동일 비중** 카드로 병렬 노출한다. 이전 버전은 Software/AI만 큰 탭·이미지·
 * 사례 모달로 무겁게 다뤄 Education이 빠지고 스캔이 안 됐다 — 여기서는 각 카드를
 * "커버 1장 + 정의 한 줄 + 대표 태그 + CTA"로 가볍게 통일해 한눈에 읽히게 한다.
 *
 * 포트폴리오 목업(사례 스토리)은 WORK(Selected Work) 섹션이 담당한다.
 */
/**
 * 카드의 **구조** — 문구·이미지·색은 DB(`home_pillars`)가 갖고, 여기 있는 것은
 * 콘텐츠가 아니라 화면 동작이다. 도형 아이콘과 "누르면 무엇이 열리는가"는
 * 바꾸려면 코드가 함께 바뀌어야 하므로 어드민 입력으로 내리지 않았다.
 */
type PillarShell = {
  /** 헤더 앵커(`/#software`)가 계속 동작하도록 유지하는 id. */
  id?: string;
  icon: React.ReactNode;
  /**
   * 있으면 카드 본문이 버튼이 되어 사례 모달을 연다. `bodyHref`와는 배타적 —
   * 한 카드가 두 동작을 가질 수는 없다.
   */
  hasExamples: boolean;
  /** 있으면 카드 본문 전체가 이 경로로 가는 링크가 된다. */
  bodyHref?: string;
  /** 사례 모달 안에 놓을 문의 CTA. */
  contact?: { label: string; href: string };
};

const SHELLS: Record<PillarKey, PillarShell> = {
  software: {
    id: sectionId.software,
    icon: <Circle className="size-7 shrink-0 text-brand-blue" aria-hidden />,
    hasExamples: true,
    contact: {
      label: "소프트웨어 문의하기",
      href: `/?ct=${encodeURIComponent("소프트웨어 개발")}#${sectionId.contact}`,
    },
  },
  ai: {
    id: sectionId.aiSolutions,
    icon: <Star className="size-7 shrink-0 text-brand-red" aria-hidden />,
    hasExamples: true,
    contact: {
      label: "AI 솔루션 문의하기",
      href: `/?ct=${encodeURIComponent("AI 솔루션")}#${sectionId.contact}`,
    },
  },
  // 교육은 상세가 별도 페이지에 있으므로 본문을 눌러도 그 페이지로 간다.
  education: {
    icon: <Wave className="size-7 shrink-0 text-brand-mint" aria-hidden />,
    hasExamples: false,
    bodyHref: route.education,
  },
};

export function WhatWeDo({
  pillars,
  examples,
}: {
  pillars: PublicPillar[];
  examples: PublicPillarExample[];
}) {
  return (
    <Section id={sectionId.whatWeDo} className="relative overflow-hidden">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-blue">핵심 비즈니스</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          소프트웨어부터 <span className="whitespace-nowrap">AI, 교육까지</span>
        </h2>
        {/* 요청서 §7 확정 보조 문구. 두 문장을 의미 단위로 끊어 준다. */}
        <p className="mt-6 text-body-lg text-ink/70">
          기업의 문제를 이해하고, 필요한 기술을 설계합니다.
          <br />
          소프트웨어 구축부터 AI 업무 자동화, 실무 교육까지 하나의 흐름으로
          제공합니다.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-20 lg:grid-cols-3 lg:items-stretch">
        {pillars.map((pillar) => (
          <PillarCard
            key={pillar.key}
            pillar={pillar}
            examples={examples.filter((e) => e.pillarKey === pillar.key)}
          />
        ))}
      </div>
    </Section>
  );
}

/**
 * 한 사업 카드 — 세 기둥 모두 같은 골격(타이틀 → 커버 → 정의 → 태그)으로
 * 동일 비중을 유지한다. `scroll-mt-24`로 고정 헤더 앵커 오프셋을 준다.
 *
 * 카드 하나에 동작은 하나다. 예전에는 본문(모달·교육 페이지)과 CTA(문의 폼)가
 * 서로 다른 곳으로 갈라져 어디를 눌러야 할지 모호했다 — CTA pill을 걷어내고
 * 카드 전체를 하나의 트리거로 통일했다. 클릭 유도는 타이틀 옆 화살표가 맡는다.
 */
function PillarCard({
  pillar,
  examples,
}: {
  pillar: PublicPillar;
  examples: PublicPillarExample[];
}) {
  const shell = SHELLS[pillar.key];

  const body = (
    <>
      <div className="flex items-center gap-3">
        {shell.icon}
        <h3
          className={cn(
            "text-2xl font-extrabold tracking-tight",
            accentText[pillar.accent],
          )}
        >
          {pillar.title}
        </h3>
        {/* 버튼 대신 남긴 클릭 유도 신호. 카드 전체가 이미 눌리는 영역이라
            문구 없이 화살표만 두고, hover에서 진해지며 살짝 움직인다. */}
        <ArrowUpRight
          className="ml-auto size-5 shrink-0 text-ink/35 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
          aria-hidden
        />
      </div>

      <CoverVisual
        accent={pillar.accent}
        imageUrl={pillar.imageUrl}
        alt={pillar.imageAlt}
        ratio="4/3"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        label={pillar.imageUrl ? undefined : pillar.title.toUpperCase()}
      />

      <p className="text-body-lg text-ink/70">{pillar.description}</p>

      {/* 다루는 범위(폭) 신호 — 버튼처럼 보이지 않게 가운뎃점으로 이은 담백한
          텍스트 한 줄로 둔다. 칩으로 만들면 누를 수 있는 것으로 읽힌다. */}
      <p className="text-sm leading-relaxed text-ink/50">
        {pillar.tags.join(" · ")}
      </p>
    </>
  );

  return (
    <div
      id={shell.id}
      className="flex scroll-mt-24 flex-col gap-5 rounded-3xl bg-white p-8"
    >
      {shell.hasExamples && examples.length > 0 ? (
        <PillarExamplesModal
          label={pillar.title}
          examples={examples}
          contact={shell.contact}
        >
          {/* 눌러서 여는 카드라는 신호는 커서·hover 배경과 타이틀 옆 화살표로
              준다. 카드 전체가 무엇을 여는 버튼인지는 `aria-label`로 밝힌다. */}
          <button
            type="button"
            aria-label={`${pillar.title} 예시 사례 ${examples.length}가지 보기`}
            className="group -m-2 flex cursor-pointer flex-col gap-5 rounded-3xl p-2 text-left transition-colors outline-none hover:bg-ink/[0.03] focus-visible:ring-3 focus-visible:ring-brand-blue/40"
          >
            {body}
          </button>
        </PillarExamplesModal>
      ) : shell.bodyHref ? (
        <Link
          href={shell.bodyHref}
          className="group -m-2 flex flex-col gap-5 rounded-3xl p-2 transition-colors outline-none hover:bg-ink/[0.03] focus-visible:ring-3 focus-visible:ring-brand-blue/40"
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}
