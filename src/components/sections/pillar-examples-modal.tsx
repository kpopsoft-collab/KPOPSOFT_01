"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/modal";
import { Tag } from "@/components/ui/tag";
import type { PillarExample } from "@/lib/pillar-examples";
import { accentBg } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * What We Do 카드에서 여는 예시 사례 모달.
 *
 * 사례가 여러 개라 한 화면에 다 펼치지 않고 **한 번에 하나씩** 보여주고
 * 좌우 화살표·방향키·스와이프로 넘긴다. 딤 처리·Esc/배경 클릭 닫기·포커스 트랩·배경 스크롤
 * 잠금은 `ui/modal.tsx`가 감싼 base-ui Dialog가 처리한다.
 *
 * 순환(마지막 → 처음)은 하지 않는다. 끝에서 버튼을 비활성화하면 "몇 개짜리
 * 목록인지"가 손끝으로 전달되지만, 무한히 돌면 끝을 알 수 없다.
 *
 * 트리거는 호출부에서 넘긴다(`children`) — 카드 본문 전체를 버튼으로 쓰기
 * 위해서다. 카드 안의 CTA 링크는 이 버튼 **밖**에 두어야 한다(중첩 금지).
 */
export function PillarExamplesModal({
  label,
  examples,
  contact,
  children,
}: {
  /** 모달 제목 대신 읽히는 맥락. 예: "Software" */
  label: string;
  examples: PillarExample[];
  /**
   * 사례를 다 본 다음 이어질 행동. 카드에서 CTA pill을 걷어내면서
   * 문의 폼으로 가는 경로를 이 모달 안으로 옮겼다.
   */
  contact?: { label: string; href: string };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const total = examples.length;
  const current = examples[index];

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => Math.min(Math.max(i + delta, 0), total - 1));
      // 아래로 스크롤한 상태에서 넘기면 다음 사례가 중간부터 보인다. 화살표는
      // 아래에 있고 내용은 위에서 시작하므로 항상 맨 위로 되돌린다.
      scrollRef.current?.scrollTo({ top: 0 });
    },
    [total],
  );

  /**
   * 좌우 스와이프로 넘기기 — 모바일에서는 화살표 버튼보다 이쪽이 먼저 손에
   * 붙는다. `touchmove`를 막지는 않는다. 팝업 자체가 세로 스크롤 영역이라
   * 가로 제스처만 골라내야 하고(가로 이동이 세로보다 확실히 커야 한다),
   * 손가락 두 개(핀치 줌)는 제스처로 치지 않는다.
   */
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length !== 1) {
      touchStart.current = null;
      return;
    }
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // 48px는 "스크롤하다 손이 조금 틀어진 것"과 "넘기려 그은 것"이 갈리는 선.
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    go(dx < 0 ? 1 : -1);
  };

  // 열 때마다 첫 사례부터. 닫았다 다시 열었는데 이전 위치에 남아 있으면
  // "다시 처음부터 보려면 어떻게 하지"가 된다.
  //
  // 스크롤도 함께 맨 위로 되돌린다 — 포커스가 이동하면서 본문이 살짝 밀려
  // 열리는 경우가 있어, 포커스가 자리를 잡은 다음 프레임에 맞춘다.
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setIndex(0);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0 }));
  };

  if (total === 0) return <>{children}</>;

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalTrigger render={children as React.ReactElement} />

      <ModalContent
        ref={scrollRef}
        aria-label={`${label} 예시 사례`}
        // 좌우 방향키로도 넘긴다. 캐러셀에서 기대되는 조작이고, 화살표
        // 버튼까지 탭으로 이동하지 않아도 되게 한다.
        onKeyDown={(event: React.KeyboardEvent) => {
          if (event.key === "ArrowRight") go(1);
          if (event.key === "ArrowLeft") go(-1);
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 스크롤 영역은 팝업 하나뿐이다. 안쪽에 별도 스크롤 박스를 두고 화살표
            줄을 그 밖에 고정하면, 화살표 줄 위에서는 휠이 아무 데도 먹지 않는
            사각지대가 생긴다(방금 화살표를 누른 커서가 바로 그 자리에 있다).
            화살표 줄은 `sticky`로 바닥에 붙여 둔다 — 어디서든 스크롤되면서도
            다음 장으로 넘어갈 버튼은 늘 보인다. */}
        <div>
          {/* 이미지 칸을 여백 없이 꽉 채운다(사용자 지시). 사례마다 원본
              비율이 달라(16:9 / 6:5 / 3:4) `object-contain`으로는 좌우에 빈
              띠가 남았다 — 고정 16:9 칸에 `object-cover`로 채우고, 넘치는
              부분은 잘라낸다. 16:9는 소프트웨어 목업 4장의 원본 비율이라
              그쪽은 잘리지 않고, 세로형 AI 사진만 위아래가 잘린다. */}
          <div className="relative aspect-[16/9] max-h-[52vh] w-full shrink-0 overflow-hidden sm:rounded-t-[2rem]">
            <Image
              src={current.image.src}
              alt={current.image.alt}
              fill
              sizes="(max-width: 640px) 100vw, 44rem"
              className="object-cover object-center"
            />
          </div>

          <div className="flex flex-col gap-8 p-6 pb-8 md:p-10">
            <header className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="border-transparent bg-ink font-semibold text-ivory">
                  {current.name}
                </Tag>
              </div>

              <ModalTitle>{current.headline}</ModalTitle>
              <ModalDescription>{current.description}</ModalDescription>
            </header>

            <ul className="flex flex-col gap-3">
              {current.highlights.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-sm leading-relaxed text-ink/75 md:text-base"
                >
                  <span
                    className={cn(
                      "mt-2 size-1.5 shrink-0 rounded-full",
                      accentBg[current.accent],
                    )}
                    aria-hidden
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            {/* 사례별로 문구가 바뀌지 않는 고정 CTA — 눌러서 닫고 홈 문의
                폼으로 간다(`?ct=`로 문의 유형이 미리 선택된다). 모달을 닫지
                않고 이동하면 스크롤 잠금이 풀리기 전에 앵커가 걸린다. */}
            {contact && (
              <ModalClose
                nativeButton={false}
                render={
                  <Link
                    href={contact.href}
                    className="group inline-flex h-13 items-center justify-center gap-2 self-start rounded-full bg-brand-blue px-7 text-[0.95rem] font-semibold whitespace-nowrap text-white transition-all outline-none hover:bg-brand-navy focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
                  />
                }
              >
                {contact.label}
                <ArrowUpRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </ModalClose>
            )}
          </div>
        </div>

        {/* 페이지 이동 — 스크롤해도 바닥에 붙어 따라온다. */}
        <div className="sticky bottom-0 mt-auto flex shrink-0 items-center justify-between gap-4 border-t border-ink/10 bg-ivory px-6 py-5 md:px-10">
          <NavButton
            direction="prev"
            disabled={index === 0}
            onClick={() => go(-1)}
          />

          <div className="flex flex-col items-center gap-2">
            <span className="flex items-center gap-1.5" aria-hidden>
              {examples.map((example, i) => (
                <span
                  key={example.id}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-200",
                    i === index ? "w-5 bg-ink" : "w-1.5 bg-ink/20",
                  )}
                />
              ))}
            </span>
            <span
              className="text-sm font-medium text-ink/55"
              aria-live="polite"
            >
              {index + 1} / {total} · {current.name}
            </span>
          </div>

          <NavButton
            direction="next"
            disabled={index === total - 1}
            onClick={() => go(1)}
          />
        </div>
      </ModalContent>
    </Modal>
  );
}

/** 이전/다음 버튼. 탭 타겟 44px 이상(docs/디자인.md 접근성). */
function NavButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const isPrev = direction === "prev";
  const Icon = isPrev ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isPrev ? "이전 사례" : "다음 사례"}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full border-[1.25px] transition-colors outline-none",
        "focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory",
        disabled
          ? "cursor-not-allowed border-ink/10 text-ink/25"
          : "border-ink/70 text-ink hover:bg-ink hover:text-ivory",
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
