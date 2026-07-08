import { CtaButton } from "@/components/ui/cta-button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Arch, Capsule, Circle, Ring, Star, Wave } from "@/components/shapes";
import { sectionId, site } from "@/lib/site";

/**
 * Hero (docs/기획서.md §4, docs/디자인.md §7). An editorial poster: a large
 * asymmetric headline block on the left, a cropped/layered cluster of brand
 * shapes on the right. On mobile the shapes recompose below the copy rather
 * than shrinking the desktop layout (docs/디자인.md §11).
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="container-editorial">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:gap-8">
          {/* Copy block — occupies ~58% of the grid, left-aligned. */}
          <div className="max-w-2xl space-y-8 lg:col-span-7">
            <Eyebrow dotClassName="bg-brand-red">{site.tagline}</Eyebrow>

            <h1 className="text-display text-ink">
              아이디어를
              <br />
              작동하는 <span className="text-brand-blue">기술로.</span>
            </h1>

            <p className="text-body-lg max-w-[40ch] text-ink/70">
              {site.description}
            </p>

            <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
              <CtaButton variant="primary" href={`#${sectionId.contact}`}>
                프로젝트 시작하기
              </CtaButton>
              <CtaButton variant="secondary" href={`#${sectionId.education}`}>
                교육 프로그램 보기
              </CtaButton>
            </div>
          </div>

          {/* Shape composition — layered, cropped, asymmetric. Sits below the
              headline on mobile, to the right on desktop. */}
          <div
            className="relative mx-auto aspect-square w-full max-w-sm sm:max-w-md lg:col-span-5 lg:mx-0 lg:aspect-auto lg:h-[520px] lg:max-w-none"
            aria-hidden
          >
            <Circle className="absolute top-0 right-6 size-24 text-brand-yellow sm:size-32 lg:top-2 lg:right-10 lg:size-40" />
            <Ring className="absolute top-14 right-0 size-16 text-brand-sky sm:size-24 lg:top-24 lg:right-28 lg:size-28" />
            <Star className="absolute top-[38%] left-[18%] size-16 rotate-12 text-brand-red sm:size-20 lg:size-24" />
            <Capsule
              variant="outline"
              className="absolute right-2 bottom-28 w-24 text-brand-mint sm:w-32 lg:right-0 lg:bottom-36 lg:w-36"
            />
            <Wave className="absolute bottom-6 left-0 w-40 text-brand-navy sm:w-56 lg:bottom-10 lg:w-60" />
            <Arch className="absolute -bottom-6 -left-4 size-48 text-brand-blue sm:size-64 lg:bottom-0 lg:left-0 lg:size-80" />
          </div>
        </div>
      </div>
    </section>
  );
}
