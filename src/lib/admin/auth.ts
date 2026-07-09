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

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminSession = { email: string } | null;

/** Dev bypass is ON unless explicitly disabled — flips off once auth is real. */
const DEV_BYPASS = process.env.ADMIN_DEV_BYPASS !== "false";

export async function getAdminSession(): Promise<AdminSession> {
  if (DEV_BYPASS) {
    return { email: "dev@kpopsoft.local" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // admin_users membership via the is_admin() SQL gate (docs §4.3/§5).
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return null;

  return { email: user.email ?? "" };
}

/** Guard for the admin shell layout — redirects to /admin/login when unauthenticated. */
export async function requireAdmin(): Promise<{ email: string }> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
