import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { WorkGrid } from "@/components/sections/selected-work";
import { sectionId } from "@/lib/site";
import { getPublicWork, getPublicInquiryOptions } from "@/lib/public-content";

/**
 * 전체 프로젝트 목록.
 *
 * 홈 PROJECTS 섹션 하단의 `전체 프로젝트 보기` CTA가 도착하는 곳이다. 홈은
 * 대표 사례를 보여주는 자리라 카드가 늘어날수록 섹션이 길어지는데, 그렇다고
 * CTA가 갈 곳이 없으면 버튼이 장식이 된다.
 *
 * 카드와 상세 패널은 홈과 같은 `WorkGrid`를 쓴다 — 두 곳에서 생김새가
 * 갈라지지 않게 하기 위해서다. 다른 점은 분류 필터를 사례 수와 무관하게
 * 항상 연다는 것 하나뿐이다(목록을 보러 온 사람에게는 필터가 본론이다).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "프로젝트",
  description:
    "웹 서비스부터 업무 플랫폼과 AI 자동화 솔루션까지, KPOPSOFT가 만든 프로젝트 전체 목록입니다.",
};

export default async function WorkPage() {
  const [work, inquiryOptions] = await Promise.all([
    getPublicWork(),
    getPublicInquiryOptions(),
  ]);

  return (
    <>
      <Header />
      <main id={sectionId.hero} className="flex-1">
        <Section id={sectionId.work}>
          <div className="max-w-3xl">
            <Eyebrow dotClassName="bg-brand-blue">PROJECTS</Eyebrow>
            <h1 className="text-section mt-6 text-ink">
              아이디어를 현실로 만든 프로젝트
            </h1>
            <p className="mt-6 max-w-2xl text-body-lg text-ink/70">
              웹 서비스부터 업무 플랫폼과 AI 자동화 솔루션까지, 다양한 아이디어를
              실제로 사용할 수 있는 서비스로 구현합니다.
            </p>
          </div>

          <WorkGrid
            items={work}
            inquiryOptions={inquiryOptions}
            alwaysShowFilter
          />
        </Section>
      </main>
      <Footer />
    </>
  );
}
