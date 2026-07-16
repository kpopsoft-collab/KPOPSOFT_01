import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import { sql } from "drizzle-orm";
import { z } from "zod";

import { decryptWidgetSecret } from "./crypto.ts";
import { normalizeWidgetOrigin } from "./origins.ts";
import { requireWidgetTokenRuntime } from "./runtime.ts";

export type WidgetClaims = {
  iss: string;
  aud: "kpopsoft-billing-widget";
  siteId: string;
  sub: string;
  iat: number;
  exp: number;
  jti: string;
  kv: number;
};

export type WidgetVerificationRecord = {
  integrationId: string;
  publicId: string;
  siteId: string;
  customerId: string;
  allowedOrigin: string;
  keyVersion: number;
  integrationStatus: "ACTIVE" | "DISABLED";
  siteStatus: "ACTIVE" | "INACTIVE";
  customerStatus: "ACTIVE" | "INACTIVE";
  encryptedSecret: Uint8Array;
  secretIv: Uint8Array;
  secretTag: Uint8Array;
};

export type WidgetTokenUse = {
  integrationId: string;
  jtiHash: Uint8Array;
  originHash: Uint8Array;
  expiresAt: Date;
};

export type WidgetTokenRepository = {
  findVerificationRecord(
    siteId: string,
  ): Promise<WidgetVerificationRecord | null>;
  recordUse(input: WidgetTokenUse): Promise<boolean>;
};

export type VerifiedWidgetContext = {
  integrationId: string;
  publicId: string;
  siteId: string;
  customerId: string;
  subject: string;
  origin: string;
  keyVersion: number;
  expiresAt: string;
};

export type WidgetTokenVerifierConfig = {
  issuer: string;
  audience: "kpopsoft-billing-widget";
  masterKey: Uint8Array;
};

const claimsSchema = z
  .object({
    iss: z.string().min(1).max(256),
    aud: z.literal("kpopsoft-billing-widget"),
    siteId: z.string().uuid(),
    sub: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/),
    iat: z.number().int().safe(),
    exp: z.number().int().safe(),
    jti: z
      .string()
      .min(16)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/),
    kv: z.number().int().positive().safe(),
  })
  .strict();

class InvalidWidgetTokenError extends Error {
  constructor() {
    super("Invalid widget token");
    this.name = "InvalidWidgetTokenError";
  }
}

function canonicalClaims(claims: WidgetClaims): string {
  return JSON.stringify({
    iss: claims.iss,
    aud: claims.aud,
    siteId: claims.siteId,
    sub: claims.sub,
    iat: claims.iat,
    exp: claims.exp,
    jti: claims.jti,
    kv: claims.kv,
  });
}

function strictBase64Url(value: string): Buffer {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new InvalidWidgetTokenError();
  }
  const decoded = Buffer.from(value, "base64url");
  if (decoded.toString("base64url") !== value) {
    throw new InvalidWidgetTokenError();
  }
  return decoded;
}

function parseToken(token: string): {
  payload: string;
  claims: WidgetClaims;
  signature: Buffer;
} {
  if (Buffer.byteLength(token, "utf8") > 4096) {
    throw new InvalidWidgetTokenError();
  }
  const parts = token.split(".");
  if (parts.length !== 2) throw new InvalidWidgetTokenError();

  try {
    const payloadBytes = strictBase64Url(parts[0]);
    const payloadText = payloadBytes.toString("utf8");
    if (Buffer.from(payloadText, "utf8").compare(payloadBytes) !== 0) {
      throw new InvalidWidgetTokenError();
    }
    const claims = claimsSchema.parse(JSON.parse(payloadText));
    if (canonicalClaims(claims) !== payloadText) {
      throw new InvalidWidgetTokenError();
    }
    const signature = strictBase64Url(parts[1]);
    if (signature.byteLength !== 32) throw new InvalidWidgetTokenError();
    return { payload: parts[0], claims, signature };
  } catch (error) {
    if (error instanceof InvalidWidgetTokenError) throw error;
    throw new InvalidWidgetTokenError();
  }
}

function identifierHash(value: string): Uint8Array {
  return new Uint8Array(createHash("sha256").update(value, "utf8").digest());
}

function validatePolicy(
  claims: WidgetClaims,
  config: WidgetTokenVerifierConfig,
  now: number,
): void {
  if (
    claims.iss !== config.issuer ||
    claims.aud !== config.audience ||
    claims.iat > now + 30 ||
    claims.exp <= now ||
    claims.exp <= claims.iat ||
    claims.exp - claims.iat > 120
  ) {
    throw new InvalidWidgetTokenError();
  }
}

export function signWidgetToken(
  claims: WidgetClaims,
  secret: Uint8Array,
): string {
  if (secret.byteLength !== 32) throw new Error("Widget secret must be 32 bytes");
  let validated: WidgetClaims;
  try {
    validated = claimsSchema.parse(claims);
    if (
      normalizeWidgetOrigin(validated.iss) !== validated.iss ||
      validated.exp <= validated.iat ||
      validated.exp - validated.iat > 120
    ) {
      throw new Error("policy");
    }
  } catch {
    throw new Error("Invalid widget claims");
  }
  const payload = Buffer.from(canonicalClaims(validated), "utf8").toString(
    "base64url",
  );
  const signature = createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function createWidgetTokenVerifier(
  repository: WidgetTokenRepository,
  config: WidgetTokenVerifierConfig,
) {
  return async function verifyWidgetToken(input: {
    token: string;
    origin: string;
    now?: number;
  }): Promise<VerifiedWidgetContext> {
    try {
      if (config.masterKey.byteLength !== 32) {
        throw new InvalidWidgetTokenError();
      }
      const normalizedOrigin = normalizeWidgetOrigin(input.origin);
      const parsed = parseToken(input.token);
      const now = input.now ?? Math.floor(Date.now() / 1000);
      if (!Number.isSafeInteger(now)) throw new InvalidWidgetTokenError();
      validatePolicy(parsed.claims, config, now);

      const record = await repository.findVerificationRecord(
        parsed.claims.siteId,
      );
      if (
        !record ||
        record.siteId !== parsed.claims.siteId ||
        record.allowedOrigin !== normalizedOrigin ||
        record.keyVersion !== parsed.claims.kv ||
        record.integrationStatus !== "ACTIVE" ||
        record.siteStatus !== "ACTIVE" ||
        record.customerStatus !== "ACTIVE"
      ) {
        throw new InvalidWidgetTokenError();
      }

      const secret = decryptWidgetSecret(
        {
          ciphertext: record.encryptedSecret,
          iv: record.secretIv,
          tag: record.secretTag,
        },
        config.masterKey,
        {
          publicId: record.publicId,
          siteId: record.siteId,
          keyVersion: record.keyVersion,
        },
      );
      try {
        const expected = createHmac("sha256", secret)
          .update(parsed.payload, "utf8")
          .digest();
        if (
          expected.byteLength !== parsed.signature.byteLength ||
          !timingSafeEqual(expected, parsed.signature)
        ) {
          throw new InvalidWidgetTokenError();
        }
      } finally {
        secret.fill(0);
      }

      const accepted = await repository.recordUse({
        integrationId: record.integrationId,
        jtiHash: identifierHash(parsed.claims.jti),
        originHash: identifierHash(normalizedOrigin),
        expiresAt: new Date(parsed.claims.exp * 1000),
      });
      if (!accepted) throw new InvalidWidgetTokenError();

      return {
        integrationId: record.integrationId,
        publicId: record.publicId,
        siteId: record.siteId,
        customerId: record.customerId,
        subject: parsed.claims.sub,
        origin: normalizedOrigin,
        keyVersion: record.keyVersion,
        expiresAt: new Date(parsed.claims.exp * 1000).toISOString(),
      };
    } catch {
      throw new InvalidWidgetTokenError();
    }
  };
}

const defaultWidgetTokenRepository: WidgetTokenRepository = {
  async findVerificationRecord(siteId) {
    const [{ getDb }, schema] = await Promise.all([
      import("../../db"),
      import("../../db/schema"),
    ]);
    const [row] = await getDb()
      .select({
        integrationId: schema.billingWidgetIntegrations.id,
        publicId: schema.billingWidgetIntegrations.publicId,
        siteId: schema.billingWidgetIntegrations.siteId,
        customerId: schema.billingSites.customerId,
        allowedOrigin: schema.billingWidgetIntegrations.allowedOrigin,
        keyVersion: schema.billingWidgetIntegrations.keyVersion,
        integrationStatus: schema.billingWidgetIntegrations.status,
        siteStatus: schema.billingSites.status,
        customerStatus: schema.billingCustomers.status,
        encryptedSecret: schema.billingWidgetIntegrations.encryptedSecret,
        secretIv: schema.billingWidgetIntegrations.secretIv,
        secretTag: schema.billingWidgetIntegrations.secretTag,
      })
      .from(schema.billingWidgetIntegrations)
      .innerJoin(
        schema.billingSites,
        sql`${schema.billingSites.id} = ${schema.billingWidgetIntegrations.siteId}`,
      )
      .innerJoin(
        schema.billingCustomers,
        sql`${schema.billingCustomers.id} = ${schema.billingSites.customerId}`,
      )
      .where(sql`${schema.billingWidgetIntegrations.siteId} = ${siteId}::uuid`)
      .limit(1);
    return row ?? null;
  },

  async recordUse(input) {
    const [{ getDb }, schema] = await Promise.all([
      import("../../db"),
      import("../../db/schema"),
    ]);
    const result = await getDb().execute(sql`
      with accepted as (
        insert into ${schema.billingWidgetTokenUses}
          (id, integration_id, jti_hash, origin_hash, expires_at,
           first_used_at, last_used_at, use_count, created_at)
        values (
          ${randomUUID()}::uuid, ${input.integrationId}::uuid,
          ${input.jtiHash}, ${input.originHash}, ${input.expiresAt},
          now(), now(), 1, now()
        )
        on conflict (jti_hash) do update
        set last_used_at = now(),
            use_count = ${schema.billingWidgetTokenUses.useCount} + 1
        where ${schema.billingWidgetTokenUses.integrationId} = excluded.integration_id
          and ${schema.billingWidgetTokenUses.originHash} = excluded.origin_hash
          and ${schema.billingWidgetTokenUses.expiresAt} = excluded.expires_at
          and ${schema.billingWidgetTokenUses.expiresAt} > now()
          and ${schema.billingWidgetTokenUses.useCount} < 4
        returning integration_id
      ), touched as (
        update ${schema.billingWidgetIntegrations}
        set last_used_at = now(), updated_at = now()
        where id in (select integration_id from accepted)
        returning id
      )
      select exists(select 1 from accepted) as accepted
    `);
    return (result.rows[0] as { accepted?: boolean } | undefined)?.accepted === true;
  },
};

export async function verifyWidgetToken(input: {
  token: string;
  origin: string;
  now?: number;
}): Promise<VerifiedWidgetContext> {
  return createWidgetTokenVerifier(
    defaultWidgetTokenRepository,
    requireWidgetTokenRuntime(),
  )(input);
}
