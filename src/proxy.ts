import NextAuth from "next-auth";
import type { NextAuthRequest } from "next-auth";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import authConfig from "@/auth.config";
import {
  billingHostDestination,
  billingRequestHost,
  type BillingHostDestination,
} from "@/lib/billing/hosts";

const hostConfig = {
  wwwHost: process.env.BILLING_WWW_HOST ?? "www.kpopsoft.com",
  payHost: process.env.BILLING_PAY_HOST ?? "pay.kpopsoft.com",
  adminHost: process.env.BILLING_ADMIN_HOST ?? "admin.pay.kpopsoft.com",
};

function destination(request: NextRequest): BillingHostDestination {
  const host = billingRequestHost(request.headers, process.env.VERCEL === "1");
  return billingHostDestination(host, request.nextUrl.pathname, hostConfig);
}

function respond(request: NextRequest, result: BillingHostDestination) {
  if (result.kind === "next") return NextResponse.next();
  if (result.kind === "deny") return new NextResponse(null, { status: 404 });
  const target = request.nextUrl.clone();
  target.pathname = result.pathname ?? "/";
  if (result.kind === "rewrite") return NextResponse.rewrite(target);
  target.protocol = "https:";
  target.host = result.host ?? target.host;
  return NextResponse.redirect(target);
}

const { auth } = NextAuth(authConfig);
const authenticatedProxy = auth(
  (request: NextAuthRequest, event: NextFetchEvent) => {
    void event;
    return respond(request, destination(request));
  },
);

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const result = destination(request);
  return result.auth
    ? authenticatedProxy(request, event)
    : respond(request, result);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|ico)$).*)",
  ],
};
