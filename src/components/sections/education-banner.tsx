import { CtaButton } from "@/components/ui/cta-button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/layout/section";
import { Circle, Star, Wave } from "@/components/shapes";
import { route, sectionId } from "@/lib/site";

/**
 * Education Banner (docs/KPOPSOFT_Home_Landing_ver2.md §SECTION 06).
 *
 * 교육 상세 콘텐츠(프로그램 목록·강사진·후기·FAQ 등)는 `/education`으로 완전히
 * 이동했다 — 홈에는 짧은 배너 하나만 남긴다. Mint는 브랜드 심볼 체계에서
 * Education을 뜻하는 색(§4 "초록 물결: Education")이라 이 배너에서만 채도
 * 있는 mint 패널을 쓴다(docs/디자인.md §8 "CUSTOM TRAINING: large colored CTA
 * panel"과 같은 어휘). 실제 교육 현장 사진은 아직 없어 물결·별·원 도형으로
 * 대신한다(§6 비주얼 목록 중 그래픽 항목).
 */
export function EducationBanner() {
  return (
    <Section id={sectionId.education}>
      <div className="relative overflow-hidden rounded-3xl bg-brand-mint px-6 py-14 text-ink sm:px-10 md:px-16 md:py-20">
        <Circle
          className="pointer-events-none absolute -top-10 -right-10 size-40 text-ink/10 md:size-56"
          aria-hidden
        />
        <Star
          className="pointer-events-none absolute right-[18%] bottom-6 hidden size-16 rotate-12 text-ink/10 md:block lg:size-24"
          aria-hidden
        />

        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-xl">
            <Eyebrow className="text-ink/60" dotClassName="bg-ink/70">
              KPOPSOFT EDUCATION
            </Eyebrow>

            <h2 className="text-section mt-6 text-ink">
              배우는 데서 끝나지 않고,
              <br />
              직접 만들고 적용합니다.
            </h2>

            <p className="mt-6 max-w-lg text-body-lg text-ink/75">
              AI 업무 활용부터 Vibe Coding, AI Prototype과 기업 맞춤형 교육까지
              실제 업무와 아이디어를 중심으로 진행합니다.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-6 md:items-end">
            <Wave className="w-28 text-ink/70 md:w-32" aria-hidden />
            <CtaButton href={route.education} variant="ivory">
              교육 프로그램 보기
            </CtaButton>
          </div>
        </div>
      </div>
    </Section>
  );
}
