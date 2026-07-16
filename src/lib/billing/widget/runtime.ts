export type BillingWidgetEnv = {
  BILLING_ENABLED?: string;
  BILLING_WIDGET_ENABLED?: string;
  BILLING_WIDGET_MASTER_KEY?: string;
  BILLING_WIDGET_ISSUER?: string;
  BILLING_WIDGET_AUDIENCE?: string;
  BILLING_RATE_LIMIT_HASH_KEY?: string;
  BILLING_PAY_SESSION_KEY?: string;
  BILLING_PAY_HOST?: string;
  [key: string]: string | undefined;
};

function requireBase64Key(name: string, value: string | undefined): Uint8Array {
  const normalized = value?.trim() ?? "";
  if (!/^[A-Za-z0-9+/]{43}=$/.test(normalized)) {
    throw new Error(`${name} must be canonical base64 for exactly 32 bytes`);
  }

  const decoded = Buffer.from(normalized, "base64");
  if (
    decoded.byteLength !== 32 ||
    decoded.toString("base64") !== normalized
  ) {
    throw new Error(`${name} must be canonical base64 for exactly 32 bytes`);
  }
  return new Uint8Array(decoded);
}

export function isBillingWidgetEnabled(
  env: BillingWidgetEnv = process.env,
): boolean {
  return (
    env.BILLING_ENABLED === "true" &&
    env.BILLING_WIDGET_ENABLED === "true"
  );
}

export function requireWidgetMasterKey(
  env: BillingWidgetEnv = process.env,
): Uint8Array {
  return requireBase64Key(
    "BILLING_WIDGET_MASTER_KEY",
    env.BILLING_WIDGET_MASTER_KEY,
  );
}

export type WidgetTokenRuntime = {
  masterKey: Uint8Array;
  issuer: string;
  audience: "kpopsoft-billing-widget";
};

export function requireWidgetTokenRuntime(
  env: BillingWidgetEnv = process.env,
): WidgetTokenRuntime {
  const issuerValue = env.BILLING_WIDGET_ISSUER?.trim() ?? "";
  let issuer: URL;
  try {
    issuer = new URL(issuerValue);
  } catch {
    throw new Error("BILLING_WIDGET_ISSUER must be an exact HTTPS origin");
  }
  if (
    issuer.protocol !== "https:" ||
    issuer.pathname !== "/" ||
    issuer.search ||
    issuer.hash ||
    issuer.username ||
    issuer.password
  ) {
    throw new Error("BILLING_WIDGET_ISSUER must be an exact HTTPS origin");
  }
  if (env.BILLING_WIDGET_AUDIENCE !== "kpopsoft-billing-widget") {
    throw new Error(
      "BILLING_WIDGET_AUDIENCE must be kpopsoft-billing-widget",
    );
  }

  return {
    masterKey: requireWidgetMasterKey(env),
    issuer: issuer.origin,
    audience: "kpopsoft-billing-widget",
  };
}

export function requireWidgetRateLimitHashKey(
  env: BillingWidgetEnv = process.env,
): Uint8Array {
  const key = requireBase64Key(
    "BILLING_RATE_LIMIT_HASH_KEY",
    env.BILLING_RATE_LIMIT_HASH_KEY,
  );
  const masterKey = requireWidgetMasterKey(env);
  if (Buffer.from(key).equals(Buffer.from(masterKey))) {
    throw new Error(
      "BILLING_RATE_LIMIT_HASH_KEY must differ from BILLING_WIDGET_MASTER_KEY",
    );
  }
  return key;
}

export type PaySessionRuntime = {
  key: Uint8Array;
  host: string;
};

export function requirePaySessionRuntime(
  env: BillingWidgetEnv = process.env,
): PaySessionRuntime {
  const key = requireBase64Key(
    "BILLING_PAY_SESSION_KEY",
    env.BILLING_PAY_SESSION_KEY,
  );
  const host = env.BILLING_PAY_HOST?.trim().toLowerCase() ?? "";
  if (
    !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(host) ||
    host.includes("..")
  ) {
    throw new Error("BILLING_PAY_HOST must be an exact hostname");
  }
  const masterKey = requireWidgetMasterKey(env);
  const rateKey = requireWidgetRateLimitHashKey(env);
  if (
    Buffer.from(key).equals(Buffer.from(masterKey)) ||
    Buffer.from(key).equals(Buffer.from(rateKey))
  ) {
    throw new Error("BILLING_PAY_SESSION_KEY must be distinct from widget keys");
  }
  return { key, host };
}
