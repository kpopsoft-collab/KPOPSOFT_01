import { createClient } from "@supabase/supabase-js";

/**
 * Public read-only Supabase client — anon key, no session/cookies. Because it
 * never carries an auth session, `is_admin()` is always false for it, so RLS
 * returns only published/active rows regardless of who is browsing. Use for
 * public-site reads (docs/어드민기획.md §5).
 */
export function createSupabasePublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
