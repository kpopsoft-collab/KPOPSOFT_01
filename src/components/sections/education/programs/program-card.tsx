import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { CoverVisual } from "@/components/ui/cover-visual";
import { Tag } from "@/components/ui/tag";
import {
  eduTrackLabel,
  formatClassSchedule,
  type RegularClass,
} from "@/lib/education-content";
import { route } from "@/lib/site";



/**
 * 과정 카드 하나 (요구사항 §2.2).
 *
 * 카드 전체를 `Link`로 감싼다 — 내부에 중첩 링크를 두지 않는다(계획 §3 카드
 * 주의사항). 서버 컴포넌트로 둔다 — 트랙 필터 상태만 클라이언트가 들고
 * 있으면 되고, 카드 자체는 상태가 없다.
 */
export function ProgramCard({ item }: { item: RegularClass }) {
  // 일정 표기는 어드민·상세 페이지와 같은 함수를 써야 문구가 갈라지지
  // 않는다(release gate G5). null이면 그 줄 자체를 뺀다.
  const schedule = formatClassSchedule(item);

  // 기본 목적지는 slug 상세다(D2). `detailHref`에 외부 주소가 들어 있을 때만
  // 그쪽으로 보낸다 — 사내 상세가 따로 있는 과정을 위한 예외 통로다.
  // 내부 경로를 적어 두면 무시한다. 그 축은 slug 하나로 통일했다.
  const external = /^https?:\/\//i.test(item.detailHref) ? item.detailHref : null;

  return (
    <Link
      href={external ?? `${route.educationPrograms}/${item.slug}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex w-full flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white text-left transition-colors outline-none hover:border-ink/30 focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
    >
      <CoverVisual
        accent={item.accent}
        imageUrl={item.image?.src}
        alt={item.image?.alt ?? item.name}
        ratio="16/9"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="rounded-none"
      />

      <div className="flex flex-1 flex-col gap-3 p-7 md:p-8">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-semibold text-ink/50">
          <span className="text-eyebrow text-ink/40">{item.index}</span>
          <span aria-hidden>·</span>
          <span>{item.duration}</span>
          <span aria-hidden>·</span>
          <span>{item.level}</span>
        </div>

        <div>
          <h3 className="text-xl leading-tight font-extrabold tracking-tight text-ink">
            {item.name}
          </h3>
          <p className="mt-1 text-sm font-semibold text-ink/60">
            {item.subtitle}
          </p>
        </div>

        <p className="line-clamp-2 text-base leading-relaxed text-ink/70">
          {item.description}
        </p>

        {/* 상시 모집 과정은 startDate/endDate가 없어 schedule이 null이다 —
            그 경우 이 줄이 통째로 빠진다(요구사항 §2.2). */}
        {schedule ? (
          <p className="text-sm font-semibold text-ink/70">{schedule}</p>
        ) : null}

        <ul className="flex flex-wrap gap-2">
          {item.tracks.map((track) => (
            <li key={track}>
              <Tag className="border-ink/15 text-xs font-semibold text-ink/75">
                #{eduTrackLabel[track]}
              </Tag>
            </li>
          ))}
        </ul>

        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-brand-blue">
          자세히 보기
          <ArrowUpRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
