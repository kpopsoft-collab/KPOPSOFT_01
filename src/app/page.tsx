import { Suspense } from "react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { AboutSummary } from "@/components/sections/about-summary";
import { SelectedWork } from "@/components/sections/selected-work";
import { WhatWeDo } from "@/components/sections/what-we-do";
import { EducationBanner } from "@/components/sections/education-banner";
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
 * Home (docs/KPOPSOFT_Home_Landing_ver2.md §5). ver2 압축한 8개 섹션:
 * Header → Hero → About Summary + Numbers → Selected Work → What We Do →
 * Education Banner → Contact → Footer.
 *
 * Education 상세(프로그램·강사진·후기·FAQ 등)는 `/education`으로 완전히
 * 옮겨갔다 — 그 콘텐츠를 그리던 섹션 컴포넌트(experts/education/process/
 * b2b-education/insights/testimonials/business-overview/company-*)는 지운
 * 게 아니라 이 페이지에서 더 이상 불러오지 않을 뿐이다(다른 트랙이 Education
 * 페이지에서 참고하거나, 나중에 되돌릴 수 있도록).
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
        <AboutSummary stats={stats} />
        <SelectedWork items={work} />
        <WhatWeDo />
        <EducationBanner />
        <Suspense>
          <FinalCta inquiryOptions={inquiryOptions} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
