import { requireAdmin } from "@/lib/admin/auth";
import { PasswordForm } from "@/components/admin/settings/password-form";

/**
 * Admin account settings (docs/어드민기획.md §6). Currently: account email +
 * password change. Guarded by the shell layout's requireAdmin().
 */
export default async function AdminSettingsPage() {
  const session = await requireAdmin();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">설정</h1>
        <p className="text-sm text-ink/60">
          관리자 계정 정보를 확인하고 비밀번호를 변경합니다.
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
        <h2 className="text-sm font-bold text-ink/50">비밀번호 변경</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
