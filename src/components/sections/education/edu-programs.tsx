"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CoverVisual } from "@/components/ui/cover-visual";
import { CtaButton } from "@/components/ui/cta-button";
import { Tag } from "@/components/ui/tag";
import { VibedaysModal } from "@/components/sections/education/vibedays-modal";
import { useEduExplore } from "@/components/sections/education/explore-context";
import {
  type ClubCohort,
  type ClubTier,
  type EduCategoryId,
  eduCategories,
  eduSectionId,
  getProgramHighlight,
  type OrgTraining,
  type RegularClass,
  sortRegularClassesByTrack,
} from "@/lib/education-content";
import { accentText, educationSectionId, route } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * 프로그램 (수정 요청서 §7).
 *
 * **세 프로그램을 같은 크기 카드로 나란히 놓는다.**
 *
 * 요청서 §7은 Sticky Scroll(왼쪽 스크롤 / 오른쪽 패널 교체)을 지정했고 한 번
 * 그렇게 만들었다가 되돌렸다(사용자 결정). 실제로 붙여 보니 두 가지가 걸렸다.
 *  - 세 프로그램을 **비교**하려면 셋이 동시에 보여야 하는데, sticky 구조는
 *    한 번에 하나만 보여준다. "목적에 맞는 프로그램을 선택하세요"라는 제목이
 *    요구하는 건 몰입이 아니라 비교다.
 *  - 오른쪽 패널이 스크롤에 따라 저절로 바뀌니, 방금 읽던 정보가 스크롤을
 *    조금만 움직여도 사라졌다. 사용자가 요청하지 않은 변화라 통제감이 없다.
 *
 * 그래서 자동으로 바뀌는 것을 전부 없앴다. 카드 안에 사진·설명·대상·CTA가
 * 모두 들어 있어 한 장이 그 자체로 완결된다. 데스크톱 3열,
 * 태블릿 이하에서 접힌다 — 모바일 구성이 따로 있는 게 아니라 같은 카드가
 * 세로로 쌓일 뿐이라 마크업이 하나로 줄었다.
 *
 * 목적 선택과의 연동은 남는다(§5). 고른 목적이 가리키는 카드에 테두리와
 * 배지를 얹고, 정규 과정 안의 4과정은 트랙 순서로 재정렬한다.
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

export function EduPrograms({
  regularClasses,
  orgTraining,
  cohorts,
  tiers,
}: {
  regularClasses: RegularClass[];
  orgTraining: OrgTraining;
  cohorts: ClubCohort[];
  tiers: ClubTier[];
}) {
  const { purpose, category: purposeCategory, clearPurpose } = useEduExplore();

  const classes = sortRegularClassesByTrack(purpose?.track, regularClasses);

  return (
    <Section id={educationSectionId.programs} className="scroll-mt-36 bg-ivory">
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
            맞는 프로그램을 표시했습니다.
          </span>
          <button
            type="button"
            onClick={clearPurpose}
            className="rounded-full px-3 py-1 text-sm font-semibold text-ink/60 underline underline-offset-4 transition-colors outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-brand-blue/40"
          >
            전체 보기
          </button>
        </div>
      ) : null}

      <ul className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-20 lg:grid-cols-3">
        {PROGRAM_ORDER.map((id) => (
          <li key={id} className="flex">
            <ProgramCard
              category={id}
              highlighted={purposeCategory === id}
              classes={classes}
              orgTraining={orgTraining}
              cohorts={cohorts}
              tiers={tiers}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function ProgramCard({
  category,
  highlighted,
  classes,
  orgTraining,
  cohorts,
  tiers,
}: {
  category: EduCategoryId;
  highlighted: boolean;
  classes: RegularClass[];
  orgTraining: OrgTraining;
  cohorts: ClubCohort[];
  tiers: ClubTier[];
}) {
  const copy = COPY[category];
  const highlight = getProgramHighlight(category);
  const accent = accentOf(category);

  return (
    <article
      id={ANCHOR[category]}
      className={cn(
        "flex w-full scroll-mt-36 flex-col overflow-hidden rounded-3xl border bg-white transition-colors",
        highlighted ? "border-ink/30" : "border-ink/10",
      )}
    >
      {highlight ? (
        highlight.fit === "contain" ? (
          /*
            그래픽은 잘라내지 않고 통째로 담는다. 사진은 잘려도 분위기가
            남지만, 키비주얼은 잘리는 순간 무엇을 그린 것인지 알 수 없다.
            비율(16/9)은 옆 카드와 맞춰 세 장의 이미지 높이를 같게 둔다.
          */
          <div
            className={cn(
              "flex aspect-[16/9] items-center justify-center overflow-hidden p-6",
              highlight.backdropClass,
            )}
          >
            <Image
              src={highlight.image.src}
              alt={highlight.image.alt}
              width={1469}
              height={607}
              // SVG는 옵티마이저가 `dangerouslyAllowSVG` 없이는 거부한다.
              // 우리 자산이므로 원본을 그대로 내보낸다.
              unoptimized
              className="h-auto max-h-full w-full object-contain"
            />
          </div>
        ) : (
          <CoverVisual
            accent={accent}
            imageUrl={highlight.image.src}
            alt={highlight.image.alt}
            ratio="16/9"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="rounded-none"
          />
        )
      ) : null}

      <div className="flex flex-1 flex-col gap-4 p-7 md:p-8">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-ink/40">{copy.index}</span>
          {highlighted ? (
            <span
              className={cn(
                "ml-auto rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold",
                accentText[accent],
              )}
            >
              찾으시는 교육
            </span>
          ) : null}
        </div>

        <h3 className="text-2xl leading-tight font-extrabold tracking-tight text-ink">
          {copy.title}
        </h3>

        <p className="text-base leading-relaxed text-ink/70">
          {copy.description}
        </p>

        {/* 정규 과정만 하위 4과정을 칩으로 노출한다. 목적을 고르면 해당 트랙이
            앞으로 온다 — 거르지는 않는다. */}
        {category === "regular" ? (
          <ul className="flex flex-wrap gap-2">
            {classes.map((item) => (
              <li key={item.slug}>
                <Tag className="border-ink/15 text-xs font-semibold text-ink/75">
                  {item.name}
                </Tag>
              </li>
            ))}
          </ul>
        ) : null}

        {highlight ? (
          <dl className="mt-auto flex flex-col gap-3 rounded-2xl bg-ivory p-5">
            <Fact label="대상" value={highlight.audience} />
          </dl>
        ) : null}

        <div className={cn(!highlight && "mt-auto", "pt-1")}>
          <ProgramCta
            category={category}
            highlighted={highlighted}
            orgTraining={orgTraining}
            cohorts={cohorts}
            tiers={tiers}
          />
        </div>
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-ink/10 pt-3 first:border-t-0 first:pt-0">
      <dt className="text-eyebrow text-ink/40">{label}</dt>
      <dd className="text-sm leading-relaxed text-ink/80">{value}</dd>
    </div>
  );
}

/**
 * 분류별 CTA.
 *
 * 요청서 §7은 세 분류를 각각 기업교육 상세 페이지 / 정규 과정 상세 페이지 /
 * 상세 모달로 보내라고 했다. 현재 상태는 이렇다.
 *  - 정규 과정 — `/education/programs`로 보낸다. 페이지는 아직 비어 있고
 *    내용은 다른 작업자가 채운다(사용자 지시). 라우트를 먼저 열어 뒀으므로
 *    404는 나지 않는다.
 *  - 바이브데이즈 — 상세 모달. 요청대로 동작한다.
 *  - 조직·기업 — 상세 페이지가 아직 없어 문의 섹션으로 보낸다. 없는 페이지를
 *    가리키는 `자세히 보기`는 클릭하기 전까지 알 수 없는 거짓말이 되므로,
 *    라벨도 지금 실제로 하는 일(문의)에 맞춰 뒀다.
 */
function ProgramCta({
  category,
  highlighted,
  orgTraining,
  cohorts,
  tiers,
}: {
  category: EduCategoryId;
  highlighted: boolean;
  orgTraining: OrgTraining;
  cohorts: ClubCohort[];
  tiers: ClubTier[];
}) {
  if (category === "regular") {
    return (
      <CtaButton
        variant={highlighted ? "primary" : "secondary"}
        href={route.educationPrograms}
        className="w-full"
      >
        정규 교육과정 알아보기
      </CtaButton>
    );
  }

  if (category === "club") {
    return (
      <VibedaysModal cohorts={cohorts} tiers={tiers}>
        <button
          type="button"
          className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-full border-[1.25px] border-ink/70 px-7 text-[0.95rem] font-semibold text-ink transition-all outline-none hover:bg-ink hover:text-ivory focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
      variant={highlighted ? "primary" : "secondary"}
      href={`#${educationSectionId.inquiry}`}
      className="w-full"
    >
      {orgTraining.cta.label}
    </CtaButton>
  );
}
