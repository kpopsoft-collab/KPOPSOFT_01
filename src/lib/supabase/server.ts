import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server (RSC / Server Action / Route Handler) Supabase client — anon key,
 * reads/writes the auth session from Next's cookie store. RLS + is_admin()
 * gate access (docs/어드민기획.md §5).
 *
 * The `setAll` try/catch is required: writing cookies from a Server Component
 * throws, and that's fine because `proxy.ts` refreshes the session on every
 * request instead.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — proxy.ts handles refresh.
          }
        },
      },
    },
  );
}
