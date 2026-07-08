"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/brand-mark";
import { adminNav } from "./admin-nav";

/** Is `href` the active route? Exact for /admin, prefix for the rest. */
function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/** Nav link list — shared by the desktop rail and the mobile drawer. */
export function AdminNavList({ onNavigate }: { onNavigate?: () => void }) {
  const isActive = useIsActive();

  return (
    <nav className="flex flex-col gap-6">
      {adminNav.map((group) => (
        <div key={group.heading} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-eyebrow text-muted-foreground">
            {group.heading}
          </p>
          {group.items.map((item) => {
            const active = !item.disabled && isActive(item.href);
            const Icon = item.icon;
            const base =
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors";

            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  aria-disabled
                  className={cn(base, "cursor-not-allowed text-ink/35")}
                  title="준비 중 (P2)"
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                  <span className="ml-auto rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold tracking-wide text-ink/40">
                    준비중
                  </span>
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  base,
                  active
                    ? "bg-brand-blue text-white"
                    : "text-ink/70 hover:bg-ink/5 hover:text-ink",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/** Desktop persistent sidebar rail. */
export function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar lg:block">
      <div className="sticky top-0 flex h-dvh flex-col gap-8 p-4">
        <Link href="/admin" className="flex items-center px-3 pt-2">
          <BrandMark className="mr-2" />
          <span className="text-lg font-extrabold tracking-tight text-ink">
            KPOPSOFT
          </span>
          <span className="ml-2 rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-blue">
            ADMIN
          </span>
        </Link>
        <AdminNavList />
      </div>
    </aside>
  );
}
