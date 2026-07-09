"use client";

import { useState } from "react";
import { Menu, LogOut } from "lucide-react";

import { signOutAdmin } from "@/lib/admin/auth-actions";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandMark } from "@/components/layout/brand-mark";
import { Wordmark } from "@/components/layout/wordmark";
import { AdminNavList } from "./admin-sidebar";

/**
 * Admin top bar — page title on the left, account/logout on the right,
 * and (mobile only) the hamburger that opens the nav drawer. Logout is a
 * placeholder until Supabase Auth is wired (docs §11.8).
 */
export function AdminTopbar({ email }: { email: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-ivory/85 px-4 backdrop-blur-md lg:px-8">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="메뉴 열기"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-ink/15 text-ink lg:hidden"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-ivory p-4">
          <SheetTitle className="flex items-center px-3 pb-4 text-ink">
            <BrandMark className="mr-2" />
            <Wordmark />
            <span className="ml-2 rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-blue">
              ADMIN
            </span>
          </SheetTitle>
          <AdminNavList onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1" />

      <div className="flex items-center gap-3">
        <span className="hidden text-sm font-medium text-ink/60 sm:inline">
          {email}
        </span>
        <form action={signOutAdmin}>
          <button
            type="submit"
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink/70 transition-colors hover:bg-ink/5"
          >
            <LogOut className="size-4" />
            로그아웃
          </button>
        </form>
      </div>
    </header>
  );
}
