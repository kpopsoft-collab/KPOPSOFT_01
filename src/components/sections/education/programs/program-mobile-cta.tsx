import Link from "next/link";

import { NewTabLink } from "@/components/ui/new-tab-link";
import { educationSectionId, route } from "@/lib/site";

/**
 * 모바일 하단 고정 CTA 바 (결정기록 06 03-화면구조-결정.md D5 / 02-조사 §3-6).
 *
 * 데스크톱의 sticky 요약 카드에 해당하는 모바일 대체물이다. 옆에 붙일 자리가
 * 없는 폭에서 요약 카드를 그대로 축소하지 않고 **다른 형태로 다시 짠다**
 * (`docs/04-design-system/12-모바일과-접근성.md`의 "데스크톱 축소판 금지").
 *
 * `lg` 이상에서는 렌더되지 않는다 — 요약 카드가 이미 화면에 붙어 있어서
 * 같은 버튼이 두 번 나오면 어느 쪽을 눌러야 할지 알 수 없다.
 *
 * ⚠️ 이 바는 `fixed`라 문서 흐름에서 빠진다. 마지막 섹션이 가리지 않도록
 * `[slug]/page.tsx`의 `<main>`이 바 높이만큼 `pb-*`를 갖는다 — 둘은 같이
 * 움직여야 한다.
 */
export function ProgramMobileCta({ bundleUrl }: { bundleUrl?: string }) {
  return (
    // 반투명 + blur(글래스모피즘)는 금지다(04-design-system/00 절대 규칙).
    // 불투명 ivory에 1px 경계선으로 띄운다.
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-ivory lg:hidden">
      <div className="flex items-center gap-3 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {bundleUrl ? (
          <NewTabLink
            href={bundleUrl}
            variant="secondary"
            size="compact"
            srSuffix=" 보기 (새 창에서 열림)"
            className="shrink-0 gap-1.5"
          >
            상세 자료
          </NewTabLink>
        ) : null}

        <Link
          href={`${route.education}#${educationSectionId.inquiry}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-brand-blue px-5 text-sm font-semibold text-white transition-colors outline-none hover:bg-brand-navy focus-visible:ring-3 focus-visible:ring-brand-blue/40"
        >
          교육 문의하기
        </Link>
      </div>
    </div>
  );
}
