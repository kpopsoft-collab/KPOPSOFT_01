import { createHash, randomBytes, randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";

import {
  createPaymentSessionCookie,
  serializePaymentSessionCookie,
  type PaymentSessionClaims,
  type PaymentSessionCookie,
} from "./payment-session.ts";
import { hmacRateLimitKey, normalizeIpPrefix } from "./rate-limit.ts";
import type {
  WidgetRateLimitInput,
  WidgetRateLimitResult,
} from "./rate-limit.ts";
import {
  isBillingWidgetEnabled,
  requirePaySessionRuntime,
  requireWidgetRateLimitHashKey,
  requireWidgetTokenRuntime,
} from "./runtime.ts";
import { normalizeWidgetOrigin } from "./origins.ts";
import {
  consumeDefaultWidgetRateLimit,
  findPublicWidgetIntegration,
  hasActiveWidgetOrigin,
  widgetBearerToken,
  widgetClientIp,
  widgetRequestTooLarge,
  validWidgetPreflight,
  type PublicWidgetIntegration,
} from "./summary.ts";
import {
  verifyWidgetToken,
  type VerifiedWidgetContext,
} from "./tokens.ts";

export type HandoffRepository = {
  issue(input: {
    id: string;
    integrationId: string;
    siteId: string;
    customerId: string;
    tokenHash: Uint8Array;
    createdIpHash: Uint8Array;
    expiresAt: Date;
    now: Date;
  }): Promise<boolean>;
  consume(input: {
    tokenHash: Uint8Array;
    sessionHash: Uint8Array;
    expiresAt: Date;
    absoluteExpiresAt: Date;
    now: Date;
  }): Promise<{ siteId: string; customerId: string } | null>;
};

export type HandoffCommandOptions = {
  payOrigin: string;
  rateLimitHashKey: Uint8Array;
  randomHandoffToken?: () => Uint8Array;
  randomSessionId?: () => Uint8Array;
  now?: () => Date;
};

class HandoffError extends Error {
  constructor(message = "Invalid, expired, or used handoff") {
    super(message);
    this.name = "HandoffError";
  }
}

function random32(): Uint8Array {
  return new Uint8Array(randomBytes(32));
}

function require32(value: Uint8Array, label: string): Uint8Array {
  if (value.byteLength !== 32) throw new Error(`${label} must be 32 bytes`);
  return value;
}

function hash(value: Uint8Array | string): Uint8Array {
  return new Uint8Array(createHash("sha256").update(value).digest());
}

function decodeHandoffToken(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]{43}$/.test(value)) throw new HandoffError();
  const decoded = Buffer.from(value, "base64url");
  if (
    decoded.byteLength !== 32 ||
    decoded.toString("base64url") !== value
  ) {
    throw new HandoffError();
  }
  return new Uint8Array(decoded);
}

export function createHandoffCommands(
  repository: HandoffRepository,
  options: HandoffCommandOptions,
) {
  const now = options.now ?? (() => new Date());
  const randomHandoffToken = options.randomHandoffToken ?? random32;
  const randomSessionId = options.randomSessionId ?? random32;
  const payOrigin = normalizeWidgetOrigin(options.payOrigin);
  require32(options.rateLimitHashKey, "Rate-limit hash key");

  return {
    async issueHandoff(
      context: VerifiedWidgetContext,
      ip: string,
    ): Promise<{ url: string; expiresAt: string }> {
      const issuedAt = now();
      const expiresAt = new Date(issuedAt.getTime() + 5 * 60 * 1000);
      const rawToken = require32(randomHandoffToken(), "Handoff token");
      const encoded = Buffer.from(rawToken).toString("base64url");
      const created = await repository.issue({
        id: randomUUID(),
        integrationId: context.integrationId,
        siteId: context.siteId,
        customerId: context.customerId,
        tokenHash: hash(rawToken),
        createdIpHash: hmacRateLimitKey(
          options.rateLimitHashKey,
          `handoff-ip:${normalizeIpPrefix(ip)}`,
        ),
        expiresAt,
        now: issuedAt,
      });
      if (!created) throw new HandoffError("No payable invoice is available");
      return {
        url: `${payOrigin}/pay/start/${encoded}`,
        expiresAt: expiresAt.toISOString(),
      };
    },

    async consumeHandoff(rawToken: string): Promise<PaymentSessionClaims> {
      const decoded = decodeHandoffToken(rawToken);
      const issuedAt = now();
      const expiresAt = new Date(issuedAt.getTime() + 30 * 60 * 1000);
      const absoluteExpiresAt = new Date(
        issuedAt.getTime() + 2 * 60 * 60 * 1000,
      );
      const rawSessionId = require32(randomSessionId(), "Payment session ID");
      const sessionId = Buffer.from(rawSessionId).toString("base64url");
      const scope = await repository.consume({
        tokenHash: hash(decoded),
        sessionHash: hash(sessionId),
        expiresAt,
        absoluteExpiresAt,
        now: issuedAt,
      });
      if (!scope) throw new HandoffError();
      return {
        sessionId,
        siteId: scope.siteId,
        customerId: scope.customerId,
        issuedAt: issuedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        absoluteExpiresAt: absoluteExpiresAt.toISOString(),
      };
    },
  };
}

const defaultHandoffRepository: HandoffRepository = {
  async issue(input) {
    const [{ getDb }, schema] = await Promise.all([
      import("../../db"),
      import("../../db/schema"),
    ]);
    const result = await getDb().execute(sql`
      insert into ${schema.billingHandoffs}
        (id, token_hash, integration_id, site_id, customer_id, expires_at,
         created_ip_hash, created_at)
      select ${input.id}::uuid, ${input.tokenHash}, ${input.integrationId}::uuid,
             ${input.siteId}::uuid, ${input.customerId}::uuid,
             ${input.expiresAt}, ${input.createdIpHash}, ${input.now}
      where exists (
        select 1
        from ${schema.billingWidgetIntegrations} integration
        inner join ${schema.billingSites} site
          on site.id = integration.site_id
        inner join ${schema.billingCustomers} customer
          on customer.id = site.customer_id
        where integration.id = ${input.integrationId}::uuid
          and integration.site_id = ${input.siteId}::uuid
          and site.customer_id = ${input.customerId}::uuid
          and integration.status = 'ACTIVE'
          and site.status = 'ACTIVE'
          and customer.status = 'ACTIVE'
      ) and exists (
        select 1
        from ${schema.billingInvoices} invoice
        where invoice.site_id = ${input.siteId}::uuid
          and invoice.customer_id = ${input.customerId}::uuid
          and invoice.status in ('OPEN', 'OVERDUE')
      )
      returning id
    `);
    return Boolean((result.rows[0] as { id?: string } | undefined)?.id);
  },

  async consume(input) {
    const [{ getDb }, schema] = await Promise.all([
      import("../../db"),
      import("../../db/schema"),
    ]);
    const result = await getDb().execute(sql`
      with consumed as (
        update ${schema.billingHandoffs} handoff
        set used_at = ${input.now}
        where handoff.token_hash = ${input.tokenHash}
          and handoff.used_at is null
          and handoff.expires_at > ${input.now}
          and exists (
            select 1
            from ${schema.billingWidgetIntegrations} integration
            inner join ${schema.billingSites} site
              on site.id = integration.site_id
            inner join ${schema.billingCustomers} customer
              on customer.id = site.customer_id
            where integration.id = handoff.integration_id
              and integration.site_id = handoff.site_id
              and site.customer_id = handoff.customer_id
              and integration.status = 'ACTIVE'
              and site.status = 'ACTIVE'
              and customer.status = 'ACTIVE'
          )
        returning handoff.site_id, handoff.customer_id
      ), inserted as (
        insert into ${schema.billingPaymentSessions}
          (session_hash, site_id, customer_id, expires_at,
           absolute_expires_at, last_seen_at, created_at, updated_at)
        select ${input.sessionHash}, consumed.site_id, consumed.customer_id,
               ${input.expiresAt}, ${input.absoluteExpiresAt},
               ${input.now}, ${input.now}, ${input.now}
        from consumed
        returning site_id, customer_id
      )
      select site_id, customer_id from inserted
    `);
    const row = result.rows[0] as
      | { site_id?: string; customer_id?: string }
      | undefined;
    return row?.site_id && row.customer_id
      ? { siteId: row.site_id, customerId: row.customer_id }
      : null;
  },
};

function defaultCommands() {
  const tokenRuntime = requireWidgetTokenRuntime();
  const payRuntime = requirePaySessionRuntime();
  if (new URL(tokenRuntime.issuer).hostname !== payRuntime.host) {
    throw new Error("Widget issuer and payment host do not match");
  }
  return createHandoffCommands(defaultHandoffRepository, {
    payOrigin: tokenRuntime.issuer,
    rateLimitHashKey: requireWidgetRateLimitHashKey(),
  });
}

export async function issueHandoff(
  context: VerifiedWidgetContext,
): Promise<{ url: string; expiresAt: string }> {
  const { headers } = await import("next/headers");
  const values = await headers();
  const ip = values.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return defaultCommands().issueHandoff(context, ip);
}

export async function issueHandoffForRequest(
  context: VerifiedWidgetContext,
  ip: string,
): Promise<{ url: string; expiresAt: string }> {
  return defaultCommands().issueHandoff(context, ip);
}

export async function consumeHandoff(
  rawToken: string,
): Promise<PaymentSessionClaims> {
  return defaultCommands().consumeHandoff(rawToken);
}

export type WidgetHandoffHandlerDependencies = {
  isEnabled: () => boolean;
  hasActiveOrigin(origin: string): Promise<boolean>;
  findIntegration(publicId: string): Promise<PublicWidgetIntegration | null>;
  verifyToken(input: { token: string; origin: string }): Promise<VerifiedWidgetContext>;
  consumeRateLimit(input: WidgetRateLimitInput): Promise<WidgetRateLimitResult>;
  issueHandoff(
    context: VerifiedWidgetContext,
    ip: string,
  ): Promise<{ url: string; expiresAt: string }>;
  clientIp(request: Request): string;
};

async function hasEmptyBody(request: Request): Promise<boolean> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 0) return false;
  if (!request.body) return true;
  const reader = request.body.getReader();
  const first = await reader.read();
  await reader.cancel();
  return first.done === true;
}

export function createWidgetHandoffHandler(
  dependencies: WidgetHandoffHandlerDependencies,
) {
  return async function widgetHandoffHandler(request: Request): Promise<Response> {
    const deniedHeaders = new Headers({
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Origin",
      "X-Content-Type-Options": "nosniff",
    });
    if (widgetRequestTooLarge(request)) {
      return Response.json(
        { ok: false, code: "request_too_large" },
        { status: 413, headers: deniedHeaders },
      );
    }
    if (!dependencies.isEnabled()) {
      return Response.json(
        { ok: false, code: "widget_disabled" },
        { status: 503, headers: deniedHeaders },
      );
    }

    let origin: string;
    try {
      const { normalizeRequestOrigin } = await import("./origins.ts");
      origin = normalizeRequestOrigin(request.headers.get("origin"));
    } catch {
      return Response.json(
        { ok: false, code: "origin_denied" },
        { status: 403, headers: deniedHeaders },
      );
    }
    const { corsHeadersForOrigin } = await import("./origins.ts");

    if (request.method === "OPTIONS") {
      const allowed =
        validWidgetPreflight(request) &&
        (await dependencies.hasActiveOrigin(origin));
      return new Response(null, {
        status: allowed ? 204 : 403,
        headers: corsHeadersForOrigin(origin, allowed ? origin : null),
      });
    }
    if (!(await hasEmptyBody(request))) {
      return Response.json(
        { ok: false, code: "body_not_allowed" },
        { status: 400, headers: deniedHeaders },
      );
    }

    const publicId = request.headers.get("x-kpopsoft-widget")?.trim() ?? "";
    const integration = publicId
      ? await dependencies.findIntegration(publicId)
      : null;
    if (
      !integration ||
      integration.status !== "ACTIVE" ||
      integration.allowedOrigin !== origin
    ) {
      return Response.json(
        { ok: false, code: "origin_denied" },
        { status: 403, headers: deniedHeaders },
      );
    }
    const allowedHeaders = corsHeadersForOrigin(origin, integration.allowedOrigin);
    const token = widgetBearerToken(request);
    if (!token) {
      return Response.json(
        { ok: false, code: "unauthorized" },
        { status: 401, headers: allowedHeaders },
      );
    }

    let context: VerifiedWidgetContext;
    try {
      context = await dependencies.verifyToken({ token, origin });
    } catch {
      return Response.json(
        { ok: false, code: "unauthorized" },
        { status: 401, headers: allowedHeaders },
      );
    }
    if (
      context.integrationId !== integration.id ||
      context.publicId !== integration.publicId
    ) {
      return Response.json(
        { ok: false, code: "unauthorized" },
        { status: 401, headers: allowedHeaders },
      );
    }

    try {
      const ip = dependencies.clientIp(request);
      const limit = await dependencies.consumeRateLimit({
        integrationId: integration.id,
        ip,
      });
      if (!limit.allowed) {
        allowedHeaders.set("Retry-After", String(limit.retryAfterSeconds));
        return Response.json(
          { ok: false, code: "rate_limited" },
          { status: 429, headers: allowedHeaders },
        );
      }
      const result = await dependencies.issueHandoff(context, ip);
      return Response.json(result, { status: 201, headers: allowedHeaders });
    } catch {
      return Response.json(
        { ok: false, code: "payment_unavailable" },
        { status: 409, headers: allowedHeaders },
      );
    }
  };
}

export function createDefaultWidgetHandoffHandler() {
  return createWidgetHandoffHandler({
    isEnabled: isBillingWidgetEnabled,
    hasActiveOrigin: hasActiveWidgetOrigin,
    findIntegration: findPublicWidgetIntegration,
    verifyToken: verifyWidgetToken,
    consumeRateLimit: consumeDefaultWidgetRateLimit,
    issueHandoff: issueHandoffForRequest,
    clientIp: widgetClientIp,
  });
}

export function createPayStartHandler(dependencies: {
  payHost: string;
  consumeHandoff(rawToken: string): Promise<PaymentSessionClaims>;
  createPaymentSessionCookie(
    claims: PaymentSessionClaims,
  ): PaymentSessionCookie;
}) {
  return async function payStartHandler(
    request: Request,
    rawToken: string,
  ): Promise<Response> {
    const headers = new Headers({
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    });
    const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
    if (host !== dependencies.payHost.toLowerCase()) {
      return new Response(null, { status: 404, headers });
    }
    try {
      const claims = await dependencies.consumeHandoff(rawToken);
      const cookie = dependencies.createPaymentSessionCookie(claims);
      headers.set("Location", "/pay");
      headers.set("Set-Cookie", serializePaymentSessionCookie(cookie));
      return new Response(null, { status: 303, headers });
    } catch {
      return new Response(null, { status: 410, headers });
    }
  };
}

export function createDefaultPayStartHandler() {
  const runtime = requirePaySessionRuntime();
  return createPayStartHandler({
    payHost: runtime.host,
    consumeHandoff,
    createPaymentSessionCookie,
  });
}
