import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const authConfig = {
  providers: [Google],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      if (pathname === "/admin/login" || pathname === "/login") return true;
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
