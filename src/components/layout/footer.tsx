import Link from "next/link";

import { consultCta, flatNavItems, site } from "@/lib/site";
import { Circle, Star, Wave } from "@/components/shapes";

/**
 * Footer (docs/99-archive/home-ver2/ §SECTION 08). Reuses the brand
 * shape vocabulary so the visual language carries through to the very
 * bottom of the page.
 *
 * CTA는 헤더(`프로젝트 문의`)와 달리 `consultCta`(프로젝트 상담하기)를 쓴다 —
 * 수정 요청서 §16이 지정한 문구다. 메뉴 순서·명칭은 `flatNavItems`를 그대로
 * 따라 헤더 내비게이션과 자동으로 일치한다.
 */
export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-ivory">
      <div className="container-editorial py-16 md:py-24">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-5">
            <p className="text-eyebrow text-ivory/75">{site.tagline}</p>
            <p className="text-3xl font-extrabold tracking-tight md:text-5xl">
              아이디어를
              <br />
              작동하는 기술로.
            </p>
            <Link
              href={consultCta.href}
              className="inline-flex h-13 items-center rounded-full bg-ivory px-7 font-semibold text-ink transition-colors hover:bg-white"
            >
              {consultCta.label}
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
            {/* 푸터는 드롭다운이 없으니 상위·하위를 한 줄로 펴서 모두 건다. */}
            {flatNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-eyebrow text-ivory/80 transition-colors hover:text-ivory"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-ivory/70">
            © {new Date().getFullYear()} {site.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
