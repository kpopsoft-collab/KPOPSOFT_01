import { Section } from "@/components/layout/section";
import { CtaButton } from "@/components/ui/cta-button";
import { Circle, Star } from "@/components/shapes";
import { educationSectionId } from "@/lib/site";

/**
 * SECTION 14 — 개인 신청 / 기업 상담 CTA (docs §19).
 *
 * Two clearly separate panels — personal programs vs. organizations — so the
 * two audiences from §2 never have to guess which CTA is "theirs". 개인 side
 * scrolls back up to the program list (no external application flow yet —
 * that's 2차 scope, §35); 기업 side scrolls down to the inquiry form.
 */
export function CtaSplit() {
  return (
    <Section className="bg-ivory">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-white p-8 md:p-10">
          <Circle className="pointer-events-none absolute -top-8 -right-8 size-24 text-brand-mint/20" />
          <h3 className="text-2xl leading-snug font-extrabold tracking-tight text-ink md:text-3xl">
            현재 참여할 수 있는
            <br />
            프로그램을 확인하세요.
          </h3>
          <p className="mt-4 max-w-sm text-body-lg text-ink/70">
            AI 활용, Vibe Coding, 웹·앱 제작 등의 모집 일정을
            확인할 수 있습니다.
          </p>
          <div className="mt-8">
            <CtaButton href={`#${educationSectionId.programs}`} variant="secondary">
              현재 모집 과정 보기
            </CtaButton>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-ivory md:p-10">
          <Star className="pointer-events-none absolute -top-6 -right-6 size-24 text-ivory/10" />
          <h3 className="text-2xl leading-snug font-extrabold tracking-tight md:text-3xl">
            우리 조직에 맞는
            <br />
            교육이 필요하신가요?
          </h3>
          <p className="mt-4 max-w-sm text-body-lg text-ivory/80">
            교육 대상, 인원, 업무 과제와 목표를 바탕으로 맞춤형 프로그램을
            제안합니다.
          </p>
          <div className="mt-8">
            <CtaButton href={`#${educationSectionId.inquiry}`} variant="ivory">
              기업 교육 상담하기
            </CtaButton>
          </div>
        </div>
      </div>
    </Section>
  );
}
