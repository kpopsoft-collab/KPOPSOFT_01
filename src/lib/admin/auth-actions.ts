"use server";

/**
 * Admin auth Server Actions (docs/어드민기획.md §6). Real Supabase Auth, but the
 * ADMIN_DEV_BYPASS flag still short-circuits so screens work before a first
 * admin exists — mirrors getAdminSession() in auth.ts.
 */

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEV_BYPASS = process.env.ADMIN_DEV_BYPASS !== "false";

export type SignInState = { error: string } | null;

export async function signInAdmin(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  if (DEV_BYPASS) {
    redirect("/admin");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해 주세요." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  // Only admins may enter. Non-admins get signed straight back out.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "관리자 권한이 없는 계정입니다." };
  }

  redirect("/admin");
}

export async function signOutAdmin(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
