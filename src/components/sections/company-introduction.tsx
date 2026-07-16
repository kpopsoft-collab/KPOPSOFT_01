import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Arch, Circle, Star, Wave } from "@/components/shapes";
import { sectionId } from "@/lib/site";

/**
 * Company Introduction (docs/기획서.md §5, docs/디자인.md §8 INTRODUCTION).
 *
 * "Use large text and small supporting paragraphs" — the headline runs wide
 * and dominant across the top, paragraphs sit small in a narrow right-hand
 * column beneath it, offset rather than centered. A cropped Arch anchors the
 * empty space under the headline; a small Ring/Plus pair mark the paragraph
 * column like editorial margin notes.
 */
export function CompanyIntroduction() {
  return (
    <Section id={sectionId.about} className="relative overflow-hidden">
      <Eyebrow dotClassName="bg-brand-blue">회사 소개</Eyebrow>

      <div className="relative mt-6 grid grid-cols-1 gap-10 lg:mt-10 lg:grid-cols-12 lg:gap-6">
        {/* Dominant headline — wide left column, occupies most of the width. */}
        <h2 className="text-section max-w-[18ch] text-ink lg:col-span-8">
          답답했던 문제에,
          <br />
          필요한 기술로 답합니다.
        </h2>

        {/* Cropped arch fills the empty lower-left gap under the short headline
            on desktop — kept clear of the right-hand paragraph column. */}
        <Arch
          className="pointer-events-none absolute bottom-0 left-0 -z-10 hidden size-36 text-brand-yellow/90 lg:block xl:size-44"
          aria-hidden
        />

        {/* Small supporting paragraphs — narrow column, offset to the right, sits below the headline's baseline. */}
        <div className="relative lg:col-span-4 lg:col-start-9 lg:mt-3">
          <div className="mb-6 flex items-center gap-4">
            <Circle className="size-6 text-brand-blue" aria-hidden />
            <Star className="size-7 text-brand-red" aria-hidden />
            <Wave className="h-6 w-[72px] text-brand-mint" aria-hidden />
          </div>
          <div className="max-w-[52ch] space-y-5 text-body-lg text-ink/70">
            <p>
              KPOPSOFT는 화려해 보이지만 실제 도움이 되지 않는 기술을 권하지
              않습니다. 고객이 해결하려는 문제와 기대하는 결과를 먼저 이해하고,
              필요한 해결책을 함께 만들어 갑니다.
            </p>
            <p>
              고객에게 필요한 소프트웨어를 개발하고, 고객사의 업무에 AI를 도입해
              실제로 사용할 수 있는 형태로 구현합니다.
            </p>
            <p>
              직접 구축하고 활용할 역량이 필요한 조직에는 현업 과제를 중심으로
              맞춤형 교육을 설계합니다.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
