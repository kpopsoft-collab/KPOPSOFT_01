"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  flatNavItems,
  headerCta,
  navItems,
  route,
  type NavItem,
} from "@/lib/site";
import { BrandLockup } from "@/components/layout/brand-lockup";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Minimal horizontal navigation (docs/04-design-system/ §Navigation).
 * Lockup left, links right, small rounded CTA — no big pill container.
 * Ivory background, gains a hairline border once scrolled.
 *
 * ver2에서 멀티페이지가 되면서 홈의 목차가 아니라 사이트 내비게이션이 됐다.
 * 링크 href와 CTA는 site.ts가 단일 소스이고, 여기서는 현재 경로에 맞춰
 * 활성 표시와 CTA만 고른다.
 */
/** 홈 앵커 메뉴(`/#work`)에서 섹션 id만 뽑는다. 라우트 메뉴는 제외. */
const anchorIds = flatNavItems
  .filter((item) => item.href.startsWith("/#"))
  .map((item) => item.href.slice(2));

/** `text-eyebrow`는 cn(tailwind-merge)이 text-* 색상과 충돌로 보고 지워버려서
 *  병합 대상에서 빼고 따로 붙인다. */
const navLink = "transition-colors hover:text-ink";
const navLinkActive = "font-bold text-ink";
const navLinkIdle = "text-ink/70";

/**
 * 하위 메뉴가 있는 상위 항목. 호버로 열리되 키보드만 쓰는 사용자도 쓸 수
 * 있도록 포커스가 그룹 안으로 들어오면 같이 열고, Esc로 닫는다. 상위 항목
 * 자체도 링크라 드롭다운 없이도 이동할 수 있다.
 *
 * 상위와 패널 사이 간격은 패널 래퍼의 `pt-3`로 만든다 — margin으로 띄우면
 * 그 틈에서 마우스가 빠져 메뉴가 닫힌다.
 */
function NavGroup({
  item,
  isCurrent,
}: {
  item: Extract<NavItem, { children: readonly unknown[] }>;
  isCurrent: (href: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const active = isCurrent(item.href) || item.children.some((c) => isCurrent(c.href));

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <Link
        href={item.href}
        aria-haspopup="true"
        aria-expanded={open}
        aria-current={isCurrent(item.href) ? "page" : undefined}
        className={`text-eyebrow ${cn(navLink, active ? navLinkActive : navLinkIdle)}`}
      >
        {item.label}
      </Link>

      <div
        className={cn(
          "absolute top-full left-1/2 z-50 -translate-x-1/2 pt-3",
          open ? "block" : "hidden",
        )}
      >
        <ul className="flex min-w-44 flex-col rounded-2xl border border-ink/10 bg-ivory p-2">
          {item.children.map((child) => (
            <li key={child.label}>
              <Link
                href={child.href}
                aria-current={isCurrent(child.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-h-11 items-center rounded-xl px-3 text-sm whitespace-nowrap transition-colors hover:bg-ink/5 hover:text-ink",
                  isCurrent(child.href)
                    ? "font-bold text-ink"
                    : "font-semibold text-ink/70",
                )}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  /** 홈에서 지금 보고 있는 섹션 id (스크롤 스파이). 홈이 아니면 null. */
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * 홈에서만 스크롤 스파이 — 뷰포트 상단 근처(위 45%~아래 50% 사이의 좁은 밴드)에
   * 걸친 섹션 중 가장 위 것을 활성으로 본다. 앵커 메뉴도 라우트 메뉴처럼 현재
   * 위치를 볼드로 표시하기 위함. 홈이 아니면 관찰하지 않고 활성도 비운다.
   */
  useEffect(() => {
    if (pathname !== route.home) {
      setActiveAnchor(null);
      return;
    }
    const sections = anchorIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const visibleTops = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleTops.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visibleTops.delete(entry.target.id);
          }
        }
        let topmost: string | null = null;
        let minTop = Infinity;
        for (const [id, top] of visibleTops) {
          if (top < minTop) {
            minTop = top;
            topmost = id;
          }
        }
        if (topmost) setActiveAnchor(topmost);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  const cta =
    pathname === route.education ? headerCta[route.education] : headerCta.default;

  /**
   * 활성 판정. 라우트 메뉴(`/education`)는 경로가 일치할 때, 홈 앵커(`/#work`)는
   * 홈에서 그 섹션을 보고 있을 때(스크롤 스파이) 현재로 본다.
   */
  const isCurrent = (href: string) => {
    if (href.startsWith("/#")) {
      return pathname === route.home && href.slice(2) === activeAnchor;
    }
    return href === pathname;
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors",
        scrolled
          ? "border-b border-ink/10 bg-ivory/85 backdrop-blur-md"
          : "border-b border-transparent bg-ivory/85 backdrop-blur-md",
      )}
    >
      <div className="container-editorial flex h-16 items-center justify-between md:h-[76px]">
        {/*
          로고는 언제나 "홈 맨 위"로 보낸다. 홈이 아닐 때는 평범한 이동이지만,
          이미 홈에 있을 때 `/`로 가는 링크는 아무 일도 일어나지 않은 것처럼
          보인다 — 라우트가 같아 스크롤이 그대로 남기 때문이다. 그래서 홈에서는
          기본 동작을 막고 직접 맨 위로 올린다. 주소창에 남은 앵커(`/#work`)도
          함께 지운다. 그대로 두면 새로고침했을 때 다시 그 섹션으로 튄다.
        */}
        <Link
          href={route.home}
          onClick={(event) => {
            if (pathname !== route.home) return;
            event.preventDefault();
            window.history.replaceState(null, "", route.home);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="홈 맨 위로"
          className="flex items-center"
        >
          <BrandLockup />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="주요 메뉴">
          {navItems.map((item) =>
            "children" in item ? (
              <NavGroup key={item.label} item={item} isCurrent={isCurrent} />
            ) : (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                className={`text-eyebrow ${cn(
                  navLink,
                  isCurrent(item.href) ? navLinkActive : navLinkIdle,
                )}`}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={cta.href}
            className="hidden rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy sm:inline-flex"
          >
            {cta.label}
          </Link>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger
              aria-label="메뉴 열기"
              className="inline-flex size-11 items-center justify-center rounded-full border border-ink/20 text-ink lg:hidden"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-ivory">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <BrandLockup />
                </SheetTitle>
              </SheetHeader>
              <nav
                className="mt-2 flex flex-col gap-1 px-4"
                aria-label="모바일 메뉴"
              >
                {/* nativeButton={false} — 이 항목들은 이동하는 링크지 버튼이
                    아니다. 명시하지 않으면 Base UI가 native <button>을 기대해
                    경고하고, 역할 구분도 흐려진다(Education ver2 §31). */}
                {navItems.map((item) => (
                  <div key={item.label} className="flex flex-col">
                    <SheetClose
                      nativeButton={false}
                      render={<Link href={item.href} />}
                      aria-current={isCurrent(item.href) ? "page" : undefined}
                      className={cn(
                        "rounded-xl px-3 py-3 text-2xl tracking-tight text-ink hover:bg-ink/5",
                        isCurrent(item.href) ? "font-bold" : "font-semibold",
                      )}
                    >
                      {item.label}
                    </SheetClose>

                    {/* 하위 메뉴는 접었다 펴지 않고 계속 펼쳐 둔다 — 항목이
                        셋뿐이라 여는 동작을 한 번 더 요구할 이유가 없다. */}
                    {"children" in item &&
                      item.children.map((child) => (
                        <SheetClose
                          key={child.label}
                          nativeButton={false}
                          render={<Link href={child.href} />}
                          aria-current={
                            isCurrent(child.href) ? "page" : undefined
                          }
                          className={cn(
                            "ml-3 rounded-xl border-l border-ink/10 px-3 py-2.5 text-lg tracking-tight text-ink/70 hover:bg-ink/5 hover:text-ink",
                            isCurrent(child.href)
                              ? "font-bold text-ink"
                              : "font-semibold",
                          )}
                        >
                          {child.label}
                        </SheetClose>
                      ))}
                  </div>
                ))}
                <SheetClose
                  nativeButton={false}
                  render={<Link href={cta.href} />}
                  className="mt-4 inline-flex h-13 items-center justify-center rounded-full bg-brand-blue px-6 font-semibold text-white"
                >
                  {cta.label}
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
