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
          기술을 어렵게 설명하기보다
          <br />
          직접 작동하게 만듭니다.
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
              KPOPSOFT는 기업과 조직의 아이디어를 실제 서비스와 시스템으로
              구현합니다.
            </p>
            <p>
              웹 서비스와 모바일 앱, 기업용 소프트웨어와 디지털 플랫폼을
              개발하고, AI 기술을 업무 과정에 적용하여 반복 업무를 줄이고
              새로운 업무 방식을 만듭니다.
            </p>
            <p>
              또한 실제 프로젝트 경험을 가진 전문 강사진과 함께 AI와 디지털
              기술을 직접 활용할 수 있는 실무 교육 프로그램을 운영합니다.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
