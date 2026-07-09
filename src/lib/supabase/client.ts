import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser (client-component) Supabase client — anon key, cookie-based session.
 * Safe to expose; RLS enforces access (docs/어드민기획.md §5).
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
