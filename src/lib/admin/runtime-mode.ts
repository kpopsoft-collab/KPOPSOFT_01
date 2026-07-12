/**
 * Runtime policy for admin-only development helpers.
 *
 * Mock data and auth bypass are deliberately opt-in and are impossible in a
 * production build. Keeping this logic pure makes the fail-closed contract
 * easy to test without loading Next.js or Supabase.
 */
export type RuntimeEnv = Partial<
  Record<
    | "NODE_ENV"
    | "ADMIN_DEV_BYPASS"
    | "NEXT_PUBLIC_SUPABASE_URL"
    | "SUPABASE_SERVICE_ROLE_KEY",
    string
  >
>;

export function isAdminDevBypassEnabled(
  env: RuntimeEnv = process.env,
): boolean {
  return env.NODE_ENV !== "production" && env.ADMIN_DEV_BYPASS === "true";
}

export function resolveAdminDataMode(
  env: RuntimeEnv = process.env,
): "supabase" | "mock" | "misconfigured" {
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    return "supabase";
  }
  return isAdminDevBypassEnabled(env) ? "mock" : "misconfigured";
}
