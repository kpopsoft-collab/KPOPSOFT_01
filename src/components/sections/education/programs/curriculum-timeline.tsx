/**
 * 커리큘럼 주차별 타임라인 (요구사항 §3.2 D1) — `detailHtml`이 없는 과정이
 * 쓰는 기본 본문. 모바일에서도 세로 타임라인 하나로 그대로 두는 것이
 * `docs/04-design-system/12-모바일과-접근성.md` §11의 "다이어그램 → 세로
 * 타임라인" 원칙과 맞는다 — 별도 모바일 전용 레이아웃을 만들지 않는다.
 */
export function CurriculumTimeline({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <ol className="space-y-6">
      {items.map((item, index) => (
        <li key={item} className="flex gap-5">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-ivory"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="pt-2 text-body-lg text-ink/80">{item}</p>
        </li>
      ))}
    </ol>
  );
}
