"use client";

import { useActionState, useEffect, useRef } from "react";
import { UserPlus } from "lucide-react";

import {
  addTeamMemberAction,
  setTeamMemberActiveAction,
  type AddTeamMemberState,
} from "@/app/admin/(shell)/settings/team-actions";

export type TeamMemberView = {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
};

export function TeamManager({
  members,
  currentAdminId,
}: {
  members: TeamMemberView[];
  currentAdminId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<
    AddTeamMemberState,
    FormData
  >(addTeamMemberAction, null);
  const activeCount = members.filter((member) => member.isActive).length;

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="flex flex-col gap-6">
      <form
        ref={formRef}
        action={formAction}
        className="rounded-3xl border border-ink/10 bg-white p-5 sm:p-6"
      >
        <label htmlFor="team-email" className="text-sm font-bold text-ink">
          팀원 이메일 추가
        </label>
        <p className="mt-1 text-xs leading-5 text-ink/55">
          등록한 Google 계정은 모든 관리자 기능을 함께 사용할 수 있습니다.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            id="team-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="team@kpopsoft.com"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-ink/15 bg-ivory/50 px-4 text-base outline-none transition-colors focus:border-brand-blue focus:bg-white"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-blue px-5 text-sm font-bold text-white transition-colors hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus className="size-4" aria-hidden />
            {pending ? "추가 중..." : "팀원 추가"}
          </button>
        </div>
        {state?.error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-brand-red">
            {state.error}
          </p>
        ) : null}
        {state?.ok ? (
          <p role="status" className="mt-3 text-sm font-medium text-brand-mint">
            팀원 계정을 활성화했습니다.
          </p>
        ) : null}
      </form>

      <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-6">
          <h2 className="text-sm font-bold text-ink">관리자 팀</h2>
          <span className="text-xs font-semibold text-ink/50">
            활성 {activeCount}명
          </span>
        </div>
        <ul className="divide-y divide-ink/10">
          {members.map((member) => {
            const isCurrent = member.id === currentAdminId;
            const protectsLastCurrent =
              isCurrent && member.isActive && activeCount === 1;
            return (
              <li
                key={member.id}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-ink">
                      {member.name || member.email}
                    </p>
                    {isCurrent ? (
                      <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-[11px] font-bold text-brand-blue">
                        내 계정
                      </span>
                    ) : null}
                  </div>
                  {member.name ? (
                    <p className="mt-1 truncate text-xs text-ink/55">
                      {member.email}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-ink/40">
                    {member.lastLoginAt
                      ? `최근 로그인 ${new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(member.lastLoginAt))}`
                      : "로그인 기록 없음"}
                  </p>
                </div>

                <form
                  action={setTeamMemberActiveAction.bind(
                    null,
                    member.id,
                    !member.isActive,
                  )}
                >
                  <button
                    type="submit"
                    disabled={protectsLastCurrent}
                    title={
                      protectsLastCurrent
                        ? "마지막 활성 관리자는 비활성화할 수 없습니다."
                        : undefined
                    }
                    className={`inline-flex h-10 w-full items-center justify-center rounded-full px-4 text-xs font-bold transition-colors sm:w-auto ${
                      member.isActive
                        ? "bg-brand-mint/15 text-brand-mint hover:bg-brand-red/10 hover:text-brand-red"
                        : "bg-ink/5 text-ink/55 hover:bg-brand-blue/10 hover:text-brand-blue"
                    } disabled:cursor-not-allowed disabled:opacity-45`}
                  >
                    {member.isActive ? "활성 · 비활성화" : "비활성 · 활성화"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
