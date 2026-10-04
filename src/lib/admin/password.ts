import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * 관리자 비밀번호 해시 — Node 내장 scrypt (외부 의존성 없음).
 * 저장 형식: `scrypt$N$r$p$<salt b64>$<hash b64>` — 파라미터를 함께 저장해
 * 나중에 비용을 올려도 기존 해시를 그대로 검증할 수 있다.
 *
 * scripts/admin-user.ts 가 같은 형식을 만든다(서버 전용 모듈이라 거기서는
 * 이 파일을 import하지 않고 같은 로직을 쓴다).
 */
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

function scryptAsync(password: string, salt: Buffer, n: number, r: number, p: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEYLEN, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, N, R, P);
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scryptAsync(
    password,
    Buffer.from(saltB64, "base64"),
    Number(n),
    Number(r),
    Number(p),
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
