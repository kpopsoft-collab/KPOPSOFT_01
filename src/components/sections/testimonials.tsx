import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Tag } from "@/components/ui/tag";
import { accentBg, accentOnDark, sectionId, testimonials, type Accent } from "@/lib/site";
import { cn } from "@/lib/utils";

/** One accent per strip so each row reads as a distinct voice, not a repeated card. */
const rows: { accent: Accent }[] = [
  { accent: "navy" },
  { accent: "yellow" },
  { accent: "coral" },
];

/**
 * Testimonials (docs/디자인.md §6 Testimonial Component).
 *
 * Rendered as flat, full-saturation horizontal bands — not the conventional
 * white card with a shadow and a round avatar photo. Each band is a
 * "rating-style row": a large faint index numeral stands in for a portrait,
 * the quote carries the typographic weight, and the program
 * + outcome sit in a single line at the bottom so the result reads like a
 * scorecard rather than a caption. Only one row (navy) needs light text;
 * the other two are lighter tints read fine with ink, keeping the section's
 * accent budget in check even though every row is a solid color.
 */
export function Testimonials() {
  return (
    <Section id={sectionId.testimonials} className="relative overflow-hidden">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-coral">고객 후기</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          함께 만든 결과가
          <br />
          이야기를 대신합니다.
        </h2>
      </div>

      <div className="mt-14 flex flex-col gap-6 lg:mt-20">
        {testimonials.map((testimonial, i) => {
          const { accent } = rows[i % rows.length];
          const onDark = accentOnDark[accent];

          return (
            <article
              key={testimonial.author}
              className={cn(
                "relative overflow-hidden rounded-3xl p-8 md:p-10 lg:flex lg:items-center lg:gap-10 lg:p-12",
                accentBg[accent],
                onDark ? "text-ivory" : "text-ink",
              )}
            >
              <div className="lg:w-32 lg:flex-none">
                <span className="text-display leading-none opacity-25" aria-hidden>
                  {`0${i + 1}`}
                </span>
              </div>

              <div
                className={cn(
                  "mt-8 lg:mt-0 lg:flex-1 lg:border-l lg:pl-10",
                  onDark ? "border-ivory/25" : "border-ink/15",
                )}
              >
                <blockquote className="text-2xl leading-snug font-bold tracking-tight md:text-3xl">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
                  <Tag
                    className={cn(
                      "border-transparent font-semibold",
                      onDark ? "bg-ivory/15 text-ivory" : "bg-ink/10 text-ink",
                    )}
                  >
                    {testimonial.program}
                  </Tag>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      onDark ? "text-ivory/75" : "text-ink/65",
                    )}
                  >
                    {testimonial.author}
                  </span>
                  <span className="ml-auto text-lg font-extrabold md:text-xl">
                    {testimonial.result}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
