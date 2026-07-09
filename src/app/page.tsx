import { Suspense } from "react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { CompanyIntroduction } from "@/components/sections/company-introduction";
import { BusinessOverview } from "@/components/sections/business-overview";
import { Software } from "@/components/sections/software";
import { AiSolutions } from "@/components/sections/ai-solutions";
import { Education } from "@/components/sections/education";
import { Experts } from "@/components/sections/experts";
import { SelectedWork } from "@/components/sections/selected-work";
import { Process } from "@/components/sections/process";
import { B2bEducation } from "@/components/sections/b2b-education";
import { Insights } from "@/components/sections/insights";
import { CompanyNumbers } from "@/components/sections/company-numbers";
import { Testimonials } from "@/components/sections/testimonials";
import { FinalCta } from "@/components/sections/final-cta";
import { sectionId } from "@/lib/site";
import {
  getPublicExperts,
  getPublicWork,
  getPublicInsights,
  getPublicTestimonials,
  getPublicStats,
  getPublicInquiryOptions,
} from "@/lib/public-content";

// Render per request so admin content edits (DB) reflect immediately, instead
// of being frozen into a build-time static page.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch all DB-backed public content server-side (falls back to site.ts seed
  // on empty/error) and pass it down — client sections can't fetch themselves.
  const [experts, work, insights, testimonials, stats, inquiryOptions] =
    await Promise.all([
      getPublicExperts(),
      getPublicWork(),
      getPublicInsights(),
      getPublicTestimonials(),
      getPublicStats(),
      getPublicInquiryOptions(),
    ]);

  return (
    <>
      <Header />
      <main id={sectionId.hero} className="flex-1">
        <Hero />
        <CompanyIntroduction />
        <BusinessOverview />
        <Software />
        <AiSolutions />
        <Education />
        <Experts experts={experts} />
        <SelectedWork items={work} />
        <Process />
        <B2bEducation />
        <Insights insights={insights} />
        <CompanyNumbers stats={stats} />
        <Testimonials testimonials={testimonials} />
        <Suspense>
          <FinalCta inquiryOptions={inquiryOptions} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
