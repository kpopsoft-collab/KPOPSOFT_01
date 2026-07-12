/**
 * Admin auth seam (docs/어드민기획.md §4.3, §11.8).
 *
 * Supabase Auth is the default. Local mock access exists only when
 * ADMIN_DEV_BYPASS=true outside production, so a missing variable cannot open
 * the admin area accidentally.
 */

import { redirect } from "next/navigation";

import { isAdminDevBypassEnabled } from "@/lib/admin/runtime-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminSession = { email: string } | null;

export async function getAdminSession(): Promise<AdminSession> {
  if (isAdminDevBypassEnabled()) {
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

/**
 * Authorization boundary for Server Actions. Admin pages already use the
 * layout guard, but exported actions are independently reachable POST entry
 * points and must re-check the session before every mutation.
 */
export async function requireAdminAction(): Promise<{ email: string }> {
  const session = await getAdminSession();
  if (!session) throw new Error("Forbidden");
  return session;
}
