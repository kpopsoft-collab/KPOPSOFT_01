import { Section } from "@/components/layout/section";
import { CtaButton } from "@/components/ui/cta-button";
import { Circle, Star } from "@/components/shapes";
import { educationSectionId, route } from "@/lib/site";

/**
 * 목록 하단 문의 CTA (요구사항 §2.2 구성 마지막 줄).
 *
 * 이 페이지는 문의 폼을 새로 만들지 않는다 — `/education`의 기존 문의
 * 섹션(`InquiryForm`)으로 보낸다. 같은 폼을 두 번 만들면 둘 중 하나가
 * 낡은 채로 방치되기 쉽다. 패널 스타일은 `cta-split.tsx`의 조직·기업 패널과
 * 같은 flat color + 도형 방식을 따른다(그라데이션·그림자 금지).
 */
export function ProgramInquiryCta() {
  return (
    <Section className="bg-ivory">
      <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-ivory md:p-10">
        <Circle
          className="pointer-events-none absolute -top-8 -right-8 size-28 text-ivory/10"
          aria-hidden
        />
        <Star
          className="pointer-events-none absolute -bottom-6 left-1/3 size-16 text-ivory/10"
          aria-hidden
        />
        <div className="relative max-w-xl">
          <h2 className="text-2xl leading-snug font-extrabold tracking-tight md:text-3xl">
            어떤 과정이 맞는지 아직 잘 모르겠나요?
          </h2>
          <p className="mt-4 text-body-lg text-ivory/80">
            지금 하는 일과 목표를 알려 주시면 맞는 과정과 일정을 안내해
            드립니다.
          </p>
          <div className="mt-8">
            <CtaButton
              href={`${route.education}#${educationSectionId.inquiry}`}
              variant="ivory"
            >
              교육 문의하기
            </CtaButton>
          </div>
        </div>
      </div>
    </Section>
  );
}
