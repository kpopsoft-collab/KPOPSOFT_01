"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound } from "lucide-react";

import {
  changePassword,
  type ChangePasswordState,
} from "@/app/admin/(shell)/settings/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-blue px-7 font-semibold text-white transition-colors hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      <KeyRound className="size-4" aria-hidden />
      {pending ? "변경 중…" : "비밀번호 변경"}
    </button>
  );
}

const inputClass =
  "h-12 rounded-2xl border border-ink/15 bg-ivory/60 px-4 text-base font-medium text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-brand-blue focus:bg-white";
const labelClass = "flex flex-col gap-2 text-sm font-semibold text-ink/70";

export function PasswordForm() {
  const [state, formAction] = useActionState<ChangePasswordState, FormData>(
    changePassword,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields once a change succeeds.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex max-w-md flex-col gap-4 rounded-3xl border border-ink/10 bg-white p-6 sm:p-7"
    >
      {state?.ok ? (
        <p
          role="status"
          className="rounded-2xl border border-brand-mint/40 bg-brand-mint/10 px-4 py-3 text-sm font-medium text-brand-mint-ink"
        >
          비밀번호가 변경되었습니다.
        </p>
      ) : null}
      {state?.error ? (
        <p
          role="alert"
          className="rounded-2xl border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm font-medium text-brand-red"
        >
          {state.error}
        </p>
      ) : null}

      <label className={labelClass}>
        현재 비밀번호
        <input
          name="current"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
          placeholder="••••••••"
        />
      </label>
      <label className={labelClass}>
        새 비밀번호
        <input
          name="next"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
          placeholder="8자 이상"
        />
      </label>
      <label className={labelClass}>
        새 비밀번호 확인
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
          placeholder="한 번 더 입력"
        />
      </label>

      <div className="mt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
