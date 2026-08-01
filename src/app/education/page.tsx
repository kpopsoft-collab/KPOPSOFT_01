import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { EduHero } from "@/components/sections/education/edu-hero";
import { EduStats } from "@/components/sections/education/edu-stats";
import { Instructors } from "@/components/sections/education/instructors";
import { EduPrograms } from "@/components/sections/education/edu-programs";
import { PastPrograms } from "@/components/sections/education/past-programs";
import { Reviews } from "@/components/sections/education/reviews";
import { Faq } from "@/components/sections/education/faq";
import { InquiryForm } from "@/components/sections/education/inquiry-form";
import { educationSectionId, route } from "@/lib/site";
import { getPublicExperts } from "@/lib/public-content";

const title = "KPOPSOFT Education | AI 활용·Vibe Coding·기업 맞춤형 교육";
const description =
  "AI 업무 활용, Vibe Coding, 웹·앱 제작, 업무 자동화와 기업 맞춤형 교육을 제공합니다. 실제 업무와 아이디어를 중심으로 직접 만들고 적용하는 KPOPSOFT의 실무형 교육 프로그램입니다.";

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
    "조직 맞춤 교육",
    "기업 맞춤형 교육",
    "실무형 AI 교육",
    "웹·앱 제작 교육",
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
 * Education 페이지 (docs/KPOPSOFT_Education_Page_ver3.md §2).
 *
 * ver3에서 14개 섹션 → 8개로 압축했다. Hero가 3분류 소개를 겸하고, 프로그램
 * 정보 한 섹션 안에서 조직·기업 / 정규 클래스 / 커뮤니티 클럽이 각자 앵커를
 * 갖는다. VIBEDAYS는 섹션이 아니라 모달이다.
 *
 * 빠진 섹션(방문 목적 선택 · 교육 결과물 · 교육 방식 · 기업 맞춤형 교육 ·
 * 교육 진행 프로세스 · CTA 스플릿)의 컴포넌트 파일은 지우지 않았다 — 홈 ver2
 * 개편과 같은 방식으로 여기서 더 이상 불러오지 않을 뿐이다. 되돌리기 쉽고
 * diff가 작다.
 *
 * 강사진은 홈과 동일한 `getPublicExperts()`를 그대로 재사용해 데이터를
 * 페이지마다 중복 등록하지 않는다. 나머지 콘텐츠는 DB 스키마가 아직 없어
 * `src/lib/education-content.ts`를 읽는다 — 비어 있으면 각 섹션이 스스로 숨는다.
 */
export default async function EducationPage() {
  const experts = await getPublicExperts();

  return (
    <>
      <Header />
      <main id={educationSectionId.hero} className="flex-1">
        <EduHero />
        <EduStats />
        <Instructors experts={experts} />
        <EduPrograms />
        <PastPrograms />
        <Reviews />
        <Faq />
        <InquiryForm />
      </main>
      <Footer />
    </>
  );
}
