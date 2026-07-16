import { sql } from "drizzle-orm";

import type { InvoiceStatus } from "../types.ts";
import { corsHeadersForOrigin, normalizeRequestOrigin } from "./origins.ts";
import {
  createNeonWidgetRateLimiter,
  type WidgetRateLimitInput,
  type WidgetRateLimitResult,
} from "./rate-limit.ts";
import {
  isBillingWidgetEnabled,
  requireWidgetRateLimitHashKey,
} from "./runtime.ts";
import {
  verifyWidgetToken,
  type VerifiedWidgetContext,
} from "./tokens.ts";

export type WidgetSummary = {
  state: "PREPARING" | "UPCOMING" | "OPEN" | "OVERDUE" | "PAID" | "EMPTY";
  nextPaymentDate: string | null;
  amount: number | null;
  currency: "KRW";
  openInvoiceCount: number;
  canPay: boolean;
};

export type WidgetSummaryInvoice = {
  status: InvoiceStatus;
  dueDate: string;
  totalAmount: number;
  createdAt: string;
};

export type WidgetSummarySnapshot = {
  invoices: WidgetSummaryInvoice[];
  nextContract: {
    nextInvoiceDate: string;
    totalAmount: number;
  } | null;
};

export type WidgetSummaryRepository = {
  loadSnapshot(input: {
    siteId: string;
    customerId: string;
  }): Promise<WidgetSummarySnapshot>;
};

const empty = (state: WidgetSummary["state"]): WidgetSummary => ({
  state,
  nextPaymentDate: null,
  amount: null,
  currency: "KRW",
  openInvoiceCount: 0,
  canPay: false,
});

export function buildWidgetSummary(
  snapshot: WidgetSummarySnapshot,
  today: string,
): WidgetSummary {
  const payable = snapshot.invoices
    .filter((invoice) => invoice.status === "OPEN" || invoice.status === "OVERDUE")
    .map((invoice) => ({
      ...invoice,
      state:
        invoice.status === "OVERDUE" || invoice.dueDate < today
          ? ("OVERDUE" as const)
          : ("OPEN" as const),
    }))
    .sort((left, right) => {
      const priority = Number(right.state === "OVERDUE") - Number(left.state === "OVERDUE");
      return priority || left.dueDate.localeCompare(right.dueDate);
    });
  if (payable[0]) {
    return {
      state: payable[0].state,
      nextPaymentDate: payable[0].dueDate,
      amount: payable[0].totalAmount,
      currency: "KRW",
      openInvoiceCount: payable.length,
      canPay: true,
    };
  }

  const draft = snapshot.invoices
    .filter((invoice) => invoice.status === "DRAFT")
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0];
  if (draft) {
    return {
      ...empty("PREPARING"),
      nextPaymentDate: draft.dueDate,
    };
  }

  if (snapshot.nextContract) {
    return {
      ...empty("UPCOMING"),
      nextPaymentDate: snapshot.nextContract.nextInvoiceDate,
      amount: snapshot.nextContract.totalAmount,
    };
  }

  if (
    snapshot.invoices.some((invoice) =>
      ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(invoice.status),
    )
  ) {
    return empty("PAID");
  }
  return empty("EMPTY");
}

export function createWidgetSummaryService(repository: WidgetSummaryRepository) {
  return async function getWidgetSummary(
    context: VerifiedWidgetContext,
    today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }),
  ): Promise<WidgetSummary> {
    const snapshot = await repository.loadSnapshot({
      siteId: context.siteId,
      customerId: context.customerId,
    });
    return buildWidgetSummary(snapshot, today);
  };
}

export type PublicWidgetIntegration = {
  id: string;
  publicId: string;
  allowedOrigin: string;
  status: "ACTIVE" | "DISABLED";
};

export type WidgetSummaryHandlerDependencies = {
  isEnabled: () => boolean;
  hasActiveOrigin(origin: string): Promise<boolean>;
  findIntegration(publicId: string): Promise<PublicWidgetIntegration | null>;
  verifyToken(input: { token: string; origin: string }): Promise<VerifiedWidgetContext>;
  consumeRateLimit(input: WidgetRateLimitInput): Promise<WidgetRateLimitResult>;
  getSummary(context: VerifiedWidgetContext): Promise<WidgetSummary>;
  clientIp(request: Request): string;
};

function requestTooLarge(request: Request): boolean {
  let size = Buffer.byteLength(request.url, "utf8");
  request.headers.forEach((value, name) => {
    size += Buffer.byteLength(name, "utf8") + Buffer.byteLength(value, "utf8") + 4;
  });
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  return size > 16 * 1024 || (Number.isFinite(contentLength) && contentLength > 16 * 1024);
}

function json(
  body: unknown,
  status: number,
  headers: Headers,
): Response {
  return Response.json(body, { status, headers });
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/);
  return match?.[1] ?? null;
}

function validPreflight(request: Request): boolean {
  const method = request.headers.get("access-control-request-method");
  if (method && method !== "GET" && method !== "POST") return false;
  const requested = (request.headers.get("access-control-request-headers") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const allowed = new Set(["authorization", "content-type", "x-kpopsoft-widget"]);
  return requested.every((value) => allowed.has(value));
}

export function createWidgetSummaryHandler(
  dependencies: WidgetSummaryHandlerDependencies,
) {
  return async function widgetSummaryHandler(request: Request): Promise<Response> {
    const deniedHeaders = corsHeadersForOrigin(null, null);
    if (requestTooLarge(request)) {
      return json({ ok: false, code: "request_too_large" }, 413, deniedHeaders);
    }
    if (!dependencies.isEnabled()) {
      return json({ ok: false, code: "widget_disabled" }, 503, deniedHeaders);
    }

    let origin: string;
    try {
      origin = normalizeRequestOrigin(request.headers.get("origin"));
    } catch {
      return json({ ok: false, code: "origin_denied" }, 403, deniedHeaders);
    }

    if (request.method === "OPTIONS") {
      const allowed =
        validPreflight(request) &&
        (await dependencies.hasActiveOrigin(origin));
      const headers = corsHeadersForOrigin(origin, allowed ? origin : null);
      return new Response(null, { status: allowed ? 204 : 403, headers });
    }

    const publicId = request.headers.get("x-kpopsoft-widget")?.trim() ?? "";
    if (!publicId || publicId.length > 128) {
      return json({ ok: false, code: "origin_denied" }, 403, deniedHeaders);
    }
    const integration = await dependencies.findIntegration(publicId);
    if (
      !integration ||
      integration.status !== "ACTIVE" ||
      integration.allowedOrigin !== origin
    ) {
      return json({ ok: false, code: "origin_denied" }, 403, deniedHeaders);
    }
    const allowedHeaders = corsHeadersForOrigin(origin, integration.allowedOrigin);
    const token = bearerToken(request);
    if (!token) {
      return json({ ok: false, code: "unauthorized" }, 401, allowedHeaders);
    }

    let context: VerifiedWidgetContext;
    try {
      context = await dependencies.verifyToken({ token, origin });
    } catch {
      return json({ ok: false, code: "unauthorized" }, 401, allowedHeaders);
    }
    if (
      context.integrationId !== integration.id ||
      context.publicId !== integration.publicId
    ) {
      return json({ ok: false, code: "unauthorized" }, 401, allowedHeaders);
    }

    try {
      const limit = await dependencies.consumeRateLimit({
        integrationId: integration.id,
        ip: dependencies.clientIp(request),
      });
      if (!limit.allowed) {
        allowedHeaders.set("Retry-After", String(limit.retryAfterSeconds));
        return json({ ok: false, code: "rate_limited" }, 429, allowedHeaders);
      }
      const summary = await dependencies.getSummary(context);
      return json(summary, 200, allowedHeaders);
    } catch {
      return json({ ok: false, code: "service_unavailable" }, 503, allowedHeaders);
    }
  };
}

const defaultSummaryRepository: WidgetSummaryRepository = {
  async loadSnapshot(input) {
    const [{ getDb }, schema] = await Promise.all([
      import("../../db"),
      import("../../db/schema"),
    ]);
    const db = getDb();
    const invoices = await db
      .select({
        status: schema.billingInvoices.status,
        dueDate: schema.billingInvoices.dueDate,
        totalAmount: schema.billingInvoices.totalAmount,
        createdAt: schema.billingInvoices.createdAt,
      })
      .from(schema.billingInvoices)
      .where(sql`
        ${schema.billingInvoices.siteId} = ${input.siteId}::uuid
        and ${schema.billingInvoices.customerId} = ${input.customerId}::uuid
        and ${schema.billingInvoices.status} in
          ('DRAFT', 'OPEN', 'OVERDUE', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED')
      `);
    const [nextContract] = await db
      .select({
        nextInvoiceDate: schema.billingContracts.nextInvoiceDate,
        totalAmount: sql<number>`coalesce(sum(${schema.billingContractItems.totalAmount}), 0)::int`,
      })
      .from(schema.billingContracts)
      .innerJoin(
        schema.billingContractItems,
        sql`${schema.billingContractItems.contractId} = ${schema.billingContracts.id}`,
      )
      .where(sql`
        ${schema.billingContracts.siteId} = ${input.siteId}::uuid
        and ${schema.billingContracts.customerId} = ${input.customerId}::uuid
        and ${schema.billingContracts.status} = 'ACTIVE'
        and ${schema.billingContracts.nextInvoiceDate} is not null
      `)
      .groupBy(schema.billingContracts.id)
      .orderBy(schema.billingContracts.nextInvoiceDate)
      .limit(1);
    return {
      invoices: invoices.map((invoice) => ({
        ...invoice,
        createdAt: invoice.createdAt.toISOString(),
      })),
      nextContract: nextContract?.nextInvoiceDate
        ? {
            nextInvoiceDate: nextContract.nextInvoiceDate,
            totalAmount: nextContract.totalAmount,
          }
        : null,
    };
  },
};

const getDefaultSummary = createWidgetSummaryService(defaultSummaryRepository);

async function findIntegration(publicId: string): Promise<PublicWidgetIntegration | null> {
  const [{ getDb }, schema] = await Promise.all([
    import("../../db"),
    import("../../db/schema"),
  ]);
  const [row] = await getDb()
    .select({
      id: schema.billingWidgetIntegrations.id,
      publicId: schema.billingWidgetIntegrations.publicId,
      allowedOrigin: schema.billingWidgetIntegrations.allowedOrigin,
      status: schema.billingWidgetIntegrations.status,
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
    .where(sql`
      ${schema.billingWidgetIntegrations.publicId} = ${publicId}
      and ${schema.billingSites.status} = 'ACTIVE'
      and ${schema.billingCustomers.status} = 'ACTIVE'
    `)
    .limit(1);
  return row ?? null;
}

async function hasActiveOrigin(origin: string): Promise<boolean> {
  const [{ getDb }, schema] = await Promise.all([
    import("../../db"),
    import("../../db/schema"),
  ]);
  const [row] = await getDb()
    .select({ id: schema.billingWidgetIntegrations.id })
    .from(schema.billingWidgetIntegrations)
    .innerJoin(
      schema.billingSites,
      sql`${schema.billingSites.id} = ${schema.billingWidgetIntegrations.siteId}`,
    )
    .innerJoin(
      schema.billingCustomers,
      sql`${schema.billingCustomers.id} = ${schema.billingSites.customerId}`,
    )
    .where(sql`
      ${schema.billingWidgetIntegrations.allowedOrigin} = ${origin}
      and ${schema.billingWidgetIntegrations.status} = 'ACTIVE'
      and ${schema.billingSites.status} = 'ACTIVE'
      and ${schema.billingCustomers.status} = 'ACTIVE'
    `)
    .limit(1);
  return Boolean(row);
}

export function createDefaultWidgetSummaryHandler() {
  return createWidgetSummaryHandler({
    isEnabled: isBillingWidgetEnabled,
    hasActiveOrigin,
    findIntegration,
    verifyToken: verifyWidgetToken,
    consumeRateLimit(input) {
      return createNeonWidgetRateLimiter(
        requireWidgetRateLimitHashKey(),
      ).consume(input);
    },
    getSummary: getDefaultSummary,
    clientIp(request) {
      return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown"
      );
    },
  });
}
