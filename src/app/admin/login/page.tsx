import { LogIn } from "lucide-react";

import { signInAdmin } from "@/lib/admin/auth-actions";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ivory px-4 py-12 text-ink">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-xl font-extrabold tracking-tight text-ink">
            KPOPSOFT
          </span>
          <span className="ml-2 rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-blue align-middle">
            ADMIN
          </span>
          <p className="mt-3 text-sm text-ink/55">
            등록된 팀 Google 계정으로 로그인하세요.
          </p>
        </div>

        <form
          action={signInAdmin}
          className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-7"
        >
          <button
            type="submit"
            className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand-blue px-7 font-semibold text-white transition-colors hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Google로 로그인
            <LogIn
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </button>
        </form>
      </div>
    </div>
  );
}
