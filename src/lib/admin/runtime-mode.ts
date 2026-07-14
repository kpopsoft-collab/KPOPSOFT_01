/**
 * Runtime policy for admin-only development helpers.
 *
 * Mock data and auth bypass are deliberately opt-in and are impossible in a
 * production build. Keeping this logic pure makes the fail-closed contract
 * easy to test without loading Next.js or Neon.
 */
export type RuntimeEnv = Partial<
  Record<
    | "NODE_ENV"
    | "ADMIN_DEV_BYPASS"
    | "DATABASE_URL",
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
): "neon" | "mock" | "misconfigured" {
  if (env.DATABASE_URL?.trim()) return "neon";
  return isAdminDevBypassEnabled(env) ? "mock" : "misconfigured";
}
