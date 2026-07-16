import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Tag } from "@/components/ui/tag";
import { eduReviews, eduSectionId } from "@/lib/education-content";
import { accentBg, accentOnDark } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * SECTION 12 — 고객 후기 (docs §17).
 *
 * A 3-up grid of flat accent quote cards — deliberately not the same
 * full-width stacked band treatment the home page's Testimonials section
 * uses (docs/디자인.md §8 warns against repeating one card shape everywhere),
 * even though the underlying "quote + program + who" shape is the same
 * Testimonial Component pattern from docs/디자인.md §6.
 */
export function Reviews() {
  if (eduReviews.length === 0) return null;

  return (
    <Section id={eduSectionId.reviews} className="bg-ivory">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-coral">REVIEWS</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          함께 만든 결과가
          <br />
          교육의 효과를 보여줍니다.
        </h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
        {eduReviews.map((review) => {
          const onDark = accentOnDark[review.accent];
          return (
            <article
              key={review.quote}
              className={cn(
                "flex flex-col gap-6 rounded-3xl p-8",
                accentBg[review.accent],
                onDark ? "text-ivory" : "text-ink",
              )}
            >
              <span className="text-5xl leading-none font-black opacity-25" aria-hidden>
                &ldquo;
              </span>
              <blockquote className="flex-1 text-lg leading-snug font-bold">
                {review.quote}
              </blockquote>
              <div className="flex flex-wrap items-center gap-2">
                <Tag
                  className={cn(
                    "border-transparent font-semibold",
                    onDark ? "bg-ivory/15 text-ivory" : "bg-ink/10 text-ink",
                  )}
                >
                  {review.program}
                </Tag>
                <span
                  className={cn(
                    "text-sm font-medium",
                    onDark ? "text-ivory/75" : "text-ink/65",
                  )}
                >
                  {review.industry}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
