"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { navItems, sectionId, site } from "@/lib/site";
import { BrandMark } from "@/components/layout/brand-mark";
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
 * Wordmark left, links right, small rounded CTA — no big pill container.
 * Ivory background, gains a hairline border once scrolled.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        <Link
          href={`#${sectionId.hero}`}
          className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink"
        >
          <BrandMark />
          {site.name}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-eyebrow text-ink/70 transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={`#${sectionId.contact}`}
            className="hidden rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy sm:inline-flex"
          >
            프로젝트 의뢰
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
                <SheetTitle className="flex items-center gap-2 text-left text-lg font-extrabold">
                  <BrandMark />
                  {site.name}
                </SheetTitle>
              </SheetHeader>
              <nav
                className="mt-2 flex flex-col gap-1 px-4"
                aria-label="모바일 메뉴"
              >
                {navItems.map((item) => (
                  <SheetClose
                    key={item.label}
                    render={<Link href={item.href} />}
                    className="rounded-xl px-3 py-3 text-2xl font-bold tracking-tight text-ink hover:bg-ink/5"
                  >
                    {item.label}
                  </SheetClose>
                ))}
                <SheetClose
                  render={<Link href={`#${sectionId.contact}`} />}
                  className="mt-4 inline-flex h-13 items-center justify-center rounded-full bg-brand-blue px-6 font-semibold text-white"
                >
                  프로젝트 의뢰
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
