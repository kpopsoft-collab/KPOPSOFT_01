/**
 * 관리자 세션 토큰 — HMAC-SHA256 서명 쿠키.
 *
 * Web Crypto만 써서 proxy.ts와 서버 컴포넌트/액션 양쪽에서 같은 코드로
 * 검증한다. 토큰 모양: `<payload b64url>.<signature b64url>`.
 *
 * proxy는 서명·만료만 본다(빠른 리다이렉트용). 실제 권한 판단은
 * `getAdminSession()`(auth.ts)이 DB에서 계정이 아직 있는지까지 확인한다 —
 * 삭제된 관리자의 쿠키가 만료 전까지 살아 있는 일을 막기 위해서다.
 */

export const ADMIN_SESSION_COOKIE = "kpopsoft_admin_session";
/** 7일. */
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type AdminSessionPayload = { sub: string; username: string; exp: number };

const encoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function getSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  // 짧은 비밀은 무차별 대입에 약하다. 설정 실수를 조용히 넘기지 않게 거부한다.
  return secret && secret.length >= 32 ? secret : null;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signAdminSession(
  payload: Omit<AdminSessionPayload, "exp">,
): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET must be set (32+ chars)");
  const full: AdminSessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE,
  };
  const body = b64url(encoder.encode(JSON.stringify(full)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(body));
  return `${body}.${b64url(new Uint8Array(sig))}`;
}

export async function verifyAdminSession(
  token: string | undefined,
): Promise<AdminSessionPayload | null> {
  const secret = getSecret();
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromB64url(sig),
      encoder.encode(body),
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as AdminSessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    if (typeof payload.sub !== "string" || typeof payload.username !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}
