import { CtaButton } from "@/components/ui/cta-button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Arch, Capsule, Circle, Ring, Star, Wave } from "@/components/shapes";
import { sectionId, site } from "@/lib/site";

/**
 * Hero (docs/KPOPSOFT_Home_Landing_ver2.md §SECTION 02/§3, docs/디자인.md §7).
 * An editorial poster: a large asymmetric headline block on the left, a
 * cropped/layered cluster of brand shapes on the right. On mobile the shapes
 * recompose below the copy rather than shrinking the desktop layout
 * (docs/디자인.md §11).
 *
 * 카피는 ver2를 따른다 — CTA는 `프로젝트 의뢰하기` 하나만 둔다(§3, 사례 보기
 * CTA 추가 금지). 다만 eyebrow는 §3이 지정한 `SOFTWARE · AI SOLUTIONS` 대신
 * 3개 사업을 모두 담은 site.tagline을 쓴다 — Education이 별도 페이지로
 * 분리됐어도 회사를 구성하는 세 꼭지라는 판단(브랜드 락업의 원·스파크·물결도
 * 셋을 함께 표현한다).
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="container-editorial">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:gap-8">
          {/* Copy block — occupies ~58% of the grid, left-aligned. */}
          <div className="max-w-2xl space-y-8 lg:col-span-7">
            <Eyebrow>{site.tagline}</Eyebrow>

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

          {/* Shape composition — layered, cropped, asymmetric. Sits below the
              headline on mobile, to the right on desktop.

              ver2 §2는 Hero 우측에 "실제 프로젝트 화면 3~4개"를 요구하지만,
              현재 확보된 실사 자산은 신도H렌탈 한 건뿐이다. 한 사이트를
              데스크톱·모바일로 두 번 배치하면 콜라주가 아니라 같은 화면의
              반복으로 읽혀 이 구성보다 약하다. 실사례가 3~4건 쌓이면 그때
              교체한다. 그때까지 유일한 실사 자산은 §4가 실제로 요구하는
              자리인 Selected Work 대표 카드에서 쓴다. */}
          <div
            className="relative mx-auto aspect-square w-full max-w-sm sm:max-w-md lg:col-span-5 lg:mx-0 lg:aspect-auto lg:h-[520px] lg:max-w-none"
            aria-hidden
          >
            <Circle className="absolute top-0 right-6 size-24 text-brand-yellow sm:size-32 lg:top-2 lg:right-10 lg:size-40" />
            <Ring className="absolute top-14 right-0 size-16 text-brand-sky sm:size-24 lg:top-24 lg:right-28 lg:size-28" />
            <Star className="absolute top-[38%] left-[18%] size-16 rotate-12 text-brand-red sm:size-20 lg:size-24" />
            <Capsule
              variant="outline"
              className="absolute right-2 bottom-28 w-24 text-brand-mint sm:w-32 lg:right-0 lg:bottom-36 lg:w-36"
            />
            <Wave className="absolute bottom-6 left-0 w-40 text-brand-navy sm:w-56 lg:bottom-10 lg:w-60" />
            <Arch className="absolute -bottom-6 -left-4 size-48 text-brand-blue sm:size-64 lg:bottom-0 lg:left-0 lg:size-80" />
          </div>
        </div>
      </div>
    </section>
  );
}
