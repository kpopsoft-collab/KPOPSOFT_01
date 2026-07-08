import Link from "next/link";

import { navItems, sectionId, site } from "@/lib/site";
import { Circle, Star, Wave } from "@/components/shapes";

/**
 * Footer (docs/기획서.md §16). Reuses the brand shape vocabulary so the
 * visual language carries through to the very bottom of the page.
 */
export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-ivory">
      <div className="container-editorial py-16 md:py-24">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-5">
            <p className="text-eyebrow text-ivory/60">{site.tagline}</p>
            <p className="text-3xl font-extrabold tracking-tight md:text-5xl">
              아이디어를
              <br />
              작동하는 기술로.
            </p>
            <Link
              href={`#${sectionId.contact}`}
              className="inline-flex h-13 items-center rounded-full bg-ivory px-7 font-semibold text-ink transition-colors hover:bg-white"
            >
              프로젝트 문의
            </Link>
          </div>

          <div className="flex items-center gap-4 text-ivory/80">
            <Circle className="size-9 text-brand-blue" />
            <Star className="size-9 text-brand-red" />
            <Wave className="w-16 text-brand-mint" />
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-8 border-t border-ivory/15 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-xl font-extrabold tracking-tight">{site.name}</p>
          <nav
            className="flex flex-wrap gap-x-6 gap-y-2"
            aria-label="푸터 메뉴"
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-eyebrow text-ivory/60 transition-colors hover:text-ivory"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-ivory/50">
            © {new Date().getFullYear()} {site.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
