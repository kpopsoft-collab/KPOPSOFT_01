import Image from "next/image";

import { CtaButton } from "@/components/ui/cta-button";
import { CoverVisual } from "@/components/ui/cover-visual";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Ring, Star, Wave } from "@/components/shapes";
import { educationSectionId } from "@/lib/site";

/**
 * SECTION 02 — Hero (docs/KPOPSOFT_Education_Page_ver2.md §7).
 *
 * Same editorial split as the home Hero (copy left, visual right — docs
 * §11 mobile rule: typography first, graphic recomposes below) but the
 * visual is a real training photo, not pure shapes: "Hero는 캐릭터보다
 * 실제 교육과 결과물이 중심이어야 합니다." VIBEDAYS characters + brand
 * shapes appear only as small supporting accents layered on the photo frame
 * (§3.2 — KPOPSOFT is the lead identity in the Hero).
 */
export function EduHero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="container-editorial">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:gap-10">
          <div className="max-w-2xl space-y-8 lg:col-span-7">
            <Eyebrow dotClassName="bg-brand-mint">KPOPSOFT EDUCATION</Eyebrow>

            <h1 className="text-display text-ink">
              배우는 데서 끝나지 않고,
              <br />
              직접 만들고 <span className="text-brand-blue">적용합니다.</span>
            </h1>

            <p className="text-body-lg max-w-[46ch] text-ink/70">
              AI 활용부터 Vibe Coding, 업무 자동화와 프로토타입 제작까지.
              실제 업무와 아이디어를 중심으로 직접 만들며 배우는 KPOPSOFT의
              실무형 교육 프로그램입니다.
            </p>

            <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
              <CtaButton
                variant="primary"
                href={`#${educationSectionId.programs}`}
              >
                교육 프로그램 보기
              </CtaButton>
              <CtaButton variant="secondary" href={`#${educationSectionId.b2b}`}>
                기업 교육 상담
              </CtaButton>
            </div>
          </div>

          {/* 실제 교육 현장 사진 — 캐릭터와 도형은 프레임 모서리에 얹히는
              보조 그래픽으로만 사용한다(§7). */}
          <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:mx-0 lg:max-w-none">
            <CoverVisual
              accent="mint"
              imageUrl="/education/education-hero.jpg"
              alt="KPOPSOFT 교육 현장에서 참가자들이 노트북으로 실습하는 모습"
              ratio="4/3"
              priority
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="rounded-[2rem] shadow-[0_24px_60px_-24px_rgba(41,37,34,0.35)]"
            />

            <div aria-hidden className="pointer-events-none contents">
              <Star className="absolute -top-6 -right-4 size-14 rotate-12 text-brand-yellow sm:size-16" />
              <Ring className="absolute top-1/3 -left-8 size-16 text-brand-sky sm:size-20" />
              <Wave className="absolute -bottom-8 left-1/4 w-28 text-brand-red sm:w-32" />

              <Image
                src="/assets/vibedays-vibe-maker.svg"
                alt=""
                width={96}
                height={96}
                className="absolute -bottom-7 -right-6 size-20 drop-shadow-[0_8px_20px_rgba(41,37,34,0.25)] sm:size-24"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
