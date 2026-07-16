export type BankTransferConfig = {
  bank: string;
  accountNumber: string;
  holder: string;
};

export type TossServerConfig = {
  secretKey: string;
  mid: string;
  apiBase: string;
  mode: "test" | "live";
};

export type PaymentEnv = {
  NODE_ENV?: string;
  BANK_TRANSFER_ENABLED?: string;
  BANK_ACCOUNT_BANK?: string;
  BANK_ACCOUNT_NUMBER?: string;
  BANK_ACCOUNT_HOLDER?: string;
  TOSS_PAYMENTS_ENABLED?: string;
  TOSS_PAYMENTS_CLIENT_KEY?: string;
  TOSS_PAYMENTS_SECRET_KEY?: string;
  TOSS_PAYMENTS_MID?: string;
  TOSS_PAYMENTS_API_BASE?: string;
  [key: string]: string | undefined;
};

function cleanDisplay(
  value: string | undefined,
  min: number,
  max: number,
): string | null {
  const normalized = value?.trim() ?? "";
  if (
    normalized.length < min ||
    normalized.length > max ||
    /[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

export function bankTransferConfig(
  env: PaymentEnv = process.env,
): BankTransferConfig | null {
  if (env.BANK_TRANSFER_ENABLED !== "true") return null;
  const bank = cleanDisplay(env.BANK_ACCOUNT_BANK, 2, 100);
  const accountNumber = cleanDisplay(env.BANK_ACCOUNT_NUMBER, 4, 64);
  const holder = cleanDisplay(env.BANK_ACCOUNT_HOLDER, 1, 100);
  if (
    !bank ||
    !accountNumber ||
    !holder ||
    !/^[0-9 -]+$/.test(accountNumber)
  ) {
    return null;
  }
  return { bank, accountNumber, holder };
}

type TossKeyPair = {
  clientKey: string;
  secretKey: string;
  mode: "test" | "live";
};

function tossKeys(env: PaymentEnv): TossKeyPair | null {
  const clientKey = env.TOSS_PAYMENTS_CLIENT_KEY?.trim() ?? "";
  const secretKey = env.TOSS_PAYMENTS_SECRET_KEY?.trim() ?? "";
  const client = clientKey.match(/^(test|live)_gck_[A-Za-z0-9_-]{8,}$/);
  const secret = secretKey.match(/^(test|live)_gsk_[A-Za-z0-9_-]{8,}$/);
  if (!client || !secret || client[1] !== secret[1]) return null;
  return {
    clientKey,
    secretKey,
    mode: client[1] as "test" | "live",
  };
}

function tossApiBase(env: PaymentEnv): string | null {
  const official = "https://api.tosspayments.com";
  const configured = env.TOSS_PAYMENTS_API_BASE?.trim() || official;
  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    return null;
  }
  if (
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    return null;
  }
  if (env.NODE_ENV === "production") {
    return parsed.origin === official ? official : null;
  }
  if (parsed.protocol === "https:") return parsed.origin;
  const local =
    parsed.protocol === "http:" &&
    ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname);
  return local ? parsed.origin : null;
}

export function tossServerConfig(
  env: PaymentEnv = process.env,
): TossServerConfig | null {
  if (env.TOSS_PAYMENTS_ENABLED !== "true") return null;
  const keys = tossKeys(env);
  const mid = cleanDisplay(env.TOSS_PAYMENTS_MID, 1, 14);
  const apiBase = tossApiBase(env);
  if (!keys || !mid || !apiBase || !/^[A-Za-z0-9_-]+$/.test(mid)) {
    return null;
  }
  return {
    secretKey: keys.secretKey,
    mid,
    apiBase,
    mode: keys.mode,
  };
}

export function tossPublicConfig(
  env: PaymentEnv = process.env,
): { clientKey: string } | null {
  const server = tossServerConfig(env);
  const keys = tossKeys(env);
  if (!server || !keys) return null;
  return { clientKey: keys.clientKey };
}
