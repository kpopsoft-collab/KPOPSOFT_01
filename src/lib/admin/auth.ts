/**
 * Admin auth seam (docs/어드민기획.md §4.3, §11.8).
 *
 * Until Supabase Auth is wired, this runs in DEV-BYPASS: a fake admin session
 * so screens are buildable/testable. On wiring day, replace the body of
 * `getAdminSession()` with a real @supabase/ssr session + `is_admin()` check,
 * and set ADMIN_DEV_BYPASS=false. The rest of the app calls `requireAdmin()`
 * and never sees the difference.
 */

import { redirect } from "next/navigation";

export type AdminSession = { email: string } | null;

/** Dev bypass is ON unless explicitly disabled — flips off once auth is real. */
const DEV_BYPASS = process.env.ADMIN_DEV_BYPASS !== "false";

export async function getAdminSession(): Promise<AdminSession> {
  if (DEV_BYPASS) {
    return { email: "dev@kpopsoft.local" };
  }
  // TODO(wiring day): read @supabase/ssr session, verify against admin_users / is_admin().
  return null;
}

/** Guard for the admin shell layout — redirects to /admin/login when unauthenticated. */
export async function requireAdmin(): Promise<{ email: string }> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
