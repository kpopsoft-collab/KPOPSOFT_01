"use server";

/**
 * Admin auth Server Actions (docs/06-관리자/ §6). `admin_users` 테이블 +
 * 서명 쿠키. 로컬 DEV-BYPASS면 곧장 /admin으로 보낸다 — auth.ts와 같은 판정.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { isAdminDevBypass } from "./auth";
import { verifyPassword } from "./password";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  signAdminSession,
} from "./session";

export type SignInState = { error: string } | null;

const INVALID = "아이디 또는 비밀번호가 올바르지 않습니다.";

export async function signInAdmin(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  if (isAdminDevBypass()) {
    redirect("/admin");
  }

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { error: "아이디와 비밀번호를 입력해 주세요." };
  }

  const admin = await getDb().adminUser.findUnique({ where: { username } });
  // 계정 유무를 응답으로 구분하지 않는다(계정 탐색 방지).
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return { error: INVALID };
  }

  const token = await signAdminSession({ sub: admin.id, username: admin.username });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  redirect("/admin");
}

export async function signOutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}
