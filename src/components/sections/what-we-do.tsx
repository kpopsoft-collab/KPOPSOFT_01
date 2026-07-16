import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { TagList } from "@/components/ui/tag";
import { CoverVisual } from "@/components/ui/cover-visual";
import { Circle, Star } from "@/components/shapes";
import { businesses, sectionId } from "@/lib/site";
import { cn } from "@/lib/utils";

/** docs/KPOPSOFT_Home_Landing_ver2.md §SECTION 05 하단 프로세스 요약 문구. */
const processSteps = ["문제 정의", "서비스 설계", "디자인·개발", "테스트"];

/**
 * What We Do (docs/KPOPSOFT_Home_Landing_ver2.md §SECTION 05).
 *
 * Software와 AI Solutions를 하나의 섹션으로 통합하되, 헤더 메뉴가 `/#software`,
 * `/#ai-solutions`로 링크하므로 두 블록 각각에 그 id를 그대로 유지한다
 * (`scroll-mt-24`로 고정 헤더에 가리지 않게 오프셋을 준다). 비주얼은 실제
 * 스크린샷이 없는 항목이라 브랜드 도형 Placeholder로 "웹·앱·관리자 화면
 * 모듈"(Software)과 "입력→처리→결과 Workflow"(AI Solutions)를 표현한다(§5
 * 비주얼, docs/디자인.md §1 — 일러스트 대신 재사용 가능한 도형 시스템).
 */
export function WhatWeDo() {
  const [software, aiSolutions] = businesses;

  return (
    <Section id={sectionId.whatWeDo} className="relative overflow-hidden">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-blue">WHAT WE DO</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          필요한 기술을
          <br />
          하나의 프로젝트로 연결합니다.
        </h2>
        <p className="mt-6 text-body-lg text-ink/70">
          기획서가 완성되지 않아도 괜찮습니다. 해결할 문제와 사용자, 업무
          흐름을 함께 정리해 개발 가능한 제품과 솔루션으로 구체화합니다.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 lg:mt-20 lg:grid-cols-2 lg:items-stretch">
        {/* Software block — anchor id kept for the header's /#software link. */}
        <div
          id={sectionId.software}
          className="flex scroll-mt-24 flex-col gap-7 rounded-3xl bg-white p-8 md:p-10"
        >
          <div className="flex items-center gap-3">
            <Circle className="size-8 shrink-0 text-brand-blue" aria-hidden />
            <h3 className="text-2xl font-extrabold tracking-tight text-brand-blue md:text-3xl">
              Software
            </h3>
          </div>

          {/* "웹·앱·관리자 화면 모듈" — no real screenshots for these generic
              service tiles yet, so CoverVisual falls back to the brand-shape
              placeholder with a monogram + label. */}
          <div className="grid grid-cols-3 gap-2.5" aria-hidden>
            <CoverVisual accent="blue" ratio="3/4" monogram="W" label="Web" />
            <CoverVisual accent="navy" ratio="3/4" monogram="A" label="App" />
            <CoverVisual
              accent="sky"
              ratio="3/4"
              monogram="AD"
              label="Admin"
            />
          </div>

          <TagList tags={[...software.items]} />

          <p className="text-body-lg text-ink/70">
            아이디어와 요구사항을 정리하고 기획부터 디자인, 개발까지 한 번에
            구현합니다.
          </p>

          <Link
            href={`/?ct=${encodeURIComponent("프로젝트 문의")}#${sectionId.contact}`}
            className="group mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-full border-[1.25px] border-ink/70 px-6 py-3 font-semibold text-ink transition-colors hover:bg-ink hover:text-ivory focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
          >
            Software 제작 문의
            <ArrowUpRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </Link>
        </div>

        {/* AI Solutions block — anchor id kept for the header's /#ai-solutions link. */}
        <div
          id={sectionId.aiSolutions}
          className="flex scroll-mt-24 flex-col gap-7 rounded-3xl bg-white p-8 md:p-10"
        >
          <div className="flex items-center gap-3">
            <Star className="size-8 shrink-0 text-brand-red" aria-hidden />
            <h3 className="text-2xl font-extrabold tracking-tight text-brand-red md:text-3xl">
              AI Solutions
            </h3>
          </div>

          {/* "입력 → 처리 → 결과" workflow strip. */}
          <div className="flex items-center gap-2">
            {["입력", "처리", "결과"].map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div className="flex h-16 flex-1 items-center justify-center rounded-2xl border border-ink/10 bg-ivory text-sm font-semibold text-ink/60 md:h-20">
                  {label}
                </div>
                {i < 2 && (
                  <ArrowRight
                    className="size-4 shrink-0 text-brand-red/50"
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>

          <TagList tags={[...aiSolutions.items]} />

          <p className="text-body-lg text-ink/70">
            실험으로 끝나는 AI가 아니라 실제 조직에서 사용할 수 있는 업무
            도구로 구현합니다.
          </p>

          <Link
            href={`/?ct=${encodeURIComponent("AI 솔루션 문의")}#${sectionId.contact}`}
            className="group mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-full border-[1.25px] border-ink/70 px-6 py-3 font-semibold text-ink transition-colors hover:bg-ink hover:text-ivory focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
          >
            AI Solutions 문의
            <ArrowUpRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </div>

      <p className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-sm font-semibold text-ink/50 lg:mt-14">
        {processSteps.map((step, i) => (
          <span key={step} className={cn("flex items-center gap-3")}>
            {step}
            {i < processSteps.length - 1 && <span aria-hidden>→</span>}
          </span>
        ))}
      </p>
    </Section>
  );
}
