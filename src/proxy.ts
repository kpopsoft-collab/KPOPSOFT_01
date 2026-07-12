import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isAdminDevBypassEnabled } from "@/lib/admin/runtime-mode";

/**
 * Next.js 16 proxy (formerly `middleware.ts`). Runs on `/admin/*` to keep the
 * Supabase auth session fresh and bounce unauthenticated visitors to the login
 * page. The admin-only (`is_admin()`) check stays in `requireAdmin()`
 * (src/lib/admin/auth.ts), which the admin layout calls.
 *
 * Do not insert logic between `createServerClient` and `getUser()`.
 */
export async function proxy(request: NextRequest) {
  // Keep the documented Supabase-free local workflow truly Supabase-free.
  // The shared policy makes this branch impossible in production.
  if (isAdminDevBypassEnabled()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLogin = pathname.startsWith("/admin/login");

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
