import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { educationSectionId, route } from "@/lib/site";

/**
 * 상세 페이지 breadcrumb (결정기록 06 03-화면구조-결정.md D6).
 *
 * 검색으로 상세 페이지에 바로 들어온 사람에게 "여기가 어디인지"와 "위로
 * 올라가는 길"을 준다 — 지금까지 이 페이지에는 목록으로 돌아가는 링크가
 * 하나도 없었다(01-현황분석 §4).
 *
 * 마지막 항목은 링크가 아니라 현재 위치다. `aria-current="page"`를 붙여
 * 스크린리더가 "여기"라고 읽게 한다. 구분자 `›`는 장식이라 `aria-hidden`이다.
 */
export function ProgramBreadcrumb({ name }: { name: string }) {
  return (
    <nav aria-label="현재 위치" className="pt-8 md:pt-12">
      <div className="container-editorial">
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm font-semibold text-ink/50">
          <Crumb href={`${route.education}#${educationSectionId.programs}`}>
            교육
          </Crumb>
          <Separator />
          <Crumb href={route.educationPrograms}>정규 클래스</Crumb>
          <Separator />
          <li>
            {/* 현재 페이지 — 링크로 만들지 않는다. 자기 자신으로 가는 링크는
                스크린리더에서 목적지가 없는 링크로 읽힌다. */}
            <span aria-current="page" className="text-ink/80">
              {name}
            </span>
          </li>
        </ol>
      </div>
    </nav>
  );
}

function Crumb({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="inline-flex min-h-11 items-center rounded-full px-2 transition-colors outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-brand-blue/40"
      >
        {children}
      </Link>
    </li>
  );
}

function Separator() {
  return (
    <li aria-hidden className="text-ink/30">
      <ChevronRight className="size-3.5" />
    </li>
  );
}
