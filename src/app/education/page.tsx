import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { EduHero } from "@/components/sections/education/edu-hero";
import { VisitPurpose } from "@/components/sections/education/visit-purpose";
import { EduPrograms } from "@/components/sections/education/edu-programs";
import { EduOutputs } from "@/components/sections/education/edu-outputs";
import { VibedaysClub } from "@/components/sections/education/vibedays-club";
import { HowWeLearn } from "@/components/sections/education/how-we-learn";
import { OrgTraining } from "@/components/sections/education/org-training";
import { EduProcess } from "@/components/sections/education/edu-process";
import { EduCases } from "@/components/sections/education/edu-cases";
import { Instructors } from "@/components/sections/education/instructors";
import { Reviews } from "@/components/sections/education/reviews";
import { Faq } from "@/components/sections/education/faq";
import { CtaSplit } from "@/components/sections/education/cta-split";
import { InquiryForm } from "@/components/sections/education/inquiry-form";
import { educationSectionId, route } from "@/lib/site";
import { getPublicExperts } from "@/lib/public-content";

const title = "KPOPSOFT Education | AI 활용·Vibe Coding·기업 맞춤형 교육";
const description =
  "AI 업무 활용, Vibe Coding, AI Prototype Lab과 기업 맞춤형 교육을 제공합니다. 실제 업무와 아이디어를 중심으로 직접 만들고 적용하는 KPOPSOFT의 실무형 교육 프로그램입니다.";

/** docs/KPOPSOFT_Education_Page_ver2.md §32. 루트 layout의 title 템플릿
 *  (`%s | KPOPSOFT`)이 붙지 않도록 absolute로 지정한다. */
export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: [
    "AI 교육",
    "기업 AI 교육",
    "생성형 AI 교육",
    "Vibe Coding 교육",
    "바이브 코딩 교육",
    "AI 업무 자동화 교육",
    "AI Prototype 교육",
    "기업 맞춤형 교육",
    "실무형 AI 교육",
    "웹 제작 교육",
  ],
  alternates: { canonical: route.education },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: route.education,
    siteName: "KPOPSOFT",
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
};

// 홈과 동일하게 요청마다 렌더 — 어드민 콘텐츠 수정이 즉시 반영되어야 한다.
export const dynamic = "force-dynamic";

/**
 * Education 페이지 (docs/KPOPSOFT_Education_Page_ver2.md).
 *
 * §5의 16개 섹션(Header/Footer 포함) 중 가운데 14개를 순서대로 배치한다.
 * 강사진은 홈과 동일한 `getPublicExperts()`를 그대로 재사용해 데이터를
 * 페이지마다 중복 등록하지 않는다(§28). 나머지 콘텐츠(프로그램·결과물·사례·
 * 후기·FAQ)는 DB 스키마가 아직 없어 `src/lib/education-content.ts`의
 * mock data를 그대로 읽는다(§33) — 비어 있으면 각 섹션이 스스로 숨는다.
 */
export default async function EducationPage() {
  const experts = await getPublicExperts();

  return (
    <>
      <Header />
      <main id={educationSectionId.hero} className="flex-1">
        <EduHero />
        <VisitPurpose />
        <EduPrograms />
        <EduOutputs />
        <VibedaysClub />
        <HowWeLearn />
        <OrgTraining />
        <EduProcess />
        <EduCases />
        <Instructors experts={experts} />
        <Reviews />
        <Faq />
        <CtaSplit />
        <InquiryForm />
      </main>
      <Footer />
    </>
  );
}
