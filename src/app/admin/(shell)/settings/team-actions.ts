"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAction } from "@/lib/admin/auth";
import {
  addAdminUser,
  setAdminUserActive,
} from "@/lib/admin/admin-users";

const ADMIN_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_TEAM_ERRORS = new Set([
  "올바른 이메일 주소를 입력해 주세요.",
  "마지막 활성 관리자는 비활성화할 수 없습니다.",
  "관리자 계정을 찾을 수 없습니다.",
]);

function publicTeamError(error: unknown, fallback: string): string {
  return error instanceof Error && SAFE_TEAM_ERRORS.has(error.message)
    ? error.message
    : fallback;
}

export type AddTeamMemberState = {
  ok?: boolean;
  error?: string;
} | null;

export async function addTeamMemberAction(
  _previous: AddTeamMemberState,
  formData: FormData,
): Promise<AddTeamMemberState> {
  const actor = await requireAdminAction();
  const email = formData.get("email");
  if (typeof email !== "string") return { error: "이메일을 입력해 주세요." };

  try {
    await addAdminUser(actor.id, email);
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (error) {
    return {
      error: publicTeamError(error, "팀원을 추가하지 못했습니다."),
    };
  }
}

export async function setTeamMemberActiveAction(
  id: string,
  active: boolean,
): Promise<void> {
  const actor = await requireAdminAction();
  if (!ADMIN_ID_PATTERN.test(id) || typeof active !== "boolean") {
    throw new Error("잘못된 관리자 상태 변경 요청입니다.");
  }
  try {
    await setAdminUserActive(actor.id, id, active);
  } catch (error) {
    throw new Error(publicTeamError(error, "관리자 상태를 변경하지 못했습니다."));
  }
  revalidatePath("/admin/settings");
}
