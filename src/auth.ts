import { and, eq } from "drizzle-orm";
import NextAuth from "next-auth";

import authConfig from "@/auth.config";
import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";

async function findActiveAdmin(email: string) {
  const [admin] = await getDb()
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.email, email.trim().toLowerCase()),
        eq(adminUsers.isActive, true),
      ),
    )
    .limit(1);
  return admin ?? null;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ profile }) {
      const email =
        typeof profile?.email === "string"
          ? profile.email.trim().toLowerCase()
          : "";
      const verified =
        (profile as { email_verified?: unknown } | undefined)
          ?.email_verified === true;
      if (!email || !verified) return false;
      return Boolean(await findActiveAdmin(email));
    },
    async jwt({ token, account }) {
      if (account && token.email) {
        const admin = await findActiveAdmin(token.email);
        token.adminId = admin?.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.adminId =
          typeof token.adminId === "string" ? token.adminId : undefined;
      }
      return session;
    },
  },
});
