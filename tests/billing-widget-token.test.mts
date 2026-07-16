import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import {
  createWidgetTokenVerifier,
  signWidgetToken,
  type WidgetClaims,
  type WidgetTokenRepository,
  type WidgetVerificationRecord,
} from "../src/lib/billing/widget/tokens.ts";
import { encryptWidgetSecret } from "../src/lib/billing/widget/crypto.ts";

const siteId = "22222222-2222-4222-8222-222222222222";
const customerId = "44444444-4444-4444-8444-444444444444";
const integrationId = "33333333-3333-4333-8333-333333333333";
const publicId = "wgt_live_public_identifier";
const origin = "https://client.example.com";
const issuer = "https://pay.kpopsoft.com";
const audience = "kpopsoft-billing-widget" as const;
const now = 1_783_846_800;
const secret = new Uint8Array(32).fill(23);
const masterKey = new Uint8Array(32).fill(7);

function claims(overrides: Partial<WidgetClaims> = {}): WidgetClaims {
  return {
    iss: issuer,
    aud: audience,
    siteId,
    sub: "user_opaque_42",
    iat: now,
    exp: now + 120,
    jti: "jti_1234567890abcdef",
    kv: 1,
    ...overrides,
  };
}

function record(
  overrides: Partial<WidgetVerificationRecord> = {},
): WidgetVerificationRecord {
  const encrypted = encryptWidgetSecret(secret, masterKey, {
    publicId,
    siteId,
    keyVersion: 1,
  });
  return {
    integrationId,
    publicId,
    siteId,
    customerId,
    allowedOrigin: origin,
    keyVersion: 1,
    integrationStatus: "ACTIVE",
    siteStatus: "ACTIVE",
    customerStatus: "ACTIVE",
    encryptedSecret: encrypted.ciphertext,
    secretIv: encrypted.iv,
    secretTag: encrypted.tag,
    ...overrides,
  };
}

function repository(
  value: WidgetVerificationRecord | null = record(),
): WidgetTokenRepository & { acceptedUses: number } {
  const uses = new Map<string, { originHash: string; count: number }>();
  return {
    acceptedUses: 0,
    async findVerificationRecord(inputSiteId) {
      return inputSiteId === value?.siteId ? value : null;
    },
    async recordUse(input) {
      const key = Buffer.from(input.jtiHash).toString("hex");
      const originHash = Buffer.from(input.originHash).toString("hex");
      const current = uses.get(key);
      if (current && (current.originHash !== originHash || current.count >= 4)) {
        return false;
      }
      uses.set(key, { originHash, count: (current?.count ?? 0) + 1 });
      this.acceptedUses += 1;
      return true;
    },
  };
}

function verifier(repo = repository()) {
  return {
    repo,
    verify: createWidgetTokenVerifier(repo, {
      issuer,
      audience,
      masterKey,
    }),
  };
}

function rawToken(payload: string, signingSecret = secret): string {
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const signature = createHmac("sha256", signingSecret)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

test("signing uses the exact canonical claim order and HMAC-SHA256", () => {
  const token = signWidgetToken(claims(), secret);
  const [payload, signature] = token.split(".");
  assert.equal(
    Buffer.from(payload, "base64url").toString("utf8"),
    `{"iss":"${issuer}","aud":"${audience}","siteId":"${siteId}","sub":"user_opaque_42","iat":${now},"exp":${now + 120},"jti":"jti_1234567890abcdef","kv":1}`,
  );
  assert.equal(
    signature,
    createHmac("sha256", secret).update(payload).digest("base64url"),
  );
});

test("the signer refuses non-opaque or overlong claims before issuing a token", () => {
  assert.throws(
    () => signWidgetToken(claims({ sub: "person@example.com" }), secret),
    /claim/i,
  );
  assert.throws(
    () => signWidgetToken(claims({ exp: now + 121 }), secret),
    /claim/i,
  );
});

test("a valid token yields only site-scoped verified context", async () => {
  const { verify, repo } = verifier();
  const context = await verify({
    token: signWidgetToken(claims(), secret),
    origin,
    now,
  });
  assert.deepEqual(context, {
    integrationId,
    publicId,
    siteId,
    customerId,
    subject: "user_opaque_42",
    origin,
    keyVersion: 1,
    expiresAt: new Date((now + 120) * 1000).toISOString(),
  });
  assert.equal(repo.acceptedUses, 1);
  assert.doesNotMatch(JSON.stringify(context), /email|amount|invoice/i);
});

test("tampering, wrong secrets, and malformed compact tokens are rejected", async () => {
  const { verify } = verifier();
  const valid = signWidgetToken(claims(), secret);
  const [payload, signature] = valid.split(".");
  const changedPayload = `${payload.slice(0, -1)}${payload.endsWith("A") ? "B" : "A"}`;

  for (const token of [
    `${changedPayload}.${signature}`,
    signWidgetToken(claims(), new Uint8Array(32).fill(88)),
    "",
    "one-part",
    "three.parts.here",
    "*.bad",
    `${payload}.AA`,
    `${"a".repeat(4097)}.${signature}`,
  ]) {
    await assert.rejects(verify({ token, origin, now }), /widget token/i);
  }
});

test("strict canonical parsing rejects unknown, duplicate, missing, and personal claims", async () => {
  const { verify } = verifier();
  const base = claims();
  const payloads = [
    JSON.stringify({ ...base, email: "person@example.com" }),
    `{"iss":"${issuer}","iss":"${issuer}","aud":"${audience}","siteId":"${siteId}","sub":"user_opaque_42","iat":${now},"exp":${now + 120},"jti":"jti_1234567890abcdef","kv":1}`,
    JSON.stringify({ ...base, jti: undefined }),
    JSON.stringify({ ...base, sub: "person@example.com" }),
    ` {"iss":"${issuer}","aud":"${audience}","siteId":"${siteId}","sub":"user_opaque_42","iat":${now},"exp":${now + 120},"jti":"jti_1234567890abcdef","kv":1}`,
  ];

  for (const payload of payloads) {
    await assert.rejects(
      verify({ token: rawToken(payload), origin, now }),
      /widget token/i,
    );
  }
});

test("issuer, audience, site, key version, origin, and active state are exact", async () => {
  const cases: Array<{
    token: string;
    requestOrigin?: string;
    row?: WidgetVerificationRecord | null;
  }> = [
    { token: signWidgetToken(claims({ iss: "https://wrong.example" }), secret) },
    {
      token: rawToken(
        JSON.stringify({ ...claims(), aud: "wrong" }),
      ),
    },
    { token: signWidgetToken(claims({ siteId: integrationId }), secret), row: null },
    { token: signWidgetToken(claims({ kv: 2 }), secret) },
    { token: signWidgetToken(claims(), secret), requestOrigin: "https://evil.example" },
    {
      token: signWidgetToken(claims(), secret),
      row: record({ integrationStatus: "DISABLED" }),
    },
    {
      token: signWidgetToken(claims(), secret),
      row: record({ siteStatus: "INACTIVE" }),
    },
    {
      token: signWidgetToken(claims(), secret),
      row: record({ customerStatus: "INACTIVE" }),
    },
  ];

  for (const input of cases) {
    const repo = repository(input.row === undefined ? record() : input.row);
    const verify = verifier(repo).verify;
    await assert.rejects(
      verify({
        token: input.token,
        origin: input.requestOrigin ?? origin,
        now,
      }),
      /widget token/i,
    );
    assert.equal(repo.acceptedUses, 0);
  }
});

test("time policy rejects future, long-lived, expired, and reversed claims", async () => {
  const { verify } = verifier();
  for (const input of [
    claims({ iat: now + 31, exp: now + 120 }),
    claims({ exp: now + 121 }),
    claims({ iat: now - 121, exp: now - 1 }),
    claims({ iat: now, exp: now }),
  ]) {
    await assert.rejects(
      verify({ token: rawToken(JSON.stringify(input)), origin, now }),
      /widget token/i,
    );
  }
});

test("the same token is capped at four uses and never accepted from another origin", async () => {
  const { verify, repo } = verifier();
  const token = signWidgetToken(claims(), secret);
  for (let index = 0; index < 4; index += 1) {
    await verify({ token, origin, now });
  }
  await assert.rejects(verify({ token, origin, now }), /widget token/i);
  await assert.rejects(
    verify({ token, origin: "https://other.example.com", now }),
    /widget token/i,
  );
  assert.equal(repo.acceptedUses, 4);
});
