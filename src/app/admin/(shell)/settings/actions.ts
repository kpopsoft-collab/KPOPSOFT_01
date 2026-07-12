"use server";

/**
 * Admin account settings actions (docs/어드민기획.md §6). Password change:
 * re-authenticates with the current password, then updates it via Supabase Auth.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminAction } from "@/lib/admin/auth";

export type ChangePasswordState = {
  ok?: boolean;
  error?: string;
} | null;

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  await requireAdminAction();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next || !confirm) {
    return { error: "모든 항목을 입력해 주세요." };
  }
  if (next.length < 8) {
    return { error: "새 비밀번호는 8자 이상이어야 합니다." };
  }
  if (next !== confirm) {
    return { error: "새 비밀번호가 서로 일치하지 않습니다." };
  }
  if (next === current) {
    return { error: "현재 비밀번호와 다른 비밀번호를 입력해 주세요." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "세션이 만료되었습니다. 다시 로그인해 주세요." };
  }

  // Re-auth with the current password so a hijacked session can't change it.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (signInError) {
    return { error: "현재 비밀번호가 올바르지 않습니다." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: next,
  });
  if (updateError) {
    return { error: "비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  return { ok: true };
}
