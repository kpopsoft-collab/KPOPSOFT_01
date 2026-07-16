import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CtaButton } from "@/components/ui/cta-button";
import { sectionId } from "@/lib/site";

/**
 * B2B / Custom Training (docs/디자인.md §8 "CUSTOM TRAINING").
 *
 * The spec calls this out explicitly as "a large colored CTA panel" — one of
 * the deliberately saturated 15% moments in the 60/25/15 color budget, not
 * another neutral card. Dark navy is used (not blue) so it reads distinct
 * from the SOFTWARE block in business-overview.tsx while staying inside the
 * same flat-color system. All copy sits on ivory/white text for AA contrast
 * against the dark surface.
 */
export function B2bEducation() {
  return (
    <Section id={sectionId.b2b}>
      <div className="relative overflow-hidden rounded-3xl bg-brand-navy px-6 py-16 text-ivory sm:px-10 md:px-16 md:py-24">
        <div className="relative mx-auto max-w-2xl text-left md:text-left">
          <Eyebrow className="text-ivory/70" dotClassName="bg-brand-yellow">
            기업 맞춤형 교육
          </Eyebrow>

          <h2 className="text-section mt-6 text-ivory">
            귀사의 AI 활용 목표는 무엇인가요?
            <br />
            업무와 구성원 수준에 맞춰 교육을 설계합니다.
          </h2>

          <p className="mt-6 max-w-xl text-body-lg text-ivory/80">
            AI 입문부터 업무 활용, 자동화 구축까지 귀사의 실제 업무와 구성원의
            현재 수준을 바탕으로 맞춤형 과정을 진행합니다.
          </p>

          <div className="mt-10">
            <CtaButton
              href={`/?ct=${encodeURIComponent("교육 문의")}&cs=${encodeURIComponent(
                "기업 맞춤형 교육",
              )}#${sectionId.contact}`}
              variant="ivory"
              arrow
            >
              기업 교육 상담
            </CtaButton>
          </div>
        </div>
      </div>
    </Section>
  );
}
