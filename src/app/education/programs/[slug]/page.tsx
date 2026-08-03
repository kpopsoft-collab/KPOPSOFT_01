import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ProgramDetailHero } from "@/components/sections/education/programs/program-detail-hero";
import { ProgramDetailImage } from "@/components/sections/education/programs/program-detail-image";
import { CurriculumTimeline } from "@/components/sections/education/programs/curriculum-timeline";
import { CourseHtml } from "@/components/sections/education/programs/course-html";
import { ProgramInquiryCta } from "@/components/sections/education/programs/program-inquiry-cta";
import { route } from "@/lib/site";
import { getPublicRegularClassBySlug } from "@/lib/public-content";

/**
 * 정규 클래스 상세 페이지 (백로그 02 §3).
 *
 * `education_regular_classes.slug`를 URL 세그먼트로 쓴다. 없는 slug와
 * 비공개(`is_published=false`) 과정은 `getPublicRegularClassBySlug()`가 둘 다
 * `null`로 돌려준다 — RLS가 비공개 행을 이미 걸러 주므로 여기서 다시
 * `is_published`를 검사하지 않는다(요구사항 §3.1).
 *
 * `generateStaticParams`는 쓰지 않는다. 목록 페이지와 같은 이유로
 * `force-dynamic`을 둔다 — 어드민 수정이 새로고침으로 즉시 보여야 한다.
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
  // 처리하게 둔다(요구사항 §3.3).
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
  const item = await getPublicRegularClassBySlug(slug);
  if (!item) notFound();

  return (
    <>
      <Header />
      <main className="flex-1">
        <ProgramDetailHero item={item} />

        <ProgramDetailImage item={item} />

        <Section>
          <div className="mx-auto max-w-3xl">
            {item.detailHtml ? (
              // D1 — detailHtml이 있으면 그 본문을 쓴다. 정제·컨테인먼트는
              // CourseHtml 안에서 처리한다(release gate G2~G4).
              <CourseHtml html={item.detailHtml} />
            ) : (
              // detailHtml이 없으면 curriculum[] 기반 주차별 타임라인으로
              // 대체한다(D1 기본안 — "둘 다").
              <>
                <Eyebrow dotClassName="bg-brand-blue">CURRICULUM</Eyebrow>
                <h2 className="mt-4 text-2xl leading-snug font-extrabold tracking-tight text-ink md:text-3xl">
                  무엇을 배우나요
                </h2>
                <div className="mt-10">
                  <CurriculumTimeline items={item.curriculum} />
                </div>
              </>
            )}
          </div>
        </Section>

        {/*
          신청/문의 CTA — 목록 페이지의 CTA를 그대로 재사용한다(계획 지시).
          강사진·후기·FAQ 블록은 이 페이지에 만들지 않는다 — 요구사항 §3.2에
          "(선택)"으로만 돼 있고, 특히 후기는 `program` 필드가 자유 문자열이라
          이 과정과 정확히 매칭되는 기준이 없다. 잘못 매칭하면 다른 과정 후기가
          이 과정 것으로 오해되므로(계획 6단계 경고) 만들지 않고 보고에 남긴다.
        */}
        <ProgramInquiryCta />
      </main>
      <Footer />
    </>
  );
}
