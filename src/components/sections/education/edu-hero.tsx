import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { CtaButton } from "@/components/ui/cta-button";
import { CoverVisual } from "@/components/ui/cover-visual";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Ring, Star, Wave } from "@/components/shapes";
import { eduCategories } from "@/lib/education-content";
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
              배우며, 만들고
              <br />
              <span className="text-brand-blue">적용까지.</span>
            </h1>

            {/* 줄바꿈은 의미 단위로 고정한다 — "AI를 알고 / 시작할 수 있게"가
                한 호흡씩 읽히도록. */}
            <p className="text-body-lg max-w-[46ch] text-ink/70">
              누구나 쉽게 AI를 알고
              <br />
              시작할 수 있게 교육합니다.
            </p>

            <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
              <CtaButton
                variant="primary"
                href={`#${educationSectionId.inquiry}`}
              >
                무료 상담 신청하기
              </CtaButton>
              <CtaButton
                variant="secondary"
                href={`#${educationSectionId.programs}`}
              >
                교육 프로그램 보기
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
              <Wave className="absolute -bottom-8 left-1/4 w-28 text-brand-mint sm:w-32" />

              {/* SVG는 next/image 최적화를 태우지 않는다 — 옵티마이저가
                  `dangerouslyAllowSVG` 없이는 SVG를 거부한다. 우리 자산이므로
                  `unoptimized`로 원본을 그대로 내보낸다. */}
              <Image
                src="/assets/vibedays-role-master.svg"
                alt=""
                width={333}
                height={511}
                unoptimized
                className="absolute -right-6 -bottom-7 size-20 w-auto drop-shadow-[0_8px_20px_rgba(41,37,34,0.25)] sm:size-24"
              />
            </div>
          </div>
        </div>

        {/*
          3분류 소개 (docs/KPOPSOFT_Education_Page_ver3.md §02).
          Hero가 소개 섹션을 겸하므로, 세 분류를 여기서 동일 비중으로 노출하고
          각각 프로그램 정보의 해당 앵커로 보낸다.
        */}
        <ul className="mt-20 grid grid-cols-1 gap-5 md:mt-24 md:grid-cols-3">
          {eduCategories.map((category) => (
            <li key={category.id}>
              <a
                href={`#${category.anchor}`}
                className="group flex h-full flex-col gap-3 rounded-3xl border border-ink/10 bg-white p-7 transition-transform duration-200 outline-none hover:-translate-y-1 focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
              >
                <h2 className="text-lg font-extrabold tracking-tight text-ink">
                  {category.name}
                </h2>
                <p className="flex-1 text-base text-ink/70">
                  {category.description}
                </p>
                <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-ink">
                  자세히 보기
                  <ArrowRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
