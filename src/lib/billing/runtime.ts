import { timingSafeEqual } from "node:crypto";

export type BillingRuntimeEnv = {
  BILLING_ENABLED?: string;
  BILLING_CRON_SECRET?: string;
  [key: string]: string | undefined;
};

export function isBillingEnabled(
  env: BillingRuntimeEnv = process.env,
): boolean {
  return env.BILLING_ENABLED === "true";
}

function secretsMatch(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function requireCronSecret(
  request: Request,
  env: BillingRuntimeEnv = process.env,
): void {
  const configuredSecret = env.BILLING_CRON_SECRET?.trim();
  if (!isBillingEnabled(env) || !configuredSecret) {
    throw new Error("Billing is not configured");
  }

  const authorization = request.headers.get("authorization") ?? "";
  const suppliedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!suppliedSecret || !secretsMatch(suppliedSecret, configuredSecret)) {
    throw new Error("Forbidden");
  }
}
