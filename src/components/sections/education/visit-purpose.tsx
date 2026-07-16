import Link from "next/link";

import { Section } from "@/components/layout/section";
import { CoverVisual } from "@/components/ui/cover-visual";
import { educationSectionId } from "@/lib/site";
import { eduSectionId } from "@/lib/education-content";
import { cn } from "@/lib/utils";

const cardInteraction =
  "group flex flex-col overflow-hidden rounded-3xl bg-white transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

const cards = [
  {
    label: "개인 · 실무자 프로그램",
    headline: "AI를 업무에 활용하고, 웹과 프로토타입을 직접 만들어 봅니다.",
    cta: "교육 프로그램 보기",
    href: `#${educationSectionId.programs}`,
    image: "/education/education-practice-01.jpg",
    alt: "참가자가 실습 중 노트북 화면을 보며 직접 만들어보는 모습",
    accent: "mint" as const,
  },
  {
    label: "기업 맞춤형 교육",
    headline:
      "조직의 업무와 구성원 수준에 맞춰 강의, 워크숍, 프로젝트형 교육을 설계합니다.",
    cta: "기업 교육 알아보기",
    href: `#${educationSectionId.b2b}`,
    image: "/education/education-workshop-01.jpg",
    alt: "기업 워크숍 현장에서 참가자들이 모여 협업하는 모습",
    accent: "navy" as const,
  },
];

/**
 * SECTION 03 — 방문 목적 선택 (docs §8).
 *
 * Two full-card links, image-first (§8 "이미지가 텍스트보다 먼저 보이도록
 * 구성") so a visitor can tell "개인" vs "기업" apart before reading a word.
 * Desktop 2열 / Mobile 1열 (§29).
 */
export function VisitPurpose() {
  return (
    <Section id={eduSectionId.purpose} className="bg-ivory">
      <div className="max-w-2xl">
        <h2 className="text-section text-ink">어떤 교육을 찾고 계신가요?</h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 lg:mt-20 lg:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={cn(cardInteraction)}
          >
            <CoverVisual
              accent={card.accent}
              imageUrl={card.image}
              alt={card.alt}
              ratio="4/3"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="rounded-none"
            />
            <div className="flex flex-1 flex-col gap-4 p-7 md:p-9">
              <span className="text-eyebrow text-ink/50">{card.label}</span>
              <p className="text-xl leading-snug font-bold text-ink md:text-2xl">
                {card.headline}
              </p>
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-brand-blue">
                {card.cta}
                <span
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden
                >
                  →
                </span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
