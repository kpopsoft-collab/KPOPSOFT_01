export type DatabaseEnv = Readonly<Record<string, string | undefined>>;

export function hasDatabaseUrl(
  env: DatabaseEnv = process.env,
): boolean {
  return Boolean(env.DATABASE_URL?.trim());
}

export function requireDatabaseUrl(
  env: DatabaseEnv = process.env,
): string {
  const url = env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  return url;
}
