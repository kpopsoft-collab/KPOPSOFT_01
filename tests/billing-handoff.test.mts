import assert from "node:assert/strict";
import test from "node:test";

import {
  createHandoffCommands,
  createPayStartHandler,
  createWidgetHandoffHandler,
  type HandoffRepository,
  type WidgetHandoffHandlerDependencies,
} from "../src/lib/billing/widget/handoffs.ts";
import {
  PAYMENT_SESSION_COOKIE_NAME,
  createPaymentSessionCodec,
  createPaymentSessionCommands,
  type PaymentSessionClaims,
  type PaymentSessionRepository,
} from "../src/lib/billing/widget/payment-session.ts";
import type { VerifiedWidgetContext } from "../src/lib/billing/widget/tokens.ts";

const integrationId = "33333333-3333-4333-8333-333333333333";
const siteId = "22222222-2222-4222-8222-222222222222";
const customerId = "44444444-4444-4444-8444-444444444444";
const now = new Date("2026-07-16T03:00:00.000Z");
const handoffToken = new Uint8Array(32).fill(17);
const sessionId = new Uint8Array(32).fill(29);
const hashKey = new Uint8Array(32).fill(31);
const sessionKey = new Uint8Array(32).fill(47);

const context: VerifiedWidgetContext = {
  integrationId,
  publicId: "wgt_live_public_identifier",
  siteId,
  customerId,
  subject: "opaque-user",
  origin: "https://client.example.com",
  keyVersion: 1,
  expiresAt: "2026-07-16T03:02:00.000Z",
};

test("handoff issue is scoped, five-minute, and stores only hashes", async () => {
  const captured: Array<Parameters<HandoffRepository["issue"]>[0]> = [];
  const repository: HandoffRepository = {
    async issue(input) {
      captured.push(input);
      return true;
    },
    async consume() {
      return null;
    },
  };
  const commands = createHandoffCommands(repository, {
    payOrigin: "https://pay.kpopsoft.com",
    rateLimitHashKey: hashKey,
    randomHandoffToken: () => new Uint8Array(handoffToken),
    randomSessionId: () => new Uint8Array(sessionId),
    now: () => new Date(now),
  });
  const result = await commands.issueHandoff(context, "203.0.113.41");

  assert.equal(
    result.url,
    `https://pay.kpopsoft.com/pay/start/${Buffer.from(handoffToken).toString("base64url")}`,
  );
  assert.equal(result.expiresAt, "2026-07-16T03:05:00.000Z");
  assert.equal(captured.length, 1);
  assert.deepEqual(
    {
      integrationId: captured[0].integrationId,
      siteId: captured[0].siteId,
      customerId: captured[0].customerId,
    },
    { integrationId, siteId, customerId },
  );
  assert.equal(captured[0].tokenHash.byteLength, 32);
  assert.equal(captured[0].createdIpHash.byteLength, 32);
  assert.equal("token" in captured[0], false);
  assert.doesNotMatch(
    JSON.stringify(captured[0]),
    new RegExp(Buffer.from(handoffToken).toString("base64url")),
  );
});

test("handoff issue rejects a scope without payable approved invoices", async () => {
  const commands = createHandoffCommands(
    {
      async issue() {
        return false;
      },
      async consume() {
        return null;
      },
    },
    {
      payOrigin: "https://pay.kpopsoft.com",
      rateLimitHashKey: hashKey,
      now: () => new Date(now),
    },
  );
  await assert.rejects(
    commands.issueHandoff(context, "203.0.113.41"),
    /payable/i,
  );
});

test("consume is single-use and creates a 30-minute idle, two-hour absolute session", async () => {
  let consumed = false;
  const inputs: Array<Parameters<HandoffRepository["consume"]>[0]> = [];
  const repository: HandoffRepository = {
    async issue() {
      return true;
    },
    async consume(input) {
      inputs.push(input);
      if (consumed) return null;
      consumed = true;
      return { siteId, customerId };
    },
  };
  const commands = createHandoffCommands(repository, {
    payOrigin: "https://pay.kpopsoft.com",
    rateLimitHashKey: hashKey,
    randomSessionId: () => new Uint8Array(sessionId),
    now: () => new Date(now),
  });
  const raw = Buffer.from(handoffToken).toString("base64url");
  const claims = await commands.consumeHandoff(raw);

  assert.equal(claims.siteId, siteId);
  assert.equal(claims.customerId, customerId);
  assert.equal(claims.sessionId, Buffer.from(sessionId).toString("base64url"));
  assert.equal(claims.expiresAt, "2026-07-16T03:30:00.000Z");
  assert.equal(claims.absoluteExpiresAt, "2026-07-16T05:00:00.000Z");
  assert.equal(inputs[0].tokenHash.byteLength, 32);
  assert.equal(inputs[0].sessionHash.byteLength, 32);
  assert.equal("rawToken" in inputs[0], false);
  await assert.rejects(commands.consumeHandoff(raw), /invalid|expired|used/i);
});

test("invalid, expired, or disabled handoffs return the same neutral failure", async () => {
  const commands = createHandoffCommands(
    {
      async issue() {
        return true;
      },
      async consume() {
        return null;
      },
    },
    {
      payOrigin: "https://pay.kpopsoft.com",
      rateLimitHashKey: hashKey,
      now: () => new Date(now),
    },
  );
  for (const raw of ["", "bad*token", Buffer.alloc(31).toString("base64url"), Buffer.alloc(32).toString("base64url")]) {
    await assert.rejects(commands.consumeHandoff(raw), /invalid|expired|used/i);
  }
});

test("concurrent handoff consumption has exactly one winner", async () => {
  let won = false;
  const commands = createHandoffCommands(
    {
      async issue() {
        return true;
      },
      async consume() {
        if (won) return null;
        won = true;
        await Promise.resolve();
        return { siteId, customerId };
      },
    },
    {
      payOrigin: "https://pay.kpopsoft.com",
      rateLimitHashKey: hashKey,
      now: () => new Date(now),
    },
  );
  const raw = Buffer.from(handoffToken).toString("base64url");
  const results = await Promise.allSettled([
    commands.consumeHandoff(raw),
    commands.consumeHandoff(raw),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal(
    results.filter((result) => result.status === "rejected").length,
    1,
  );
});

function claims(overrides: Partial<PaymentSessionClaims> = {}): PaymentSessionClaims {
  return {
    sessionId: Buffer.from(sessionId).toString("base64url"),
    siteId,
    customerId,
    issuedAt: now.toISOString(),
    expiresAt: "2026-07-16T03:30:00.000Z",
    absoluteExpiresAt: "2026-07-16T05:00:00.000Z",
    ...overrides,
  };
}

test("payment session cookies are authenticated, encrypted, and host-only", () => {
  const codec = createPaymentSessionCodec(sessionKey, () => new Uint8Array(12).fill(5));
  const cookie = codec.createCookie(claims(), now);
  assert.equal(cookie.name, PAYMENT_SESSION_COOKIE_NAME);
  assert.equal(cookie.name, "__Host-kpopsoft-pay");
  assert.equal(cookie.options.secure, true);
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(cookie.options.sameSite, "lax");
  assert.equal(cookie.options.path, "/");
  assert.equal(cookie.options.domain, undefined);
  assert.equal(cookie.options.maxAge, 1800);
  assert.doesNotMatch(cookie.value, new RegExp(siteId));
  assert.deepEqual(codec.decode(cookie.value), claims());

  const parts = cookie.value.split(".");
  parts[2] = `${parts[2].slice(0, -1)}${parts[2].endsWith("A") ? "B" : "A"}`;
  assert.throws(() => codec.decode(parts.join(".")), /session/i);
  assert.throws(
    () => createPaymentSessionCodec(new Uint8Array(32).fill(99)).decode(cookie.value),
    /session/i,
  );
});

test("session requirements enforce host, idle, absolute, revocation, and row scope", async () => {
  const refreshes: Array<Parameters<PaymentSessionRepository["refresh"]>[0]> = [];
  const repository: PaymentSessionRepository = {
    async refresh(input) {
      refreshes.push(input);
      return {
        expiresAt: new Date("2026-07-16T03:40:00.000Z"),
        absoluteExpiresAt: new Date("2026-07-16T05:00:00.000Z"),
      };
    },
    async loadPortal() {
      throw new Error("unused");
    },
  };
  const codec = createPaymentSessionCodec(sessionKey, () => new Uint8Array(12).fill(5));
  const value = codec.createCookie(claims(), now).value;
  const commands = createPaymentSessionCommands(repository, {
    codec,
    payHost: "pay.kpopsoft.com",
    now: () => new Date("2026-07-16T03:10:00.000Z"),
  });
  const verified = await commands.requirePaymentSession({
    cookieValue: value,
    host: "pay.kpopsoft.com",
  });
  assert.equal(verified.expiresAt, "2026-07-16T03:40:00.000Z");
  assert.equal(refreshes[0].siteId, siteId);
  assert.equal(refreshes[0].customerId, customerId);
  assert.equal(refreshes[0].sessionHash.byteLength, 32);

  await assert.rejects(
    commands.requirePaymentSession({ cookieValue: value, host: "www.kpopsoft.com" }),
    /session/i,
  );
  repository.refresh = async () => null;
  await assert.rejects(
    commands.requirePaymentSession({ cookieValue: value, host: "pay.kpopsoft.com" }),
    /session/i,
  );
});

test("portal reads are always scoped by the verified session", async () => {
  const scopes: unknown[] = [];
  const repository: PaymentSessionRepository = {
    async refresh() {
      return null;
    },
    async loadPortal(input) {
      scopes.push(input);
      return { customerName: "고객사", siteName: "사이트", invoices: [] };
    },
  };
  const commands = createPaymentSessionCommands(repository, {
    codec: createPaymentSessionCodec(sessionKey),
    payHost: "pay.kpopsoft.com",
    now: () => new Date(now),
  });
  await commands.loadPaymentPortal(claims());
  assert.deepEqual(scopes, [{ siteId, customerId }]);
});

test("pay start consumes only on the pay host and redirects without retaining the handoff", async () => {
  const cookie = createPaymentSessionCodec(sessionKey, () => new Uint8Array(12).fill(5)).createCookie(claims(), now);
  let consumes = 0;
  const handler = createPayStartHandler({
    payHost: "pay.kpopsoft.com",
    async consumeHandoff() {
      consumes += 1;
      return claims();
    },
    createPaymentSessionCookie: () => cookie,
  });
  const raw = Buffer.from(handoffToken).toString("base64url");
  const response = await handler(
    new Request(`https://pay.kpopsoft.com/pay/start/${raw}`, {
      headers: { host: "pay.kpopsoft.com" },
    }),
    raw,
  );
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/pay");
  assert.doesNotMatch(response.headers.get("location") ?? "", new RegExp(raw));
  assert.match(response.headers.get("set-cookie") ?? "", /^__Host-kpopsoft-pay=/);
  assert.match(response.headers.get("set-cookie") ?? "", /Secure; HttpOnly; SameSite=Lax; Path=\//);
  assert.equal(consumes, 1);

  const wrongHost = await handler(
    new Request(`https://www.kpopsoft.com/pay/start/${raw}`, {
      headers: { host: "www.kpopsoft.com" },
    }),
    raw,
  );
  assert.equal(wrongHost.status, 404);
  assert.equal(consumes, 1);
});

test("widget handoff API accepts no billing scope fields and uses verified context only", async () => {
  const calls: string[] = [];
  const dependencies: WidgetHandoffHandlerDependencies = {
    isEnabled: () => true,
    async hasActiveOrigin() {
      return true;
    },
    async findIntegration() {
      calls.push("integration");
      return {
        id: integrationId,
        publicId: context.publicId,
        allowedOrigin: context.origin,
        status: "ACTIVE",
      };
    },
    async verifyToken() {
      calls.push("verify");
      return context;
    },
    async consumeRateLimit() {
      calls.push("limit");
      return { allowed: true, retryAfterSeconds: 0 };
    },
    async issueHandoff(input, ip) {
      calls.push("issue");
      assert.deepEqual(input, context);
      assert.equal(ip, "203.0.113.41");
      return {
        url: "https://pay.kpopsoft.com/pay/start/opaque",
        expiresAt: "2026-07-16T03:05:00.000Z",
      };
    },
    clientIp: () => "203.0.113.41",
  };
  const handler = createWidgetHandoffHandler(dependencies);
  const headers = {
    origin: context.origin,
    authorization: "Bearer payload.signature",
    "x-kpopsoft-widget": context.publicId,
  };
  const response = await handler(
    new Request("https://pay.kpopsoft.com/api/widget/v1/handoffs", {
      method: "POST",
      headers,
    }),
  );
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    url: "https://pay.kpopsoft.com/pay/start/opaque",
    expiresAt: "2026-07-16T03:05:00.000Z",
  });
  assert.deepEqual(calls, ["integration", "verify", "limit", "issue"]);

  calls.length = 0;
  const bodyResponse = await handler(
    new Request("https://pay.kpopsoft.com/api/widget/v1/handoffs", {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ customerId, siteId, amount: 1 }),
    }),
  );
  assert.equal(bodyResponse.status, 400);
  assert.deepEqual(calls, []);
});
