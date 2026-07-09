"use client";

/**
 * Admin login (docs/어드민기획.md §6 "로그인", §11.8 DB-excluded seam mode).
 *
 * This route sits outside the `(shell)` group on purpose: it must NOT go
 * through `requireAdmin()` (that would redirect back here in a loop). It only
 * inherits the root app layout.
 *
 * Submits to the `signInAdmin` Server Action (real Supabase Auth). While
 * ADMIN_DEV_BYPASS is on, that action just redirects to `/admin`.
 */

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LogIn } from "lucide-react";

import { signInAdmin } from "@/lib/admin/auth-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand-blue px-7 font-semibold text-white transition-colors hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "로그인 중..." : "로그인"}
      <LogIn
        className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
        aria-hidden
      />
    </button>
  );
}

export default function AdminLoginPage() {
  const [state, formAction] = useActionState(signInAdmin, null);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ivory px-4 py-12 text-ink">
      <div className="w-full max-w-sm">
        {state?.error ? (
          <p
            role="alert"
            className="mb-6 rounded-2xl border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-center text-xs font-medium text-brand-red"
          >
            {state.error}
          </p>
        ) : null}

        <div className="mb-8 text-center">
          <span className="text-xl font-extrabold tracking-tight text-ink">
            KPOPSOFT
          </span>
          <span className="ml-2 rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-blue align-middle">
            ADMIN
          </span>
          <p className="mt-3 text-sm text-ink/55">
            관리자 계정으로 로그인하세요.
          </p>
        </div>

        <form
          action={formAction}
          className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-7"
        >
          <div className="flex flex-col gap-4">
            <label
              htmlFor="admin-email"
              className="flex flex-col gap-2 text-sm font-semibold text-ink/70"
            >
              이메일
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                className="h-12 rounded-2xl border border-ink/15 bg-ivory/60 px-4 text-base font-medium text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-brand-blue focus:bg-white"
                placeholder="admin@kpopsoft.io"
              />
            </label>

            <label
              htmlFor="admin-password"
              className="flex flex-col gap-2 text-sm font-semibold text-ink/70"
            >
              비밀번호
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-12 rounded-2xl border border-ink/15 bg-ivory/60 px-4 text-base font-medium text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-brand-blue focus:bg-white"
                placeholder="••••••••"
              />
            </label>
          </div>

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
