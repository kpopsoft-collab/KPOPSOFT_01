export type BillingWidgetEnv = {
  BILLING_WIDGET_MASTER_KEY?: string;
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
