import { ArrowUpRight } from "lucide-react";

import { CtaButton } from "@/components/ui/cta-button";
import { Tag } from "@/components/ui/tag";
import {
  eduTrackLabel,
  formatClassSchedule,
  type RegularClassDetail,
} from "@/lib/education-content";
import { educationSectionId, route } from "@/lib/site";

/**
 * 과정 요약 카드 (백로그 06 03-화면구조-결정.md D5).
 *
 * 조사에서 반복해 나온 "sticky enrollment card" — 과정의 핵심 사실과 다음
 * 행동을 **한 카드에 묶어** 스크롤 내내 붙여 둔다(02-조사 §3-4). 지금까지
 * 기간·난이도·일정·트랙은 히어로에만 있어서, 커리큘럼을 읽는 동안에는
 * "몇 주짜리였지"를 다시 볼 방법이 없었다.
 *
 * 배경은 흰색이다 — accent 원색은 히어로가 이미 쓰고 있고, 한 화면에 원색
 * 패널을 둘 이상 두지 않는다(03 §2 블록별 규칙).
 *
 * sticky는 `lg` 이상에서만 건다. 그 미만은 1단이라 붙일 옆자리가 없고,
 * 모바일의 상시 CTA는 `ProgramMobileCta`(하단 고정 바)가 담당한다.
 */
export function ProgramSummaryCard({ item }: { item: RegularClassDetail }) {
  // 일정 표기는 목록 카드·어드민과 같은 함수를 쓴다(release gate G5).
  const schedule = formatClassSchedule(item);

  return (
    <aside className="rounded-3xl border border-ink/10 bg-white p-7 md:p-8 lg:sticky lg:top-24">
      <h2 className="text-eyebrow text-ink/50">과정 정보</h2>

      <dl className="mt-5 divide-y divide-ink/10">
        <Row label="기간" value={item.duration} />
        <Row label="난이도" value={item.level} />
        {/*
          일정이 없을 때 항목을 감추지 않는다. 빈칸은 "정보가 없다"가 아니라
          "확인하지 못했다"로 읽힌다 — 상시 모집 과정이라는 사실을 화면이
          직접 말해 준다(03 §2 "일정 표기 — 빈 값을 감추지 않는다").
        */}
        <Row label="일정" value={schedule ?? "상시 모집 · 문의 시 안내"} />
      </dl>

      <div className="mt-6">
        <h3 className="text-eyebrow text-ink/50">트랙</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {item.tracks.map((track) => (
            <li key={track}>
              <Tag className="border-ink/15 text-xs font-semibold text-ink/75">
                #{eduTrackLabel[track]}
              </Tag>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <CtaButton
          href={`${route.education}#${educationSectionId.inquiry}`}
          className="w-full"
        >
          교육 문의하기
        </CtaButton>

        {/*
          상세 자료는 새 탭이다(백로그 05 D2). `CtaButton`은 외부 링크에
          `rel="noreferrer"`만 붙이는데 여기는 `noopener`도 필요해서
          `program-bundle-link.tsx`와 같은 이유로 `<a>`를 직접 쓴다.
        */}
        {item.bundleUrl ? (
          <a
            href={item.bundleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-full border-[1.25px] border-ink/70 px-7 text-[0.95rem] font-semibold whitespace-nowrap text-ink transition-colors outline-none hover:bg-ink hover:text-ivory focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
          >
            상세 자료 보기
            <span className="sr-only"> (새 창에서 열림)</span>
            <ArrowUpRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </a>
        ) : null}
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-sm font-semibold text-ink/55">{label}</dt>
      <dd className="text-right text-base font-semibold text-ink">{value}</dd>
    </div>
  );
}
