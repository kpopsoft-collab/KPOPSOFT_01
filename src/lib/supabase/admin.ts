import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses RLS. SERVER ONLY.
 * `import "server-only"` makes the build fail if this ever leaks into a client
 * bundle. Use only where the anon/RLS path can't express the operation
 * (e.g. bootstrapping the first admin). Prefer the anon server client otherwise.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
