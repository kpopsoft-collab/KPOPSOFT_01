import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * 어드민 콘텐츠 추가/수정 화면의 껍데기 — 목록으로 돌아가는 링크 + 제목.
 *
 * 같은 마크업이 폼 페이지 25개에 각자 복사돼 있었다. 한 벌로 모아 두면 화면마다
 * 여백과 글자 크기가 갈라지지 않고, 헤더를 고칠 때 한 곳만 고치면 된다.
 *
 * 여기서 말하는 셸은 페이지 *안쪽* 프레임이다. 사이드바·톱바를 포함한 어드민
 * 전역 크롬은 `src/app/admin/(shell)/layout.tsx`의 `AdminShellLayout` 쪽이다.
 *
 * 라우트는 합치지 않는다 — `/new`와 `/[id]`는 하는 일이 다르고(조회 유무),
 * 그 차이는 파일 경로에서 읽히는 편이 낫다.
 * 근거: backlogs/03-regular-class-form-merge/02-현황분석.md §4
 *
 * 서버 컴포넌트로 둔다. `"use client"`를 붙이면 정적인 헤더와 아이콘까지
 * 클라이언트 번들로 들어간다(폼은 이미 각자 클라이언트 컴포넌트다).
 */
export function ContentFormShell({
  backHref,
  backLabel,
  title,
  description,
  className,
  children,
}: {
  backHref: string;
  backLabel: string;
  /** 행 값을 그대로 쓰는 화면이 있다 — pillars/[id], inquiry-options/[id]. */
  title: string;
  /** 제목 아래 보조 설명. inquiry-options/new에만 있다. */
  description?: string;
  /** 폭·간격이 다른 화면만 덮어쓴다 — 셸의 레이아웃 기본값을 전부 덮을 수 있는 넓은 escape hatch라 꼭 필요한 화면에만 쓴다. */
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto flex max-w-2xl flex-col gap-6", className)}>
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {backLabel}
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm text-ink/55">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
