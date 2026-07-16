import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Blocks, Check, Cube, Lightbulb } from "@/components/shapes";
import { eduSectionId, howWeLearnItems } from "@/lib/education-content";
import { accentBg, accentOnDark, type Accent } from "@/lib/site";
import { cn } from "@/lib/utils";

const icons = [Lightbulb, Cube, Blocks, Check];
const accents: Accent[] = ["yellow", "blue", "red", "mint"];

/**
 * SECTION 07 — 교육 방식 (docs §12 "HOW WE LEARN").
 *
 * Four flat icon tiles rather than a plain checklist — each principle gets
 * its own accent-filled glyph from the shape system so "실습 > 강의",
 * "현업 과제 > 예제" etc. read as a small poster grid, not a bulleted list.
 */
export function HowWeLearn() {
  return (
    <Section id={eduSectionId.howWeLearn} className="bg-ivory">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-yellow">HOW WE LEARN</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          강의보다 실습,
          <br />
          수료보다 결과물.
        </h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
        {howWeLearnItems.map((item, i) => {
          const Icon = icons[i % icons.length];
          const accent = accents[i % accents.length];
          return (
            <article
              key={item.index}
              className="flex flex-col gap-5 rounded-3xl bg-white p-7"
            >
              <span
                className={cn(
                  "flex size-14 items-center justify-center rounded-2xl",
                  accentBg[accent],
                  accentOnDark[accent] ? "text-ivory" : "text-ink",
                )}
                aria-hidden
              >
                <Icon className="size-7" />
              </span>
              <div>
                <span className="text-sm font-semibold text-ink/40">
                  {item.index}
                </span>
                <h3 className="mt-1 text-lg font-extrabold tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-ink/70">{item.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
