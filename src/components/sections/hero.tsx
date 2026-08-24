import { CtaButton } from "@/components/ui/cta-button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Arch, Capsule, Circle, Ring, Star, Wave } from "@/components/shapes";
import { consultCta, sectionId, site } from "@/lib/site";

/**
 * Hero (docs/02-home/03-최종수정요청-섹션순서와-히어로.md §4,
 * docs/04-design-system/08-히어로-디자인.md).
 * An editorial poster: a large asymmetric headline block on the left, a
 * cropped/layered cluster of brand shapes on the right. On mobile the shapes
 * recompose below the copy rather than shrinking the desktop layout
 * (docs/04-design-system/ §11).
 *
 * 카피는 ver2를 따른다 — CTA는 `프로젝트 의뢰하기` 하나만 둔다(§3, 사례 보기
 * CTA 추가 금지). 다만 eyebrow는 §3이 지정한 `SOFTWARE · AI SOLUTIONS` 대신
 * 3개 사업을 모두 담은 site.tagline을 쓴다 — Education이 별도 페이지로
 * 분리됐어도 회사를 구성하는 세 꼭지라는 판단(브랜드 락업의 원·스파크·물결도
 * 셋을 함께 표현한다).
 */
/*
 * 하단 여백을 두지 않는다 — 도형 구성이 아래 네이비 성과 수치 박스에
 * 맞닿아야 두 섹션이 한 덩어리로 읽힌다. 아치는 컨테이너 아래로 조금 더
 * 내려가 경계에서 평평하게 잘린다(`overflow-hidden`).
 *
 * 대신 데스크톱에서는 카피 열에 같은 크기의 여백을 따로 준다. 글까지
 * 네이비에 붙으면 읽는 자리가 답답해지기 때문이다. 그래서 두 열의 정렬도
 * 가운데가 아니라 **바닥 기준**으로 바꿨다 — 가운데 정렬로 두면 카피
 * 여백만큼 도형 열이 위로 밀려 경계에서 떨어진다.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-24">
      <div className="container-editorial">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:items-end lg:gap-8">
          {/* Copy block — occupies ~58% of the grid, left-aligned. */}
          <div className="max-w-2xl space-y-8 lg:col-span-7 lg:pb-28">
            <Eyebrow>{site.tagline}</Eyebrow>

            <h1 className="text-display text-ink">
              아이디어를
              <br />
              작동하는 <span className="text-brand-blue">기술로.</span>
            </h1>

            {/* 요청서 §4: 데스크톱은 2줄 내외, 모바일은 문맥에 맞게 흘린다.
                좁은 화면에서는 46ch로 묶어 한 줄이 지나치게 길어지지 않게 하고,
                데스크톱에서는 컬럼 폭을 거의 다 써서 문장당 줄 수를 줄인다. */}
            <div className="max-w-[46ch] space-y-4 text-body-lg text-ink/70 lg:max-w-[62ch]">
              {site.description.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="pt-2">
              <CtaButton variant="primary" href={`#${sectionId.contact}`}>
                {consultCta.label}
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
            className="relative mx-auto aspect-square w-full max-w-sm sm:max-w-md lg:col-span-5 lg:mx-0 lg:max-w-none"
            aria-hidden
          >
            {/* 아치 — 구성의 무게중심. 좌하단에 앉혀 프레임 밖으로 잘리게 둔다.
                섹션 바닥까지 내려가 네이비 박스 경계에서 잘린다. 색은 그대로
                Blue다(사용자 지시) — 네이비 위로 넘기지 않고 맞닿기만 하므로
                대비 문제가 생기지 않는다. */}
            <Arch className="absolute -bottom-[9%] -left-[7%] h-auto w-[54%] text-brand-blue" />
            {/* 별 — 아치의 어깨에 얹어 둘을 한 덩어리로 읽히게 한다. */}
            <Star className="absolute top-[33%] left-[17%] h-auto w-[18%] rotate-12 text-brand-red" />
            {/* 원 + 링 — 서로 겹쳐 우상단의 한 덩어리를 만든다. */}
            <Circle className="absolute top-[4%] right-[10%] h-auto w-[30%] text-brand-yellow" />
            <Ring className="absolute top-[17%] right-[1%] h-auto w-[19%] text-brand-sky" />
            {/* 캡슐 — 링과 같은 세로축에 두어 우측 열을 만든다.
                네이비는 이 구성에서 유일하게 검정에 가까운 색이라 100%로 두면
                아치(주인공)보다 먼저 눈에 들어온다. 톤을 낮춰 같은 색 계열은
                유지하되 무게만 뺀다. */}
            <Capsule
              variant="outline"
              className="absolute top-[47%] right-[5%] h-auto w-[26%] text-brand-navy/45"
            />
            {/* 물결 — 아치의 오른쪽 경사에 붙여 하단을 잇는다. 이전에는 아치
                뒤에 깔려 아예 보이지 않았다. */}
            <Wave className="absolute bottom-[14%] right-[18%] h-auto w-[36%] text-brand-mint" />
          </div>
        </div>
      </div>
    </section>
  );
}
