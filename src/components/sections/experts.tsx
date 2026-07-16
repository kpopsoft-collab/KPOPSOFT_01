import Image from "next/image";
import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { TagList } from "@/components/ui/tag";
import { Arch, Circle, Star } from "@/components/shapes";
import { accentBg, accentOnDark, accentText, sectionId } from "@/lib/site";
import type { PublicExpert } from "@/lib/public-content";
import { cn } from "@/lib/utils";

/** Rotating shape per row so each expert reads as a distinct person, not a repeated card. */
const portraitShapes = [Arch, Circle, Star] as const;

/**
 * Experts & Instructors (docs/기획서.md §2 no.8, docs/디자인.md §8 EXPERT NETWORK).
 *
 * §8 explicitly warns against generic corporate employee cards. Each expert
 * shows a real profile photo when one is provided (`expert.image`); until then
 * they fall back to a flat, full-accent monogram block (initial + a cropped
 * outline shape from the brand vocabulary) — a stylized "portrait" rather than
 * a gray stand-in. The philosophy quote — not the headshot — carries the
 * visual weight: it's
 * set large with an oversized decorative quotation glyph, echoing the big
 * faint index numerals used in Business Overview. Rows alternate portrait
 * left/right to read as an editorial list rather than a 3-up card grid.
 */
export function Experts({ experts }: { experts: PublicExpert[] }) {
  return (
    <Section id={sectionId.experts} className="relative overflow-hidden">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-navy">강사진 소개</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          가르치는 사람도
          <br />
          현업의 전문가입니다.
        </h2>
        <p className="mt-6 max-w-xl text-body-lg text-ink/70">
          실제 프로젝트를 만들어온 전문가와 강사진이, 현장에서 검증한 경험을
          그대로 전달합니다.
        </p>
      </div>

      <div className="mt-14 flex flex-col gap-10 lg:mt-20 lg:gap-0">
        {experts.map((expert, i) => {
          const reversed = i % 2 === 1;
          const PortraitShape = portraitShapes[i % portraitShapes.length];

          return (
            <article
              key={expert.name}
              className={cn(
                "flex flex-col gap-8 border-t border-ink/10 py-10 first:border-t-0 first:pt-0 lg:flex-row lg:items-center lg:gap-14",
                reversed && "lg:flex-row-reverse",
              )}
            >
              {/* Portrait — real photo when available, otherwise a flat accent
                  block with a monogram initial. */}
              <div
                className={cn(
                  "relative flex aspect-square w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl sm:w-36 lg:w-48",
                  accentBg[expert.accent],
                  accentOnDark[expert.accent] ? "text-ivory" : "text-ink",
                )}
              >
                {expert.image ? (
                  <Image
                    src={expert.image}
                    alt={expert.name}
                    fill
                    sizes="(min-width: 1024px) 12rem, (min-width: 640px) 9rem, 7rem"
                    className="object-cover"
                  />
                ) : (
                  <>
                    <span className="text-display leading-none" aria-hidden>
                      {expert.name.charAt(0)}
                    </span>
                    <PortraitShape
                      variant="outline"
                      className="pointer-events-none absolute -right-6 -bottom-6 size-20 opacity-30 lg:size-24"
                    />
                  </>
                )}
              </div>

              {/* Quote-first content — expertise carried by voice + tags, not a job-title card. */}
              <div className="relative flex-1">
                <span
                  className={cn(
                    "pointer-events-none absolute -top-8 left-0 text-7xl leading-none font-black opacity-15 select-none md:-top-10 md:text-8xl",
                    accentText[expert.accent],
                  )}
                  aria-hidden
                >
                  &ldquo;
                </span>
                <p className="relative text-xl leading-snug font-bold text-ink md:text-2xl">
                  {expert.quote}
                </p>

                <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-lg font-extrabold text-ink">
                    {expert.name}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      accentText[expert.accent],
                    )}
                  >
                    {expert.role}
                  </span>
                </div>

                <TagList tags={[...expert.tags]} className="mt-4" />
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
