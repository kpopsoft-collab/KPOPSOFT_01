/**
 * Admin auth seam (docs/06-관리자/ §4.3, §11.8).
 *
 * Supabase Auth → 자체 인증으로 전환(2026-10). 계정은 `admin_users` 테이블
 * (scrypt 해시), 세션은 HMAC 서명 쿠키(session.ts)다. 나머지 앱은 여전히
 * `requireAdmin()` / `getAdminSession()`만 부르고 차이를 모른다.
 *
 * DEV-BYPASS: 로컬 개발에서만 가짜 세션을 준다. **production 빌드에서는
 * 플래그와 무관하게 꺼진다** — Supabase 시절에는 RLS가 DB 쓰기를 따로
 * 막았지만, 지금은 이 함수가 유일한 관문이라 운영에서 우회가 켜지면
 * 누구나 어드민 데이터를 바꿀 수 있게 된다.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDb, isDbConfigured } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "./session";

/** `email` 필드에는 로그인 아이디가 들어간다(화면 표시용 — 이름은 호환을 위해 유지). */
export type AdminSession = { id: string; email: string } | null;

export function isAdminDevBypass(): boolean {
  return (
    process.env.ADMIN_DEV_BYPASS !== "false" &&
    process.env.NODE_ENV !== "production"
  );
}

export async function getAdminSession(): Promise<AdminSession> {
  if (isAdminDevBypass()) {
    return { id: "dev", email: "dev@kpopsoft.local" };
  }
  if (!isDbConfigured()) return null;

  const cookieStore = await cookies();
  const payload = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!payload) return null;

  // 계정이 지워졌으면 쿠키가 아직 유효해도 들이지 않는다.
  const admin = await getDb().adminUser.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true },
  });
  if (!admin) return null;

  return { id: admin.id, email: admin.username };
}

/** Guard for the admin shell layout — redirects to /admin/login when unauthenticated. */
export async function requireAdmin(): Promise<{ id: string; email: string }> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * 데이터 계층용 관문 — Supabase RLS(`is_admin()`)가 하던 일을 대신한다.
 * 서버 액션은 누구나 POST할 수 있으므로, 어드민 리포의 모든 메서드가
 * DB에 닿기 전에 이것을 부른다.
 */
export async function assertAdmin(): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized: admin session required");
}
