import { Suspense } from "react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { StatsBar } from "@/components/sections/stats-bar";
import { OurIdentity } from "@/components/sections/our-identity";
import { SelectedWork } from "@/components/sections/selected-work";
import { WhatWeDo } from "@/components/sections/what-we-do";
import { WhyKpopsoft } from "@/components/sections/why-kpopsoft";
import { Process } from "@/components/sections/process";
import { FinalCta } from "@/components/sections/final-cta";
import { sectionId } from "@/lib/site";
import {
  getPublicWork,
  getPublicStats,
  getPublicInquiryOptions,
} from "@/lib/public-content";

// Render per request so admin content edits (DB) reflect immediately, instead
// of being frozen into a build-time static page.
export const dynamic = "force-dynamic";

/**
 * Home. 최종 순서는 `KPOPSOFT_homepage_revision_request.md` §2를 따른다:
 * Header → Hero → 주요 성과 수치 → **OUR IDENTITY** → 핵심 사업 영역 →
 * 주요 프로젝트 → **WHY KPOPSOFT** → 프로젝트 진행 방식 → 문의 → Footer.
 *
 * 굵게 표시한 둘이 이번에 새로 추가된 섹션이다. 나머지 순서는 ver3 그대로다.
 *  - OUR IDENTITY — 이름에 담긴 의미를 밝혀 K-POP 콘텐츠 제작사로 오해되는
 *    것을 막는다. 헤더 `ABOUT` 앵커가 이 섹션으로 옮겨왔다.
 *  - WHY KPOPSOFT — 차별점 카드 3장과 5축 역량 레이더.
 *    **핵심 비즈니스와 포트폴리오 사이**에 둔다(docs/신규수정사항 §1).
 *    "무엇을 제공하는가" → "왜 우리인가" → "실제로 어떤 결과를 만들었는가"
 *    순서다. 처음에는 포트폴리오 뒤에 뒀었는데, 증명을 먼저 보여준 뒤에
 *    이유를 설명하는 거꾸로 된 흐름이었다.
 *
 * ver2 대비 바뀐 것.
 *  1. **순서** — 핵심 비즈니스(What We Do)가 포트폴리오보다 위로 올라갔다.
 *     "무엇을 만드는 회사인지"를 먼저 밝히고 사례로 증명하는 흐름(IA 기준).
 *  2. **통계바 분리** — About Summary에 붙어 있던 Numbers가 독립 섹션이 됐고,
 *     About 카피는 그 위 짧은 리드로 압축됐다(`stats-bar.tsx`).
 *
 * 아래 둘은 레포의 IA 원본(docs/KPOPSOFT HOMEPAGE IA .png)보다 나중에 나온
 * 개정안을 따른 것이라 ver3 문서와 어긋난다. 원본 IA/요약 문서가 갱신되면
 * 그때 맞춘다.
 *  3. **통계바가 핵심 비즈니스 위로** 올라갔다.
 *  4. **우리의 프로세스 신설** — 포트폴리오와 Contact 사이. 컴포넌트는 ver1의
 *     지그재그 다이어그램(`process.tsx`)을 그대로 되살렸다.
 *
 * Education 상세는 `/education`에 있고, 홈에서는 핵심 비즈니스의 교육 카드가
 * 유일한 진입점이다(ver2의 Education Banner 섹션은 여기에 흡수됐다).
 *
 * 더 이상 불러오지 않는 섹션 컴포넌트(about-summary/experts/education/
 * b2b-education/insights/testimonials/business-overview/company-*)는 지운 게
 * 아니라 이 페이지에서 import만 끊었다 — 되돌리기 쉽게.
 */
export default async function Home() {
  // Fetch DB-backed public content server-side (falls back to site.ts seed on
  // empty/error) and pass it down — client sections can't fetch themselves.
  const [work, stats, inquiryOptions] = await Promise.all([
    getPublicWork(),
    getPublicStats(),
    getPublicInquiryOptions(),
  ]);

  return (
    <>
      <Header />
      <main id={sectionId.hero} className="flex-1">
        <Hero />
        <StatsBar stats={stats} />
        <OurIdentity />
        <WhatWeDo />
        <WhyKpopsoft />
        <SelectedWork items={work} inquiryOptions={inquiryOptions} />
        <Process />
        <Suspense>
          <FinalCta inquiryOptions={inquiryOptions} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
