import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { requirePaySessionRuntime } from "./runtime.ts";

export const PAYMENT_SESSION_COOKIE_NAME = "__Host-kpopsoft-pay";

export type PaymentSessionClaims = {
  sessionId: string;
  siteId: string;
  customerId: string;
  issuedAt: string;
  expiresAt: string;
  absoluteExpiresAt: string;
};

export type PaymentSessionCookieOptions = {
  secure: true;
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  domain: undefined;
  maxAge: number;
  expires: Date;
};

export type PaymentSessionCookie = {
  name: typeof PAYMENT_SESSION_COOKIE_NAME;
  value: string;
  options: PaymentSessionCookieOptions;
};

export type PaymentPortalData = {
  customerName: string;
  siteName: string;
  invoices: Array<{
    number: string;
    status: "OPEN" | "OVERDUE";
    issueDate: string;
    dueDate: string;
    supplyAmount: number;
    vatAmount: number;
    totalAmount: number;
    items: Array<{
      productName: string;
      description: string;
      quantity: number;
      unitSupplyAmount: number;
      supplyAmount: number;
      vatAmount: number;
      totalAmount: number;
    }>;
  }>;
};

export type PaymentSessionRepository = {
  refresh(input: {
    sessionHash: Uint8Array;
    siteId: string;
    customerId: string;
    now: Date;
    idleExpiresAt: Date;
  }): Promise<{ expiresAt: Date; absoluteExpiresAt: Date } | null>;
  loadPortal(input: {
    siteId: string;
    customerId: string;
  }): Promise<PaymentPortalData>;
};

const claimsSchema = z
  .object({
    sessionId: z.string().length(43).regex(/^[A-Za-z0-9_-]+$/),
    siteId: z.string().uuid(),
    customerId: z.string().uuid(),
    issuedAt: z.string().datetime({ offset: true }),
    expiresAt: z.string().datetime({ offset: true }),
    absoluteExpiresAt: z.string().datetime({ offset: true }),
  })
  .strict();

export class PaymentSessionError extends Error {
  constructor() {
    super("Invalid payment session");
    this.name = "PaymentSessionError";
  }
}

function canonicalClaims(claims: PaymentSessionClaims): string {
  return JSON.stringify({
    sessionId: claims.sessionId,
    siteId: claims.siteId,
    customerId: claims.customerId,
    issuedAt: claims.issuedAt,
    expiresAt: claims.expiresAt,
    absoluteExpiresAt: claims.absoluteExpiresAt,
  });
}

function strictBase64Url(value: string): Buffer {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new PaymentSessionError();
  }
  const result = Buffer.from(value, "base64url");
  if (result.toString("base64url") !== value) {
    throw new PaymentSessionError();
  }
  return result;
}

function validateClaims(input: unknown): PaymentSessionClaims {
  try {
    const claims = claimsSchema.parse(input);
    const issuedAt = Date.parse(claims.issuedAt);
    const expiresAt = Date.parse(claims.expiresAt);
    const absoluteExpiresAt = Date.parse(claims.absoluteExpiresAt);
    if (
      !Number.isFinite(issuedAt) ||
      !Number.isFinite(expiresAt) ||
      !Number.isFinite(absoluteExpiresAt) ||
      expiresAt <= issuedAt ||
      absoluteExpiresAt < expiresAt ||
      absoluteExpiresAt - issuedAt > 2 * 60 * 60 * 1000
    ) {
      throw new Error("policy");
    }
    return claims;
  } catch {
    throw new PaymentSessionError();
  }
}

function sessionHash(sessionId: string): Uint8Array {
  return new Uint8Array(
    createHash("sha256").update(sessionId, "utf8").digest(),
  );
}

function exactHost(value: string): string {
  const host = value.trim().toLowerCase();
  if (!host) throw new PaymentSessionError();
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    if (end < 0) throw new PaymentSessionError();
    return host.slice(0, end + 1);
  }
  return host.split(":")[0];
}

export function createPaymentSessionCodec(
  key: Uint8Array,
  randomIv: () => Uint8Array = () => new Uint8Array(randomBytes(12)),
) {
  if (key.byteLength !== 32) throw new Error("Payment session key must be 32 bytes");
  const aad = Buffer.from("kpopsoft-pay-session-v1", "utf8");

  return {
    createCookie(
      input: PaymentSessionClaims,
      now = new Date(),
    ): PaymentSessionCookie {
      const claims = validateClaims(input);
      const iv = randomIv();
      if (iv.byteLength !== 12) throw new Error("Payment session IV must be 12 bytes");
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      cipher.setAAD(aad);
      const encrypted = Buffer.concat([
        cipher.update(canonicalClaims(claims), "utf8"),
        cipher.final(),
      ]);
      const expires = new Date(claims.expiresAt);
      const maxAge = Math.max(
        0,
        Math.min(1800, Math.floor((expires.getTime() - now.getTime()) / 1000)),
      );
      return {
        name: PAYMENT_SESSION_COOKIE_NAME,
        value: [
          "v1",
          Buffer.from(iv).toString("base64url"),
          encrypted.toString("base64url"),
          cipher.getAuthTag().toString("base64url"),
        ].join("."),
        options: {
          secure: true,
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          domain: undefined,
          maxAge,
          expires,
        },
      };
    },

    decode(value: string): PaymentSessionClaims {
      try {
        if (Buffer.byteLength(value, "utf8") > 4096) {
          throw new PaymentSessionError();
        }
        const [version, ivText, ciphertextText, tagText, ...extra] = value.split(".");
        if (version !== "v1" || extra.length) throw new PaymentSessionError();
        const iv = strictBase64Url(ivText);
        const ciphertext = strictBase64Url(ciphertextText);
        const tag = strictBase64Url(tagText);
        if (iv.byteLength !== 12 || tag.byteLength !== 16) {
          throw new PaymentSessionError();
        }
        const decipher = createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAAD(aad);
        decipher.setAuthTag(tag);
        const plaintext = Buffer.concat([
          decipher.update(ciphertext),
          decipher.final(),
        ]).toString("utf8");
        const claims = validateClaims(JSON.parse(plaintext));
        if (plaintext !== canonicalClaims(claims)) throw new PaymentSessionError();
        return claims;
      } catch {
        throw new PaymentSessionError();
      }
    },
  };
}

export function createPaymentSessionCommands(
  repository: PaymentSessionRepository,
  options: {
    codec: ReturnType<typeof createPaymentSessionCodec>;
    payHost: string;
    now?: () => Date;
  },
) {
  const now = options.now ?? (() => new Date());
  return {
    async requirePaymentSession(input: {
      cookieValue: string;
      host: string;
    }): Promise<PaymentSessionClaims> {
      try {
        if (exactHost(input.host) !== options.payHost.toLowerCase()) {
          throw new PaymentSessionError();
        }
        const claims = options.codec.decode(input.cookieValue);
        const current = now();
        const currentMs = current.getTime();
        const expiresMs = Date.parse(claims.expiresAt);
        const absoluteMs = Date.parse(claims.absoluteExpiresAt);
        if (currentMs >= expiresMs || currentMs >= absoluteMs) {
          throw new PaymentSessionError();
        }
        const idleExpiresAt = new Date(
          Math.min(currentMs + 30 * 60 * 1000, absoluteMs),
        );
        const refreshed = await repository.refresh({
          sessionHash: sessionHash(claims.sessionId),
          siteId: claims.siteId,
          customerId: claims.customerId,
          now: current,
          idleExpiresAt,
        });
        if (
          !refreshed ||
          refreshed.expiresAt.getTime() <= currentMs ||
          refreshed.absoluteExpiresAt.getTime() !== absoluteMs
        ) {
          throw new PaymentSessionError();
        }
        return {
          ...claims,
          expiresAt: refreshed.expiresAt.toISOString(),
        };
      } catch {
        throw new PaymentSessionError();
      }
    },

    loadPaymentPortal(claims: PaymentSessionClaims): Promise<PaymentPortalData> {
      return repository.loadPortal({
        siteId: claims.siteId,
        customerId: claims.customerId,
      });
    },
  };
}

const defaultPaymentSessionRepository: PaymentSessionRepository = {
  async refresh(input) {
    const [{ getDb }, schema] = await Promise.all([
      import("../../db"),
      import("../../db/schema"),
    ]);
    const result = await getDb().execute(sql`
      update ${schema.billingPaymentSessions} session
      set expires_at = least(${input.idleExpiresAt}, session.absolute_expires_at),
          last_seen_at = ${input.now},
          updated_at = ${input.now}
      where session.session_hash = ${input.sessionHash}
        and session.site_id = ${input.siteId}::uuid
        and session.customer_id = ${input.customerId}::uuid
        and session.revoked_at is null
        and session.expires_at > ${input.now}
        and session.absolute_expires_at > ${input.now}
        and exists (
          select 1
          from ${schema.billingSites} site
          inner join ${schema.billingCustomers} customer
            on customer.id = site.customer_id
          where site.id = session.site_id
            and customer.id = session.customer_id
            and site.status = 'ACTIVE'
            and customer.status = 'ACTIVE'
        )
      returning session.expires_at, session.absolute_expires_at
    `);
    const row = result.rows[0] as
      | { expires_at: Date | string; absolute_expires_at: Date | string }
      | undefined;
    return row
      ? {
          expiresAt: new Date(row.expires_at),
          absoluteExpiresAt: new Date(row.absolute_expires_at),
        }
      : null;
  },

  async loadPortal(input) {
    const [{ getDb }, schema] = await Promise.all([
      import("../../db"),
      import("../../db/schema"),
    ]);
    const db = getDb();
    const [scope] = await db
      .select({
        customerName: schema.billingCustomers.name,
        siteName: schema.billingSites.name,
      })
      .from(schema.billingSites)
      .innerJoin(
        schema.billingCustomers,
        sql`${schema.billingCustomers.id} = ${schema.billingSites.customerId}`,
      )
      .where(sql`
        ${schema.billingSites.id} = ${input.siteId}::uuid
        and ${schema.billingCustomers.id} = ${input.customerId}::uuid
        and ${schema.billingSites.status} = 'ACTIVE'
        and ${schema.billingCustomers.status} = 'ACTIVE'
      `)
      .limit(1);
    if (!scope) throw new PaymentSessionError();

    const invoices = await db
      .select({
        id: schema.billingInvoices.id,
        number: schema.billingInvoices.number,
        status: schema.billingInvoices.status,
        issueDate: schema.billingInvoices.issueDate,
        dueDate: schema.billingInvoices.dueDate,
        supplyAmount: schema.billingInvoices.supplyAmount,
        vatAmount: schema.billingInvoices.vatAmount,
        totalAmount: schema.billingInvoices.totalAmount,
      })
      .from(schema.billingInvoices)
      .where(sql`
        ${schema.billingInvoices.siteId} = ${input.siteId}::uuid
        and ${schema.billingInvoices.customerId} = ${input.customerId}::uuid
        and ${schema.billingInvoices.status} in ('OPEN', 'OVERDUE')
      `)
      .orderBy(schema.billingInvoices.dueDate);
    const items = invoices.length
      ? await db
          .select({
            invoiceId: schema.billingInvoiceItems.invoiceId,
            productName: schema.billingInvoiceItems.productName,
            description: schema.billingInvoiceItems.description,
            quantity: schema.billingInvoiceItems.quantity,
            unitSupplyAmount: schema.billingInvoiceItems.unitSupplyAmount,
            supplyAmount: schema.billingInvoiceItems.supplyAmount,
            vatAmount: schema.billingInvoiceItems.vatAmount,
            totalAmount: schema.billingInvoiceItems.totalAmount,
            sortOrder: schema.billingInvoiceItems.sortOrder,
          })
          .from(schema.billingInvoiceItems)
          .where(
            inArray(
              schema.billingInvoiceItems.invoiceId,
              invoices.map((invoice) => invoice.id),
            ),
          )
          .orderBy(schema.billingInvoiceItems.sortOrder)
      : [];
    return {
      ...scope,
      invoices: invoices.map((invoice) => ({
        ...invoice,
        status: invoice.status as "OPEN" | "OVERDUE",
        items: items
          .filter((item) => item.invoiceId === invoice.id)
          .map((item) => ({
            productName: item.productName,
            description: item.description,
            quantity: item.quantity,
            unitSupplyAmount: item.unitSupplyAmount,
            supplyAmount: item.supplyAmount,
            vatAmount: item.vatAmount,
            totalAmount: item.totalAmount,
          })),
      })),
    };
  },
};

function defaultCommands() {
  const runtime = requirePaySessionRuntime();
  return {
    runtime,
    commands: createPaymentSessionCommands(defaultPaymentSessionRepository, {
      codec: createPaymentSessionCodec(runtime.key),
      payHost: runtime.host,
    }),
  };
}

export function createPaymentSessionCookie(
  claims: PaymentSessionClaims,
): PaymentSessionCookie {
  const runtime = requirePaySessionRuntime();
  return createPaymentSessionCodec(runtime.key).createCookie(claims);
}

export async function requirePaymentSession(): Promise<PaymentSessionClaims> {
  const [{ cookies }, { headers }] = await Promise.all([
    import("next/headers"),
    import("next/headers"),
  ]);
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const value = cookieStore.get(PAYMENT_SESSION_COOKIE_NAME)?.value ?? "";
  const host = headerStore.get("host") ?? "";
  return defaultCommands().commands.requirePaymentSession({
    cookieValue: value,
    host,
  });
}

export async function loadPaymentPortal(
  claims: PaymentSessionClaims,
): Promise<PaymentPortalData> {
  return defaultCommands().commands.loadPaymentPortal(claims);
}

export function serializePaymentSessionCookie(
  cookie: PaymentSessionCookie,
): string {
  const encodedName = encodeURIComponent(cookie.name);
  const encodedValue = encodeURIComponent(cookie.value);
  return [
    `${encodedName}=${encodedValue}`,
    "Secure",
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${cookie.options.maxAge}`,
    `Expires=${cookie.options.expires.toUTCString()}`,
  ].join("; ");
}
