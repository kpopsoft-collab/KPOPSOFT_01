import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CtaButton } from "@/components/ui/cta-button";
import type { RegularClass } from "@/lib/education-content";
import { route } from "@/lib/site";

import { ProgramCard } from "./program-card";

/**
 * 다른 정규 클래스 (백로그 06 03-화면구조-결정.md D6).
 *
 * 이 과정이 자기에게 안 맞는다고 판단한 사람에게 **이탈 말고 다른 길**을
 * 준다 — 지금까지 상세 페이지의 다음 행동은 맨 아래 문의 CTA 하나뿐이라
 * 막다른 길이었다(01-현황분석 §4).
 *
 * 목록 페이지의 `ProgramCard`를 그대로 쓴다. 같은 과정을 두 화면에서 다른
 * 모양으로 그리면 한쪽만 고쳐진다.
 *
 * 형제 과정이 하나도 없으면(과정이 이 하나뿐이거나 조회 실패) 섹션 자체를
 * 그리지 않는다 — 제목만 남고 아래가 빈 블록이 생기지 않게.
 */
export function ProgramRelated({ items }: { items: RegularClass[] }) {
  if (items.length === 0) return null;

  return (
    <Section className="bg-ivory">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow dotClassName="bg-brand-coral">OTHER PROGRAMS</Eyebrow>
          <h2 className="mt-4 text-2xl leading-snug font-extrabold tracking-tight text-ink md:text-3xl">
            다른 과정도 있어요
          </h2>
        </div>
        <CtaButton href={route.educationPrograms} variant="secondary">
          전체 과정 보기
        </CtaButton>
      </div>

      <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.slug} className="flex">
            <ProgramCard item={item} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
