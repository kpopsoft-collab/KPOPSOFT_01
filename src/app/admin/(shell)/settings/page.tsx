import { requireAdmin } from "@/lib/admin/auth";
import { listAdminUsers } from "@/lib/admin/admin-users";
import { TeamManager } from "@/components/admin/settings/team-manager";

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  const members = await listAdminUsers();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">설정</h1>
        <p className="text-sm text-ink/60">
          Google 계정으로 로그인할 최고관리자 팀원을 함께 관리합니다.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-ink/50">계정</h2>
        <div className="max-w-md rounded-3xl border border-ink/10 bg-white p-6 sm:p-7">
          <p className="text-eyebrow text-ink/45">이메일</p>
          <p className="mt-1 text-base font-semibold text-ink">
            {session.email}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <TeamManager
          currentAdminId={session.id}
          members={members.map((member) => ({
            id: member.id,
            email: member.email,
            name: member.name,
            isActive: member.isActive,
            lastLoginAt: member.lastLoginAt?.toISOString() ?? null,
          }))}
        />
      </section>
    </div>
  );
}
