"use client";

import { useEffect, useRef, useState } from "react";

import { eduSectionId } from "@/lib/education-content";
import { educationSectionId } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * 교육 페이지 서브 내비게이션 (수정 요청서 §3).
 *
 * 전역 헤더는 건드리지 않는다. 요청서 §3은 교육 페이지 내부 메뉴를 요구하지만
 * 홈 요청서 §3이 전역 4메뉴를 확정했으므로, 둘을 **역할로 분리**한다 — 위쪽
 * 전역 헤더는 사이트를 오가고, 이 서브바는 페이지 안을 오간다(사용자 결정).
 *
 * 히어로 아래 일반 위치에 놓이고, 스크롤이 그 지점을 지나면 전역 헤더 바로
 * 아래에 붙는다. 이건 CSS `position: sticky`가 그대로 해 주는 동작이라
 * 스크롤 위치를 재서 흉내 내지 않는다 — 흉내 내면 스크롤 도중 한 프레임씩
 * 어긋나 바가 튄다. 붙었는지 여부는 시각 효과(테두리)에만 쓰고, 그 판정도
 * 스크롤 이벤트가 아니라 센티넬 하나를 관찰해서 얻는다.
 *
 * 전역 헤더와 시각적으로 경쟁하지 않도록 높이·글자를 한 단계 낮추고, 활성
 * 표시는 Education Green(Mint) 밑줄로만 준다(§3). 그림자는 쓰지 않는다.
 *
 * 문의 CTA는 여기 두지 않는다 — 전역 헤더가 이미 `교육 문의` 버튼을 갖고
 * 있어서(`headerCta`, site.ts) 같은 곳으로 가는 버튼이 위아래로 겹쳐 있었다.
 * 하나면 충분하고, 둘이면 어느 쪽이 진짜인지 잠깐 멈춰서 판단하게 된다.
 */

type NavItem = { label: string; id: string };

const ITEMS: NavItem[] = [
  { label: "프로그램", id: educationSectionId.programs },
  { label: "교육 사례", id: eduSectionId.cases },
  { label: "강사진", id: eduSectionId.instructors },
  { label: "수강 후기", id: eduSectionId.reviews },
  { label: "FAQ", id: eduSectionId.faq },
];

/** 전역 헤더 높이 — 서브바가 붙을 위치. header.tsx의 h-16 / md:h-[76px]와 같다. */
const STUCK_TOP = "top-16 md:top-[76px]";

export function EduSubnav() {
  const [active, setActive] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());

  // 붙었는지 판정 — 서브바 바로 위에 놓인 0px 센티넬이 화면 밖으로 나가면
  // 붙은 것이다.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      // 전역 헤더에 가려지는 높이만큼 위쪽을 잘라내고 관찰한다.
      { rootMargin: "-76px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // 스크롤 스파이 — 헤더+서브바에 가려지는 영역을 뺀 나머지 화면에서,
  // 가장 위에 걸린 섹션을 현재 위치로 본다.
  useEffect(() => {
    const onScroll = () => {
      const offset = 160;
      let current: string | null = null;

      for (const item of ITEMS) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= offset) current = item.id;
      }

      setActive((prev) => (prev === current ? prev : current));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 모바일 가로 스크롤에서 활성 항목을 화면 중앙 가까이로 옮긴다(§3).
  // 페이지 자체를 스크롤시키면 안 되므로 `block: "nearest"`가 필수다.
  useEffect(() => {
    if (!active) return;
    const el = itemRefs.current.get(active);
    const scroller = scrollerRef.current;
    if (!el || !scroller) return;
    if (scroller.scrollWidth <= scroller.clientWidth) return;

    el.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [active]);

  /**
   * 해시는 `replaceState`로 바꾼다(§3 "URL Hash를 반영"). `pushState`로 쌓으면
   * 섹션을 다섯 개 지나본 사용자가 뒤로가기를 다섯 번 눌러야 이전 페이지로
   * 돌아간다.
   */
  const handleClick = (id: string) => {
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-0" />

      <nav
        aria-label="교육 페이지 내비게이션"
        className={cn(
          "sticky z-40 border-b bg-ivory/85 backdrop-blur-md transition-colors",
          STUCK_TOP,
          stuck ? "border-ink/10" : "border-transparent",
        )}
      >
        <div className="container-editorial">
          {/*
            상위 메뉴가 가운데 정렬이라 하위도 가운데에 둔다 — 둘의 축이
            어긋나면 서브바가 헤더에 딸린 것이 아니라 별개의 바처럼 보인다.

            `w-max mx-auto`인 이유: 항목이 컨테이너보다 좁으면 가운데로 모이고,
            넘치면(모바일) 왼쪽부터 시작해 가로 스크롤된다. `justify-center`만
            쓰면 넘칠 때 앞쪽 항목이 스크롤로 닿지 않는 영역에 잘린다.
          */}
          <div
            ref={scrollerRef}
            className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <ul className="mx-auto flex w-max items-center gap-1">
              {ITEMS.map((item) => {
                const isActive = active === item.id;

                return (
                  <li key={item.id}>
                    <a
                      ref={(el) => {
                        if (el) itemRefs.current.set(item.id, el);
                        else itemRefs.current.delete(item.id);
                      }}
                      href={`#${item.id}`}
                      onClick={() => handleClick(item.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        // 최소 44px 터치 타깃(§16). 글자는 절대 두 줄로
                        // 넘기지 않는다(§3).
                        "relative flex h-12 items-center rounded-lg px-3 text-sm font-semibold whitespace-nowrap transition-colors outline-none",
                        "focus-visible:ring-3 focus-visible:ring-brand-blue/40",
                        isActive ? "text-ink" : "text-ink/55 hover:text-ink",
                      )}
                    >
                      {item.label}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-3 bottom-2 h-0.5 rounded-full bg-brand-mint transition-transform duration-200",
                          isActive ? "scale-x-100" : "scale-x-0",
                        )}
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
