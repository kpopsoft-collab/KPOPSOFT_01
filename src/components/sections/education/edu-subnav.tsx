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
 * **프로그램 섹션에 닿을 때부터 나타난다.** 처음에는 히어로 아래 일반 위치에
 * 놓아 뒀는데, 히어로와 목적 선택 사이 여백에 메뉴 줄 하나가 덩그러니 떠
 * 있어서 어느 쪽에도 속하지 않는 것처럼 보였다. 목적 선택까지는 방문자가
 * "무엇을 찾는지" 정하는 구간이라 페이지 안을 건너뛸 이유도 아직 없다.
 *
 * 그래서 흐름에서 빼고(`fixed`) 프로그램 섹션이 헤더 아래로 올라오는 순간
 * 헤더에 붙어 나타난다. 위로 되돌아가면 다시 사라진다 — 숨어 있는 동안에는
 * 탭 순서에서도 빠져야 해서 `invisible`로 감춘다(`opacity-0`만으로는 키보드
 * 포커스가 보이지 않는 링크에 걸린다).
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

/** 서브바가 나타나기 시작하는 기준선(px) — 전역 헤더 아래 언저리. */
const REVEAL_OFFSET = 90;

export function EduSubnav() {
  const [active, setActive] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  /** 상단 메뉴 축에 맞추기 위한 좌우 보정값(px). */
  const [offsetX, setOffsetX] = useState(0);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());

  /**
   * 상단 메뉴와 세로 축을 맞춘다.
   *
   * 전역 헤더는 `로고 — 메뉴 — CTA` 양끝 정렬이라, 로고(넓음)와 CTA(좁음)의
   * 폭 차이만큼 **메뉴가 페이지 중앙보다 오른쪽**에 있다. 서브바를 그냥
   * 가운데 두면 두 줄의 축이 어긋나 서브바가 왼쪽으로 밀린 것처럼 보인다.
   *
   * 상수로 박지 않고 실측하는 이유 — 헤더 CTA 문구가 페이지마다 다르고
   * (`headerCta`), 로고·메뉴 폭도 폰트 로드 전후로 달라진다. 그때마다
   * 어긋나지 않으려면 실제 위치를 재는 수밖에 없다.
   */
  useEffect(() => {
    const align = () => {
      const list = listRef.current;
      if (!list) return;

      const headerNav = document.querySelector<HTMLElement>(
        'nav[aria-label="주요 메뉴"]',
      );
      const headerRect = headerNav?.getBoundingClientRect();

      // 헤더 메뉴가 숨는 폭(lg 미만)에서는 맞출 대상이 없다.
      if (!headerRect || headerRect.width === 0) {
        setOffsetX(0);
        return;
      }

      setOffsetX((prev) => {
        const rect = list.getBoundingClientRect();
        // 이미 적용된 보정을 빼서 "보정 없는 원래 중심"을 구한다.
        const naturalCenter = rect.left + rect.width / 2 - prev;
        const target = headerRect.left + headerRect.width / 2;
        return Math.round(target - naturalCenter);
      });
    };

    align();
    window.addEventListener("resize", align);

    // 폰트가 늦게 로드되면 로고·메뉴 폭이 바뀐다.
    document.fonts?.ready.then(align).catch(() => {});

    return () => window.removeEventListener("resize", align);
  }, []);

  // 프로그램 섹션이 헤더 아래로 올라오면 나타나고, 위로 되돌아가면 사라진다.
  // 스크롤 위치 하나만 보면 되는 판정이라 스크롤 스파이와 같은 핸들러에서
  // 처리해도 되지만, 관심사가 달라 따로 둔다.
  useEffect(() => {
    const onScroll = () => {
      const anchor = document.getElementById(educationSectionId.programs);
      if (!anchor) return;

      const reached = anchor.getBoundingClientRect().top <= REVEAL_OFFSET;
      setVisible((prev) => (prev === reached ? prev : reached));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
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
    <nav
      aria-label="교육 페이지 내비게이션"
      // 흐름에서 빠져 있으므로 아래 섹션들의 위치에 영향을 주지 않는다.
      // 숨어 있는 동안은 화면에서도 탭 순서에서도 빠진다.
      className={cn(
        "fixed inset-x-0 z-40 border-b border-ink/10 bg-ivory/85 backdrop-blur-md",
        "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
        STUCK_TOP,
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none invisible -translate-y-2 opacity-0",
      )}
    >
      <div className="container-editorial">
        {/*
          `w-max mx-auto`로 가운데 모으고, 위 effect가 상단 메뉴 축까지
          미세 보정한다. 페이지 정중앙에만 두면 헤더 메뉴(로고·CTA 폭 차이로
          오른쪽에 치우쳐 있다)와 어긋나 서브바가 왼쪽으로 밀려 보인다.

          `justify-center`가 아닌 이유: 항목이 컨테이너보다 넓어지면(모바일)
          앞쪽 항목이 스크롤로 닿지 않는 영역에 잘린다.
        */}
        <div
          ref={scrollerRef}
          className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul
            ref={listRef}
            style={
              offsetX ? { transform: `translateX(${offsetX}px)` } : undefined
            }
            className="mx-auto flex w-max items-center gap-1"
          >
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
  );
}
