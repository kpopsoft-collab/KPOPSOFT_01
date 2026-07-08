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

export default function Home() {
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
        <Experts />
        <SelectedWork />
        <Process />
        <B2bEducation />
        <Insights />
        <CompanyNumbers />
        <Testimonials />
        <Suspense>
          <FinalCta />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
