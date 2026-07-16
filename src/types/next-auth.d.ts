import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      adminId?: string;
      authTime?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    adminId?: string;
    authTime?: number;
  }
}
