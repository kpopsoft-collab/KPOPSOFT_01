import NextAuth from "next-auth";
import type { NextAuthRequest } from "next-auth";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);
const authenticatedProxy = auth(
  (request: NextAuthRequest, event: NextFetchEvent) => {
    void request;
    void event;
    return NextResponse.next();
  },
);

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  return authenticatedProxy(request, event);
}

export const config = {
  matcher: ["/admin/:path*"],
};
