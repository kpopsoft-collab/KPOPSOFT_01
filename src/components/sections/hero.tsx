import { CtaButton } from "@/components/ui/cta-button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CoverVisual } from "@/components/ui/cover-visual";
import { Circle, Star, Wave } from "@/components/shapes";
import { sectionId, site } from "@/lib/site";

/**
 * Hero (docs/KPOPSOFT_Home_Landing_ver2.md §SECTION 02/§3).
 *
 * ver2는 추상적인 AI 이미지 대신 실제 프로젝트 화면을 요구한다 — 지금 확보된
 * 유일한 실사 자산(신도H렌탈 데스크톱·모바일 스크린샷)을 우측 콜라주에 배치해
 * "데스크톱과 모바일 화면 콜라주" 구성을 그대로 따르고, 바로 아래 Selected
 * Work 섹션에서 같은 사례를 대표 카드로 다시 보여줘 자연스럽게 이어지도록
 * 한다("Hero 하단에 대표 프로젝트 이미지 일부가 보이도록 배치"). 브랜드 도형은
 * 여백을 채우는 보조 요소로만 쓰고(§9 "실제 이미지 60% / 텍스트·그래픽 40%"),
 * CTA는 `프로젝트 의뢰하기` 하나만 둔다(§3 — 사례 보기 CTA 추가 금지).
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="container-editorial">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:gap-8">
          {/* Copy block — occupies ~58% of the grid, left-aligned. */}
          <div className="max-w-2xl space-y-8 lg:col-span-7">
            <Eyebrow dotClassName="bg-brand-red">
              SOFTWARE · AI SOLUTIONS
            </Eyebrow>

            <h1 className="text-display text-ink">
              아이디어를
              <br />
              작동하는 <span className="text-brand-blue">기술로.</span>
            </h1>

            <div className="max-w-[46ch] space-y-4 text-body-lg text-ink/70">
              {site.description.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="pt-2">
              <CtaButton variant="primary" href={`#${sectionId.contact}`}>
                프로젝트 의뢰하기
              </CtaButton>
            </div>
          </div>

          {/* Real-project collage — sindohr.com desktop + mobile screens,
              layered with brand shapes for the remaining graphic texture. */}
          <div
            className="relative mx-auto aspect-[4/3] w-full max-w-sm sm:max-w-md lg:col-span-5 lg:mx-0 lg:aspect-auto lg:h-[520px] lg:max-w-none"
            aria-hidden
          >
            <Circle className="absolute top-0 right-6 size-12 text-brand-yellow sm:size-16 lg:top-2 lg:right-8 lg:size-20" />
            <Star className="absolute bottom-16 left-0 size-12 rotate-12 text-brand-red sm:size-14 lg:bottom-24 lg:size-16" />

            <CoverVisual
              accent="blue"
              imageUrl="/work/sindohr-desktop.jpg"
              alt="신도H렌탈 랜딩페이지 데스크톱 화면"
              ratio="16/9"
              priority
              sizes="(max-width: 1024px) 90vw, 42vw"
              className="absolute inset-x-0 top-0 w-full shadow-none lg:top-2"
            />

            <CoverVisual
              accent="mint"
              imageUrl="/work/sindohr-mobile.jpg"
              alt="신도H렌탈 랜딩페이지 모바일 화면"
              ratio="3/4"
              sizes="(max-width: 1024px) 40vw, 16vw"
              className="absolute -bottom-6 left-0 w-2/5 border-4 border-ivory shadow-none sm:w-1/3 lg:bottom-0 lg:w-[30%]"
            />

            <Wave className="absolute right-0 bottom-0 w-24 text-brand-navy sm:w-28 lg:w-32" />
          </div>
        </div>
      </div>
    </section>
  );
}
