import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { EduHero } from "@/components/sections/education/edu-hero";
import { EduSubnav } from "@/components/sections/education/edu-subnav";
import { EduExploreProvider } from "@/components/sections/education/explore-context";
import { PurposeSelect } from "@/components/sections/education/purpose-select";
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
 * Education 페이지 (docs/KPOPSOFT_education_page_revision_request.md §2).
 *
 * 요청서가 확정한 순서다. ver3(8섹션) 대비 바뀐 것은 셋.
 *  1. **교육 목적 선택 신설** — ver3에서 히어로가 겸하던 3분류 소개를 독립
 *     섹션으로 꺼냈다. 히어로에서 세 갈래를 보여주고 여기서 또 보여주면
 *     어느 쪽이 진짜 입구인지 알 수 없어, 히어로 쪽을 걷어냈다.
 *  2. **강사진이 사례 뒤로** — ver3에서는 프로그램보다도 앞이었다. "누가
 *     가르치는가"는 "무엇을 배우는가"와 "실제로 무엇이 나왔는가"를 본 뒤에
 *     읽히는 정보라는 것이 요청서의 판단이다.
 *  3. **서브 내비게이션** — 전역 헤더 4메뉴는 그대로 두고, 페이지 안을 오가는
 *     바를 따로 둔다(§3, 사용자 결정). 역할이 다르므로 둘 다 있는 게 맞다.
 *
 * `EduExploreProvider`가 목적 선택과 프로그램 섹션을 감싼다 — 목적 카드를
 * 누르면 프로그램 섹션이 해당 분류를 강조하고 정규 과정을 트랙 순서로
 * 재정렬한다(§5). 두 섹션이 형제라 props로는 이어지지 않는다.
 *
 * 요청서가 지시한 기업교육·정규 과정 상세 페이지는 이번 범위에서 제외했다
 * (사용자 결정). 해당 CTA는 없는 페이지 대신 문의 섹션으로 보낸다.
 *
 * 페이지에서 빠진 섹션(교육 결과물 · 교육 방식 · 기업 맞춤형 교육 · 교육
 * 진행 프로세스 · CTA 스플릿)의 컴포넌트 파일은 지우지 않았다 — 여기서 더
 * 이상 불러오지 않을 뿐이다. 되돌리기 쉽고 diff가 작다.
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
        <EduSubnav />
        <EduExploreProvider>
          <PurposeSelect />
          <EduStats />
          <EduPrograms />
        </EduExploreProvider>
        <PastPrograms />
        <Instructors experts={experts} />
        <Reviews />
        <Faq />
        <InquiryForm />
      </main>
      <Footer />
    </>
  );
}
