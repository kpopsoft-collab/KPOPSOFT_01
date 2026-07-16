import assert from "node:assert/strict";
import test from "node:test";

import {
  corsHeadersForOrigin,
  normalizeRequestOrigin,
} from "../src/lib/billing/widget/origins.ts";
import {
  createInMemoryWidgetRateLimiter,
  hmacRateLimitKey,
  normalizeIpPrefix,
} from "../src/lib/billing/widget/rate-limit.ts";
import {
  createWidgetSummaryHandler,
  type WidgetSummaryHandlerDependencies,
} from "../src/lib/billing/widget/summary.ts";

const origin = "https://client.example.com:8443";
const publicId = "wgt_live_public_identifier";
const token = "payload.signature";

test("request origins require an exact HTTPS scheme, host, and port", () => {
  assert.equal(normalizeRequestOrigin(origin), origin);
  assert.equal(
    normalizeRequestOrigin("HTTPS://CLIENT.EXAMPLE.COM:443"),
    "https://client.example.com",
  );
  for (const value of [
    null,
    "null",
    "",
    "http://client.example.com",
    "https://*.example.com",
    "https://client.example.com/path",
    "https://client.example.com:9443/path",
  ]) {
    assert.throws(() => normalizeRequestOrigin(value), /origin/i);
  }
});

test("allowed CORS headers vary on Origin without credential sharing", () => {
  const headers = corsHeadersForOrigin(origin, origin);
  assert.equal(headers.get("access-control-allow-origin"), origin);
  assert.equal(headers.get("vary"), "Origin");
  assert.equal(
    headers.get("access-control-allow-methods"),
    "GET, POST, OPTIONS",
  );
  assert.equal(
    headers.get("access-control-allow-headers"),
    "Authorization, Content-Type, X-KPOPSOFT-Widget",
  );
  assert.equal(headers.get("access-control-allow-credentials"), null);
  assert.equal(headers.get("cache-control"), "private, no-store, max-age=0");

  const denied = corsHeadersForOrigin("https://evil.example", origin);
  assert.equal(denied.get("access-control-allow-origin"), null);
  assert.equal(denied.get("vary"), "Origin");
});

function dependencies(
  overrides: Partial<WidgetSummaryHandlerDependencies> = {},
): WidgetSummaryHandlerDependencies & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    isEnabled: () => true,
    async hasActiveOrigin(input) {
      calls.push(`origin:${input}`);
      return input === origin;
    },
    async findIntegration(input) {
      calls.push(`integration:${input}`);
      return input === publicId
        ? { id: "integration", publicId, allowedOrigin: origin, status: "ACTIVE" }
        : null;
    },
    async verifyToken(input) {
      calls.push("verify");
      assert.equal(input.token, token);
      assert.equal(input.origin, origin);
      return {
        integrationId: "integration",
        publicId,
        siteId: "site",
        customerId: "customer",
        subject: "opaque-user",
        origin,
        keyVersion: 1,
        expiresAt: "2026-07-16T00:02:00.000Z",
      };
    },
    async consumeRateLimit() {
      calls.push("limit");
      return { allowed: true, retryAfterSeconds: 0 };
    },
    async getSummary() {
      calls.push("summary");
      return {
        state: "OPEN",
        nextPaymentDate: "2026-07-20",
        amount: 110_000,
        currency: "KRW",
        openInvoiceCount: 1,
        canPay: true,
      };
    },
    clientIp: () => "203.0.113.41",
    ...overrides,
  };
}

function request(
  method: "GET" | "OPTIONS",
  headers: Record<string, string> = {},
): Request {
  return new Request("https://pay.kpopsoft.com/api/widget/v1/summary", {
    method,
    headers: {
      origin,
      authorization: `Bearer ${token}`,
      "x-kpopsoft-widget": publicId,
      ...headers,
    },
  });
}

test("preflight allows registered origins and denies unknown origins", async () => {
  const deps = dependencies();
  const handler = createWidgetSummaryHandler(deps);
  const allowed = await handler(request("OPTIONS"));
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get("access-control-allow-origin"), origin);
  assert.deepEqual(deps.calls, [`origin:${origin}`]);

  const deniedDeps = dependencies();
  const denied = await createWidgetSummaryHandler(deniedDeps)(
    request("OPTIONS", { origin: "https://evil.example.com" }),
  );
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
  assert.doesNotMatch(deniedDeps.calls.join(","), /verify|summary/);
});

test("GET denies origin and public integration mismatches before invoice reads", async () => {
  const cases: Array<Record<string, string>> = [
    { origin: "https://evil.example.com" },
    { "x-kpopsoft-widget": "unknown_public_id" },
  ];
  for (const headers of cases) {
    const deps = dependencies();
    const response = await createWidgetSummaryHandler(deps)(
      request("GET", headers),
    );
    assert.equal(response.status, 403);
    assert.doesNotMatch(deps.calls.join(","), /verify|limit|summary/);
  }
});

test("GET requires Bearer, rejects oversized requests, and preserves safe order", async () => {
  const missing = dependencies();
  const missingResponse = await createWidgetSummaryHandler(missing)(
    request("GET", { authorization: "" }),
  );
  assert.equal(missingResponse.status, 401);
  assert.doesNotMatch(missing.calls.join(","), /verify|summary/);

  const oversized = dependencies();
  const oversizedResponse = await createWidgetSummaryHandler(oversized)(
    request("GET", { "x-padding": "a".repeat(16_384) }),
  );
  assert.equal(oversizedResponse.status, 413);
  assert.deepEqual(oversized.calls, []);

  const valid = dependencies();
  const response = await createWidgetSummaryHandler(valid)(request("GET"));
  assert.equal(response.status, 200);
  assert.deepEqual(valid.calls, [
    `integration:${publicId}`,
    "verify",
    "limit",
    "summary",
  ]);
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
});

test("rate limiting normalizes IP prefixes, stores HMAC keys, and enforces both caps", async () => {
  assert.equal(normalizeIpPrefix("203.0.113.41"), "203.0.113.0/24");
  assert.equal(
    normalizeIpPrefix("2001:db8:abcd:0012:0000:0000:0000:0001"),
    "2001:db8:abcd:12::/64",
  );
  assert.equal(normalizeIpPrefix("invalid"), "unknown");

  const hashKey = new Uint8Array(32).fill(31);
  const hash = hmacRateLimitKey(hashKey, "203.0.113.0/24");
  assert.equal(hash.byteLength, 32);
  assert.doesNotMatch(Buffer.from(hash).toString("hex"), /203\.0\.113/);

  const limiter = createInMemoryWidgetRateLimiter({
    integrationLimit: 3,
    integrationIpLimit: 2,
  });
  const first = await limiter.consume({ integrationId: "one", ip: "203.0.113.41", now: 60_000 });
  const second = await limiter.consume({ integrationId: "one", ip: "203.0.113.42", now: 60_001 });
  const blockedIp = await limiter.consume({ integrationId: "one", ip: "203.0.113.43", now: 60_002 });
  const blockedIntegration = await limiter.consume({ integrationId: "one", ip: "198.51.100.1", now: 60_003 });
  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(blockedIp.allowed, false);
  assert.equal(blockedIntegration.allowed, false);
  assert.ok(blockedIntegration.retryAfterSeconds > 0);
});
