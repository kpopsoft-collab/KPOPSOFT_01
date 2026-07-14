"use server";

import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { isAdminDevBypassEnabled } from "@/lib/admin/runtime-mode";

export async function signInAdmin(): Promise<void> {
  if (isAdminDevBypassEnabled()) redirect("/admin");
  await signIn("google", { redirectTo: "/admin" });
}

export async function signOutAdmin(): Promise<void> {
  if (isAdminDevBypassEnabled()) redirect("/admin/login");
  await signOut({ redirectTo: "/admin/login" });
}
