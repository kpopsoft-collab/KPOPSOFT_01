import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { educationSectionId, route } from "@/lib/site";

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
 * 라우트 스텁 — 홈의 Education 배너가 링크할 대상이 먼저 존재해야 해서
 * 껍데기부터 세운다. §5의 16개 섹션은 이 자리에 순서대로 채워진다.
 */
export default function EducationPage() {
  return (
    <>
      <Header />
      <main id={educationSectionId.hero} className="flex-1">
        <section className="container-editorial py-24 md:py-32">
          <p className="text-eyebrow text-brand-mint">KPOPSOFT EDUCATION</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-ink md:text-6xl">
            배우는 데서 끝나지 않고,
            <br />
            직접 만들고 적용합니다.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink/70">
            AI 활용부터 Vibe Coding, 업무 자동화와 프로토타입 제작까지. 실제
            업무와 아이디어를 중심으로 직접 만들며 배우는 KPOPSOFT의 실무형 교육
            프로그램입니다.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
