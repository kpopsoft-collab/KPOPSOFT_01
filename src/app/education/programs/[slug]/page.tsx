import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ProgramBreadcrumb } from "@/components/sections/education/programs/program-breadcrumb";
import { ProgramDetailHero } from "@/components/sections/education/programs/program-detail-hero";
import { ProgramDetailImage } from "@/components/sections/education/programs/program-detail-image";
import { ProgramSummaryCard } from "@/components/sections/education/programs/program-summary-card";
import { CurriculumTimeline } from "@/components/sections/education/programs/curriculum-timeline";
import { ProgramBundleLink } from "@/components/sections/education/programs/program-bundle-link";
import { ProgramRelated } from "@/components/sections/education/programs/program-related";
import { ProgramMobileCta } from "@/components/sections/education/programs/program-mobile-cta";
import { ProgramInquiryCta } from "@/components/sections/education/programs/program-inquiry-cta";
import { route } from "@/lib/site";
import {
  getPublicRegularClassBySlug,
  getPublicRegularClassSiblings,
} from "@/lib/public-content";

/**
 * 정규 클래스 상세 페이지.
 *
 * `education_regular_classes.slug`를 URL 세그먼트로 쓴다. 없는 slug와
 * 비공개(`is_published=false`) 과정은 `getPublicRegularClassBySlug()`가 둘 다
 * `null`로 돌려준다 — RLS가 비공개 행을 이미 걸러 주므로 여기서 다시
 * `is_published`를 검사하지 않는다(결정기록 02 요구사항 §3.1).
 *
 * `generateStaticParams`는 쓰지 않는다. 목록 페이지와 같은 이유로
 * `force-dynamic`을 둔다 — 어드민 수정이 새로고침으로 즉시 보여야 한다.
 *
 * ## 화면 구조 (결정기록 06 03-화면구조-결정.md §2)
 *
 * 예전에는 본문이 **셋 중 하나**였다 — 업로드 HTML을 인라인으로 그리거나,
 * 번들 링크를 놓거나, 커리큘럼을 그리거나. 그 구조를 폐지했다. 이유 두 가지:
 *
 * 1. 정제기가 `<script>`·`@keyframes`·`position`을 지우므로, 완성된 문서
 *    한 장을 인라인으로 그리면 **빈 화면**이 된다(01-현황분석 §2 — 실제로
 *    29,435px 중 대부분이 빈 기둥이었다). 인라인 경로에 고칠 지점이 없다.
 * 2. 업로드가 있으면 커리큘럼이 통째로 사라졌다. 커리큘럼은 방문자가 수강을
 *    결정하는 근거라 조건부로 둘 수 없다(02-조사 §3-1).
 *
 * 그래서 지금은 **커리큘럼이 항상 있고**, 업로드물은 `bundleUrl` 하나로
 * 통일돼 "상세 자료" 블록에서 **새 탭**으로만 열린다.
 */
export const dynamic = "force-dynamic";

type PageParams = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicRegularClassBySlug(slug);
  // 없는 slug에서 throw하지 않는다 — 그러면 페이지의 notFound()가 뜨기 전에
  // 렌더 자체가 에러로 죽는다. 빈 메타데이터를 돌려주고 404는 페이지 본문이
  // 처리하게 둔다(결정기록 02 요구사항 §3.3).
  if (!item) return {};

  const title = item.seo.title || `${item.name} | KPOPSOFT Education`;
  const description = item.seo.description || item.description;
  const canonical = `${route.educationPrograms}/${item.slug}`;

  return {
    // 루트 레이아웃의 "%s | KPOPSOFT" 템플릿이 다시 붙지 않도록 absolute로
    // 고정한다 — seoTitle이 이미 완성된 문구다.
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      locale: "ko_KR",
      siteName: "KPOPSOFT",
      url: canonical,
      title,
      description,
      ...(item.image
        ? { images: [{ url: item.image.src, alt: item.image.alt }] }
        : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  // 형제 과정은 상세 조회와 독립이라 같이 기다린다. 순차로 부르면 두 왕복이
  // 그대로 더해진다. 형제 조회는 실패해도 빈 배열이라 여기서 처리할 것이 없다.
  const [item, siblings] = await Promise.all([
    getPublicRegularClassBySlug(slug),
    getPublicRegularClassSiblings(slug),
  ]);
  if (!item) notFound();

  return (
    <>
      <Header />
      {/*
        하단 고정 CTA 바가 `fixed`라 문서 흐름에서 빠진다. 그만큼 아래 여백을
        줘야 마지막 섹션이 가려지지 않는다(`ProgramMobileCta` 주석 참고).
        `lg`부터는 바가 사라지므로 여백도 없앤다.
      */}
      <main className="flex-1 pb-24 lg:pb-0">
        <ProgramBreadcrumb name={item.name} />
        <ProgramDetailHero item={item} />

        {/*
          비대칭 2단 — 본문 8칸 + 요약 카드 4칸(결정기록 06 D5,
          docs/04-design-system/04-그리드.md의 "asymmetric 2-column layouts").
          `lg` 미만은 1단이고, 요약 카드가 `order-first`로 본문 위에 올라온다 —
          기간·난이도·일정을 커리큘럼보다 먼저 봐야 하기 때문이다.
        */}
        <section className="pt-10 md:pt-14">
          <div className="container-editorial">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="flex flex-col gap-12 lg:col-span-8 lg:gap-16">
                <ProgramDetailImage item={item} />

                <div>
                  <Eyebrow dotClassName="bg-brand-mint">ABOUT</Eyebrow>
                  <h2 className="mt-4 text-2xl leading-snug font-extrabold tracking-tight text-ink md:text-3xl">
                    이 과정은
                  </h2>
                  <p className="mt-6 text-body-lg text-ink/75">
                    {item.description}
                  </p>
                </div>

                {/*
                  커리큘럼은 업로드물 유무와 무관하게 **항상** 그린다(D4).
                  데이터 자체가 비어 있을 때만 빠진다 — 그때는
                  CurriculumTimeline이 null을 돌려주므로 제목만 남지 않도록
                  여기서 같이 감춘다.
                */}
                {item.curriculum.length > 0 ? (
                  <div>
                    <Eyebrow dotClassName="bg-brand-blue">CURRICULUM</Eyebrow>
                    <h2 className="mt-4 text-2xl leading-snug font-extrabold tracking-tight text-ink md:text-3xl">
                      무엇을 배우나요
                    </h2>
                    <div className="mt-10">
                      <CurriculumTimeline items={item.curriculum} />
                    </div>
                  </div>
                ) : null}

                {/*
                  상세 자료는 본문을 **대체하지 않고** 본문 끝에 붙는다.
                  자료가 없어도 위의 커리큘럼만으로 페이지가 온전하다.
                */}
                {item.bundleUrl ? (
                  <ProgramBundleLink url={item.bundleUrl} />
                ) : null}
              </div>

              <div className="order-first lg:order-none lg:col-span-4">
                <ProgramSummaryCard item={item} />
              </div>
            </div>
          </div>
        </section>

        {/*
          강사진·후기 블록은 여기 만들지 않는다 — 후기는 `EduReview.program`이
          자유 문자열이라 이 과정 것이라고 판단할 기준이 없고, 잘못 매칭하면
          다른 과정 후기가 이 과정 것으로 오해된다(결정기록 06 02-조사 §4).
          대신 "다른 과정"으로 이탈 대신 다음 길을 준다(D6).
        */}
        <ProgramRelated items={siblings} />
        <ProgramInquiryCta />
      </main>
      <Footer />
      <ProgramMobileCta {...(item.bundleUrl ? { bundleUrl: item.bundleUrl } : {})} />
    </>
  );
}
