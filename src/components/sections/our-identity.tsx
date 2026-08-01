import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Circle, Star, Wave } from "@/components/shapes";
import { sectionId } from "@/lib/site";

/**
 * OUR IDENTITY (수정 요청서 §6) — 주요 성과 수치와 핵심 사업 영역 사이.
 *
 * 목적은 하나다. KPOPSOFT가 **K-POP 콘텐츠 제작사로 오해되지 않게** 하는 것.
 * 그래서 연혁이나 조직 소개가 아니라, 이름에 담긴 K-컬처의 확장성과 K-테크의
 * 실행력을 짧은 스토리로 전달한다.
 *
 * 시각 요소는 이미 쓰고 있는 세 도형(원·스파크·물결)만 쓴다 — 새 아이콘이나
 * 일러스트를 들이지 않는다(§6 디자인 방향). 세 도형은 브랜드 락업과 같은 색을
 * 쓰고(원 Blue / 스파크 Red / 물결 Mint), 요청서가 "Green Wave"라고 부른 것은
 * 기존 Mint를 가리킨다 — 새 초록을 추가하지 않는다.
 *
 * 핵심 비즈니스(What We Do) 카드와 시각적으로 겹치지 않게, 여기서는 커버
 * 이미지·태그·CTA 없이 "도형 + 한 줄 의미"만 세로로 쌓는다. 저쪽이 무엇을
 * 파는지 보여주는 카드라면, 이쪽은 그 셋이 왜 한 회사 안에 있는지를 말한다.
 */
const identityElements = [
  {
    shape: <Circle className="size-10 text-brand-blue" aria-hidden />,
    title: "Software",
    label: "Blue Circle",
    meaning: "아이디어를 안정적으로 구현하는 기술의 기반",
  },
  {
    shape: <Star className="size-10 text-brand-red" aria-hidden />,
    title: "AI Solutions",
    label: "Red Spark",
    meaning: "새로운 가능성을 빠르게 현실화하는 혁신",
  },
  {
    shape: <Wave className="w-12 text-brand-mint" aria-hidden />,
    title: "Education",
    /** 요청서 표기는 "Green Wave" — 색은 기존 Mint를 그대로 쓴다. */
    label: "Green Wave",
    meaning: "기술과 경험이 사람과 조직으로 확산되는 흐름",
  },
];

export function OurIdentity() {
  return (
    <Section id={sectionId.about}>
      {/* 데스크톱 2단(텍스트 좌 · 그래픽 우), 모바일은 제목 → 본문 → 그래픽
          의미 순서로 세로 배치된다(§6). 같은 DOM 순서라 별도 분기가 없다. */}
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <Eyebrow dotClassName="bg-brand-blue">OUR IDENTITY</Eyebrow>

          {/* 두 줄로 떨어져야 하는 제목인데, 2단 레이아웃의 좁은 컬럼에서
              `text-section`(최대 72px)은 세 줄로 쪼개진다. 컬럼 폭에 맞춘
              크기로 낮춘다. */}
          <h2 className="mt-6 text-[clamp(1.875rem,3vw,3rem)] leading-[1.15] font-extrabold tracking-tight text-ink">
            K-테크의 실행력
            <br />
            아이디어를 작동하는 기술로.
          </h2>

          <p className="mt-8 max-w-xl text-body-lg text-ink/70">
            KPOPSOFT는 세계와 연결되는 K-컬처의 확장성과 빠르게 구현하고
            발전시키는 K-테크의 실행력을 담은 이름입니다. 소프트웨어, AI 솔루션,
            교육을 통해 아이디어를 실제 현장에서 작동하는 기술과 경험으로
            만들어갑니다.
          </p>
        </div>

        <div className="lg:col-span-5">
          <ul className="flex flex-col gap-5">
            {identityElements.map((element) => (
              <li
                key={element.title}
                className="flex items-center gap-5 rounded-3xl bg-white p-6 md:p-7"
              >
                <span className="flex size-14 shrink-0 items-center justify-center">
                  {element.shape}
                </span>
                <div>
                  <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="text-lg font-extrabold tracking-tight text-ink md:text-xl">
                      {element.title}
                    </span>
                    <span className="text-eyebrow text-ink/50">
                      {element.label}
                    </span>
                  </p>
                  <p className="mt-1.5 text-base leading-relaxed text-ink/70">
                    {element.meaning}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
