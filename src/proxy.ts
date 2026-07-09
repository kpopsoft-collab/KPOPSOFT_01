import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 proxy (formerly `middleware.ts`). Runs on `/admin/*` to keep the
 * Supabase auth session fresh and bounce unauthenticated visitors to the login
 * page. The admin-only (`is_admin()`) check stays in `requireAdmin()`
 * (src/lib/admin/auth.ts), which the admin layout calls.
 *
 * Do not insert logic between `createServerClient` and `getUser()`.
 */
export async function proxy(request: NextRequest) {
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

  // Mirror the auth seam's DEV bypass: while it's on, don't gate /admin so the
  // shell stays reachable before login/first-admin exist (src/lib/admin/auth.ts).
  const devBypass = process.env.ADMIN_DEV_BYPASS !== "false";

  if (!devBypass && !user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
