"use server";

/**
 * Admin account settings actions (docs/06-관리자/ §6). Password change:
 * re-checks the current password, then stores a new scrypt hash in admin_users.
 */

import { getDb } from "@/lib/db";
import { getAdminSession } from "@/lib/admin/auth";
import { hashPassword, verifyPassword } from "@/lib/admin/password";

export type ChangePasswordState = {
  ok?: boolean;
  error?: string;
} | null;

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
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

  const session = await getAdminSession();
  if (!session || session.id === "dev") {
    return { error: "세션이 만료되었습니다. 다시 로그인해 주세요." };
  }

  const db = getDb();
  const admin = await db.adminUser.findUnique({ where: { id: session.id } });
  // Re-check the current password so a hijacked session can't change it.
  if (!admin || !(await verifyPassword(current, admin.passwordHash))) {
    return { error: "현재 비밀번호가 올바르지 않습니다." };
  }

  try {
    await db.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: await hashPassword(next) },
    });
  } catch {
    return { error: "비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  return { ok: true };
}
