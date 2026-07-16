import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CtaButton } from "@/components/ui/cta-button";
import { CoverVisual } from "@/components/ui/cover-visual";
import { Check } from "@/components/shapes";
import { educationSectionId } from "@/lib/site";
import { orgTrainingDesignItems, orgTrainingFormats } from "@/lib/education-content";

/**
 * SECTION 08 — 기업 맞춤형 교육 (docs §13 "FOR ORGANIZATIONS").
 *
 * §13 explicitly wants photo + precise information over character graphics
 * here ("기업용 섹션에서는 캐릭터보다 사진과 정확한 정보 우선") — so this is
 * a real workshop photo beside two dense information blocks (교육 형태 /
 * 맞춤 설계 항목), not a colored poster panel like the home page's generic
 * B2bEducation CTA.
 */
export function OrgTraining() {
  return (
    <Section id={educationSectionId.b2b} className="bg-ivory">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-navy">FOR ORGANIZATIONS</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          조직의 실제 업무를
          <br />
          교육 과정으로 가져옵니다.
        </h2>
        <p className="mt-6 max-w-xl text-body-lg text-ink/70">
          구성원의 직무와 AI 활용 수준, 조직이 해결하고 싶은 업무 과제를
          바탕으로 강의, 워크숍, 프로젝트형 교육을 맞춤 설계합니다.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-8 lg:mt-20 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <CoverVisual
            accent="navy"
            imageUrl="/education/education-b2b-01.jpg"
            alt="기업 맞춤형 교육 워크숍에서 참가자들이 테이블에 모여 협업하는 모습"
            ratio="4/3"
            sizes="(max-width: 1024px) 100vw, 42vw"
          />
        </div>

        <div className="flex flex-col gap-8 lg:col-span-7">
          <div>
            <span className="text-eyebrow text-ink/50">교육 형태</span>
            <ul className="mt-4 flex flex-wrap gap-2">
              {orgTrainingFormats.map((format) => (
                <li
                  key={format}
                  className="rounded-full border border-ink/20 px-4 py-2 text-sm font-medium text-ink/80"
                >
                  {format}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="text-eyebrow text-ink/50">맞춤 설계 항목</span>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {orgTrainingDesignItems.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm font-medium text-ink/75"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-mint" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <CtaButton href={`#${educationSectionId.inquiry}`} variant="primary">
              기업 교육 상담하기
            </CtaButton>
          </div>
        </div>
      </div>
    </Section>
  );
}
