import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ProgramList } from "@/components/sections/education/programs/program-list";
import { ProgramEmptyState } from "@/components/sections/education/programs/program-empty-state";
import { ProgramInquiryCta } from "@/components/sections/education/programs/program-inquiry-cta";
import { route, sectionId } from "@/lib/site";
import { getPublicRegularClasses } from "@/lib/public-content";

/**
 * 정규 교육 과정 전체 목록.
 *
 * `/education` 프로그램 카드의 `정규 교육과정 알아보기` CTA가 도착하는 곳이다
 * (결정기록 02 §2.1). `/education` 안의 `edu-programs` 섹션은 정규 클래스를 교육
 * 3분류 중 하나로 "소개"만 하고, 이 페이지는 4과정을 나란히 놓고 **비교·선택**
 * 하게 한다 — 두 화면이 같은 일을 하면 하나가 곧 방치된다.
 *
 * `/work`가 홈 PROJECTS 섹션에 대해 하는 일과 같은 구조 모델이다
 * (`src/app/work/page.tsx` 참고): Header → 히어로 → 목록(+필터) → Footer.
 *
 * 이전에는 내용이 없는 빈 페이지라 `robots: { index: false }`로 검색 노출을
 * 막아 뒀다. 이제 실제 목록이 채워지므로 그 지시를 지운다 — 지우지 않으면
 * 어드민이 공개한 과정이 검색에는 영원히 나오지 않는다.
 */
export const dynamic = "force-dynamic";

const title = "정규 교육 과정";
const description =
  "AI 활용, Vibe Coding, 웹·앱 제작, 업무 자동화 — KPOPSOFT 정규 클래스 전체 목록입니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: route.educationPrograms },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: route.educationPrograms,
    siteName: "KPOPSOFT",
    title,
    description,
  },
};

export default async function EducationProgramsPage() {
  const classes = await getPublicRegularClasses();

  return (
    <>
      <Header />
      <main id={sectionId.hero} className="flex-1">
        <Section>
          <div className="max-w-2xl">
            <Eyebrow dotClassName="bg-brand-blue">PROGRAMS</Eyebrow>
            {/* 확정 카피(docs/03-education/08-ver3-프로그램-정보.md §5.2)를
                그대로 쓴다 — 새로 짓지 않는다. */}
            <h1 className="text-section mt-6 text-ink">
              정규 교육 과정
            </h1>
            <p className="mt-6 max-w-2xl text-body-lg text-ink/70">
              실무에 바로 쓰는 과정을 트랙별로 골라 보세요. 과정을 누르면 커리큘럼과
              일정을 자세히 볼 수 있습니다.
            </p>
          </div>

          {classes.length === 0 ? (
            <ProgramEmptyState />
          ) : (
            <ProgramList items={classes} />
          )}
        </Section>

        <ProgramInquiryCta />
      </main>
      <Footer />
    </>
  );
}
