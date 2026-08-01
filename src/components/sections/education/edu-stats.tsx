import { Section } from "@/components/layout/section";
import { eduSectionId, eduStats } from "@/lib/education-content";

/**
 * SECTION 03 — 통계바 (docs/KPOPSOFT_Education_Page_ver3.md §03).
 *
 * ver3 신설. 배경색을 깔아 위아래 섹션과 분리하고, Desktop 4열 / Mobile 2×2로
 * 접는다(§03). 수치는 아직 더미이므로 실제 값이 들어오면
 * `eduStats`(education-content.ts)만 갈아끼우면 된다.
 */
export function EduStats() {
  if (eduStats.length === 0) return null;

  return (
    <Section id={eduSectionId.stats} className="bg-brand-navy py-16 md:py-20">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {eduStats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2">
            <dt className="order-2 text-sm font-medium text-ivory/70 md:text-base">
              {stat.label}
            </dt>
            <dd className="order-1 text-4xl leading-none font-black tracking-tight text-ivory md:text-5xl">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
