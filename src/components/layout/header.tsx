"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { headerCta, navItems, route } from "@/lib/site";
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
 * Minimal horizontal navigation (docs/디자인.md §Navigation).
 * Lockup left, links right, small rounded CTA — no big pill container.
 * Ivory background, gains a hairline border once scrolled.
 *
 * ver2에서 멀티페이지가 되면서 홈의 목차가 아니라 사이트 내비게이션이 됐다.
 * 링크 href와 CTA는 site.ts가 단일 소스이고, 여기서는 현재 경로에 맞춰
 * 활성 표시와 CTA만 고른다.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cta =
    pathname === route.education ? headerCta[route.education] : headerCta.default;

  /** 라우트 메뉴만 현재 페이지가 될 수 있다 — 홈 앵커(`/#work`)는 스크롤 위치를
   *  따르는 링크라 페이지 단위의 활성 상태를 갖지 않는다. */
  const isCurrent = (href: string) => !href.startsWith("/#") && href === pathname;

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
        <Link href={route.home} className="flex items-center">
          <BrandLockup />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className={cn(
                "text-eyebrow transition-colors hover:text-ink",
                isCurrent(item.href) ? "text-ink" : "text-ink/70",
              )}
            >
              {item.label}
            </Link>
          ))}
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
                  <SheetClose
                    key={item.label}
                    nativeButton={false}
                    render={<Link href={item.href} />}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                    className={cn(
                      "rounded-xl px-3 py-3 text-2xl font-bold tracking-tight hover:bg-ink/5",
                      isCurrent(item.href) ? "text-brand-blue" : "text-ink",
                    )}
                  >
                    {item.label}
                  </SheetClose>
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
