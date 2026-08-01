import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CoverVisual } from "@/components/ui/cover-visual";
import { CtaButton } from "@/components/ui/cta-button";
import { Tag } from "@/components/ui/tag";
import { VibedaysModal } from "@/components/sections/education/vibedays-modal";
import {
  clubIntro,
  eduSectionId,
  orgTraining,
  type RegularClass,
  regularClassIntro,
  regularClasses,
} from "@/lib/education-content";
import { educationSectionId } from "@/lib/site";

/**
 * SECTION 05 — 교육 프로그램 정보 (docs/KPOPSOFT_Education_Page_ver3.md §05).
 *
 * ver3에서 평면 6개 프로그램 → 3분류로 재편됐다. 세 블록이 각자
 * `#program-org` / `#program-regular` / `#program-club` 앵커를 갖는다 — 홈
 * Contact의 교육 세부 유형이 이 앵커로 직접 넘어오기 때문에 id를 바꾸면
 * 홈 링크가 함께 깨진다.
 *
 * ver2의 프로그램 상세 Sheet는 없앴다. 상세는 `/education/programs/[slug]`
 * 페이지로 가고, 그 페이지는 2차 범위라 지금은 "준비 중"으로 처리한다(§7).
 */
export function EduPrograms() {
  return (
    <Section id={educationSectionId.programs} className="bg-ivory">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-blue">교육 프로그램</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          목적에 맞는 방식으로
          <br />
          배움 시작
        </h2>
      </div>

      <div className="mt-14 flex flex-col gap-20 lg:mt-20 lg:gap-28">
        <OrgBlock />
        <RegularBlock />
        <ClubBlock />
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- *
 * 01. 조직·기업 맞춤 교육
 * ---------------------------------------------------------------- */

function OrgBlock() {
  return (
    <div id={eduSectionId.programOrg} className="scroll-mt-24">
      <BlockLabel index="01" label="조직·기업 맞춤 교육" />

      <div className="mt-8 grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-6">
          <h3 className="text-2xl leading-tight font-extrabold tracking-tight text-ink md:text-3xl">
            {orgTraining.title}
          </h3>
          <p className="mt-5 text-body-lg whitespace-pre-line text-ink/70">
            {orgTraining.description}
          </p>

          <div className="mt-8">
            <CtaButton
              variant="primary"
              href={`#${educationSectionId.inquiry}`}
            >
              {orgTraining.cta.label}
            </CtaButton>
          </div>
        </div>

        <div className="lg:col-span-6">
          <CoverVisual
            accent="navy"
            imageUrl={orgTraining.image.src}
            alt={orgTraining.image.alt}
            ratio="4/3"
            sizes="(max-width: 1024px) 90vw, 45vw"
            className="rounded-[2rem]"
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * 02. 정규 클래스 — 4과정
 * ---------------------------------------------------------------- */

function RegularBlock() {
  return (
    <div id={eduSectionId.programRegular} className="scroll-mt-24">
      <BlockLabel index="02" label="정규 클래스" />

      <div className="mt-8 max-w-2xl">
        <h3 className="text-2xl leading-tight font-extrabold tracking-tight text-ink md:text-3xl">
          {regularClassIntro.title}
        </h3>
        <p className="mt-4 text-body-lg text-ink/70">
          {regularClassIntro.description}
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {regularClasses.map((item) => (
          <RegularClassCard key={item.slug} item={item} />
        ))}
      </div>
    </div>
  );
}

function RegularClassCard({ item }: { item: RegularClass }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-white">
      <CoverVisual
        accent={item.accent}
        imageUrl={item.image?.src}
        alt={item.image?.alt ?? ""}
        ratio="4/3"
        sizes="(max-width: 640px) 100vw, 45vw"
        className="rounded-none"
      />

      <div className="flex flex-1 flex-col gap-3 p-6 md:p-7">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-ink/40">{item.index}</span>
          <h4 className="text-xl font-extrabold tracking-tight text-ink">
            {item.name}
          </h4>
        </div>

        <p className="text-sm font-semibold text-ink/60">{item.subtitle}</p>
        <p className="flex-1 text-base leading-relaxed text-ink/70">
          {item.description}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Tag className="border-ink/15 font-semibold text-ink/75">
            {item.duration}
          </Tag>
          <Tag className="border-ink/15 font-medium text-ink/60">
            {item.level}
          </Tag>
        </div>

        {/*
          상세 페이지는 2차 범위(§7). 경로가 어디로 이어질지는 드러내되,
          아직 없는 페이지로 보내 404를 만들지 않도록 링크가 아닌 상태 표기로 둔다.
        */}
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink/40">
          상세 커리큘럼 준비 중
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- *
 * 03. 지식 공유 커뮤니티 클럽 / 바이브데이즈
 * ---------------------------------------------------------------- */

function ClubBlock() {
  return (
    <div id={eduSectionId.programClub} className="scroll-mt-24">
      <BlockLabel index="03" label="지식 공유 커뮤니티 클럽 / 바이브데이즈" />

      {/* 배경을 mint → yellow로 바꿨다. 키비주얼의 세 캐릭터 중 하나가 민트라
          같은 색 위에서 형태가 묻혔다. 노랑은 검은 터미널과 세 캐릭터(민트·빨강·
          파랑) 모두와 대비가 선다. */}
      <div className="mt-8 overflow-hidden rounded-[2rem] bg-brand-yellow">
        <div className="grid grid-cols-1 items-center gap-10 p-8 md:p-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="text-eyebrow text-ink/60">{clubIntro.eyebrow}</span>
            <h3 className="mt-4 text-2xl leading-tight font-extrabold tracking-tight text-ink md:text-3xl">
              {clubIntro.headline}
            </h3>
            <p className="mt-5 text-body-lg whitespace-pre-line text-ink/75">
              {clubIntro.cardSummary}
            </p>

            <div className="mt-8">
              <VibedaysModal>
                <button
                  type="button"
                  className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-ink px-7 text-[0.95rem] font-semibold text-ivory transition-all outline-none hover:bg-brand-navy focus-visible:ring-3 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-yellow"
                >
                  자세히 보기
                  <ArrowUpRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </button>
              </VibedaysModal>
            </div>
          </div>

          <div className="lg:col-span-5">
            {/* 4:3 커버로 자르지 않는다 — 원본이 2.4:1 가로형이라 잘리면
                터미널과 캐릭터가 화면 밖으로 밀린다. SVG는 옵티마이저를
                태우지 않고(`unoptimized`) 원본 비율 그대로 놓는다. */}
            <Image
              src={clubIntro.image.src}
              alt={clubIntro.image.alt}
              width={1469}
              height={607}
              unoptimized
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function BlockLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-4 border-t border-ink/15 pt-5">
      <span className="text-eyebrow text-ink/40">{index}</span>
      <h3 className="text-eyebrow text-ink">{label}</h3>
    </div>
  );
}
