import "server-only";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { isAdminDevBypassEnabled } from "@/lib/admin/runtime-mode";

export type AdminIdentity = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  authTime: number | null;
};

export type AdminSession = AdminIdentity | null;

export async function getAdminSession(): Promise<AdminSession> {
  if (isAdminDevBypassEnabled()) {
    return {
      id: "00000000-0000-0000-0000-000000000000",
      email: "dev@kpopsoft.local",
      name: "Local administrator",
      avatarUrl: null,
      authTime: Math.floor(Date.now() / 1000),
    };
  }

  const session = await auth();
  const sessionUser = session?.user;
  const email = sessionUser?.email?.trim().toLowerCase();
  if (!email) return null;

  const [admin] = await getDb()
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      avatarUrl: adminUsers.avatarUrl,
    })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.email, email),
        eq(adminUsers.isActive, true),
      ),
    )
    .limit(1);

  if (!admin) return null;
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name ?? sessionUser?.name ?? null,
    avatarUrl: admin.avatarUrl ?? sessionUser?.image ?? null,
    authTime:
      typeof sessionUser?.authTime === "number" ? sessionUser.authTime : null,
  };
}

export async function requireAdmin(): Promise<AdminIdentity> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireAdminAction(): Promise<AdminIdentity> {
  const session = await getAdminSession();
  if (!session) throw new Error("Forbidden");
  return session;
}
