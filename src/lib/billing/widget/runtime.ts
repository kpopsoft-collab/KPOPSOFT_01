export type BillingWidgetEnv = {
  BILLING_WIDGET_MASTER_KEY?: string;
  BILLING_WIDGET_ISSUER?: string;
  BILLING_WIDGET_AUDIENCE?: string;
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
