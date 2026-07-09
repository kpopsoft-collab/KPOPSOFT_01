import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Section } from "@/components/layout/section";
import { Tag } from "@/components/ui/tag";
import { CoverVisual } from "@/components/ui/cover-visual";
import { sectionId } from "@/lib/site";
import { getPublicInsightBySlug } from "@/lib/public-content";

/**
 * Public blog-detail page (docs/어드민기획.md §4.2 — /insights/[slug]). Reads the
 * published insight from the DB by slug (site.ts fallback). Deep-links back to
 * the contact form with this article's topic preselected, mirroring the
 * Insights section's reading sheet.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const insight = await getPublicInsightBySlug(slug);
  if (!insight) return { title: "인사이트를 찾을 수 없습니다 — KPOPSOFT" };
  const title = insight.title.replace(/\n/g, " ");
  return { title: `${title} — KPOPSOFT`, description: insight.excerpt };
}

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const insight = await getPublicInsightBySlug(slug);
  if (!insight) notFound();

  const contactHref = `/?ct=${encodeURIComponent(
    insight.inquiry.type,
  )}&cs=${encodeURIComponent(insight.inquiry.subtype)}#${sectionId.contact}`;

  return (
    <>
      <Header />
      <main className="flex-1">
        <Section className="relative overflow-hidden">
          <article className="mx-auto max-w-2xl">
            <Link
              href={`/#${sectionId.insights}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-4" aria-hidden />
              인사이트 목록
            </Link>

            <CoverVisual
              accent={insight.accent}
              imageUrl={insight.imageUrl}
              alt={insight.title.replace(/\n/g, " ")}
              className="mt-8 h-48 md:h-56"
            />

            <div className="mt-8 flex items-center gap-3">
              <Tag>{insight.tag}</Tag>
              <span className="text-sm text-ink/50">{insight.date}</span>
            </div>

            <h1 className="text-section mt-4 text-ink text-balance break-keep">
              {insight.title.replace(/\n/g, " ")}
            </h1>

            <p className="text-body-lg mt-6 text-ink/70">{insight.excerpt}</p>

            <div className="mt-10 flex flex-col gap-5 border-t border-ink/10 pt-10">
              {insight.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-body-lg leading-relaxed text-ink/80"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-12 border-t border-ink/10 pt-8">
              <Link
                href={contactHref}
                className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-brand-blue px-7 text-[0.95rem] font-semibold text-white transition-colors hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                이 주제로 문의하기
                <ArrowRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </article>
        </Section>
      </main>
      <Footer />
    </>
  );
}
