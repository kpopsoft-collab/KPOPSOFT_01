"use client";

import { ArrowRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useEduExplore } from "@/components/sections/education/explore-context";
import { eduPurposes, eduSectionId } from "@/lib/education-content";
import { accentBg, accentText } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * 교육 목적 선택 (수정 요청서 §5).
 *
 * 프로그램 3분류가 "우리가 무엇을 파는가"라면, 이 섹션은 "당신은 어느
 * 쪽인가"다. 그래서 카드 문구가 프로그램 명칭과 일부러 다르다 — 처음 온
 * 사람은 `조직·기업 맞춤 교육`이라는 상품명보다 `기업·조직 교육`이라는
 * 자기 상황으로 자신을 먼저 찾는다.
 *
 * 카드는 3장인데 목적지는 2곳이다. `AI 입문`과 `실무 활용`은 같은 정규
 * 클래스로 가되 먼저 보이는 과정이 달라진다(`sortRegularClassesByTrack`).
 * 바이브데이즈는 목적이 아니라 지속형 활동이라 여기 없고, 프로그램 섹션에서
 * 따로 발견하게 둔다.
 *
 * 링크가 아니라 버튼인 이유 — 이동만 하는 게 아니라 도착지의 상태를 함께
 * 바꾼다. `<a>`로 두면 새 탭으로 열었을 때 정렬이 따라가지 않아 같은 조작이
 * 상황에 따라 다르게 동작한다.
 */
export function PurposeSelect() {
  const { purpose: selected, selectPurpose } = useEduExplore();

  return (
    <Section id={eduSectionId.purpose} className="bg-ivory">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-sky">교육 목적</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          어떤 교육을 찾고 계신가요?
        </h2>
      </div>

      <ul className="mt-14 grid grid-cols-1 gap-5 lg:mt-20 lg:grid-cols-3">
        {eduPurposes.map((purpose) => {
          const isSelected = selected?.id === purpose.id;

          return (
            <li key={purpose.id}>
              <button
                type="button"
                onClick={() => selectPurpose(purpose)}
                aria-pressed={isSelected}
                className={cn(
                  "group flex h-full w-full flex-col items-start gap-4 rounded-3xl border p-7 text-left transition-all duration-200 outline-none",
                  "focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory",
                  // Hover와 키보드 Focus가 같은 상태를 만든다(§5). 마우스로만
                  // 드러나는 정보가 있으면 키보드 사용자는 그 카드가 무엇을
                  // 하는지 끝까지 알 수 없다.
                  "hover:-translate-y-1 hover:bg-white focus-visible:-translate-y-1 focus-visible:bg-white",
                  isSelected
                    ? "border-ink/25 bg-white"
                    : "border-ink/10 bg-white/60",
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "size-2.5 rounded-full transition-transform duration-200 group-hover:scale-125",
                      accentBg[purpose.accent],
                    )}
                  />
                  <span className="text-eyebrow text-ink/40">
                    {purpose.index}
                  </span>
                </span>

                <span className="text-xl leading-tight font-extrabold tracking-tight text-ink md:text-2xl">
                  {purpose.title}
                </span>

                <span className="flex-1 text-base leading-relaxed text-ink/70">
                  {purpose.description}
                </span>

                <span
                  className={cn(
                    "mt-2 inline-flex items-center gap-2 text-sm font-semibold transition-colors",
                    isSelected ? accentText[purpose.accent] : "text-ink",
                  )}
                >
                  {isSelected ? "선택됨 · 프로그램 보기" : "프로그램 보기"}
                  <ArrowRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1"
                    aria-hidden
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
