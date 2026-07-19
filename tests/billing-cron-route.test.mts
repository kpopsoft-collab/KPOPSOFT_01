import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { createBillingGenerateHandler } from "../src/lib/billing/generate-route-handler.ts";

const request = (authorization?: string) =>
  new Request("https://example.com/api/internal/billing/generate", {
    headers: authorization ? { authorization } : {},
  });

test("disabled billing returns a no-store 503", async () => {
  const handler = createBillingGenerateHandler({
    isBillingEnabled: () => false,
    requireCronSecret: () => {},
    generateDueInvoices: async () => {
      throw new Error("must not run");
    },
    todayInSeoul: () => "2026-07-16",
  });
  const response = await handler(request("Bearer anything"));

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    ok: false,
    code: "billing_disabled",
  });
});

test("missing or wrong bearer authorization returns 401", async () => {
  const handler = createBillingGenerateHandler({
    isBillingEnabled: () => true,
    requireCronSecret(input) {
      if (input.headers.get("authorization") !== "Bearer correct") {
        throw new Error("Forbidden secret details");
      }
    },
    generateDueInvoices: async () => ({
      runId: "run",
      targetCount: 0,
      createdCount: 0,
      failed: [],
    }),
    todayInSeoul: () => "2026-07-16",
  });

  for (const input of [request(), request("Bearer wrong")]) {
    const response = await handler(input);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      ok: false,
      code: "unauthorized",
    });
  }
});

test("successful generation returns only sanitized counts", async () => {
  let cleaned = false;
  const handler = createBillingGenerateHandler({
    isBillingEnabled: () => true,
    requireCronSecret: () => {},
    generateDueInvoices: async (runDate) => {
      assert.equal(runDate, "2026-07-16");
      return {
        runId: "11111111-1111-4111-8111-111111111111",
        targetCount: 3,
        createdCount: 2,
        failed: [
          {
            contractId: "sensitive-contract-id",
            code: "GENERATION_FAILED",
          },
        ],
      };
    },
    todayInSeoul: () => "2026-07-16",
    cleanupExpiredWidgetRateLimits: async () => {
      cleaned = true;
    },
  });
  const response = await handler(request("Bearer correct"));

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, {
    ok: true,
    runId: "11111111-1111-4111-8111-111111111111",
    targetCount: 3,
    createdCount: 2,
    failedCount: 1,
  });
  assert.equal(cleaned, true);
  assert.doesNotMatch(JSON.stringify(body), /sensitive-contract-id/);
});

test("internal failures never return stack, database, or secret details", async () => {
  const handler = createBillingGenerateHandler({
    isBillingEnabled: () => true,
    requireCronSecret: () => {},
    generateDueInvoices: async () => {
      throw new Error("postgres password=secret stack trace");
    },
    todayInSeoul: () => "2026-07-16",
  });
  const response = await handler(request("Bearer correct"));
  const body = await response.text();

  assert.equal(response.status, 500);
  assert.match(body, /generation_failed/);
  assert.doesNotMatch(body, /postgres|password|secret|stack/i);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("route and Vercel schedule preserve the protected Node contract", () => {
  const routeSources = [
    "src/app/api/internal/billing/generate/route.ts",
    "src/app/api/internal/billing/reconcile/route.ts",
  ].map((routePath) =>
    readFileSync(join(process.cwd(), routePath), "utf8"),
  );
  const vercel = JSON.parse(
    readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
  );

  for (const routeSource of routeSources) {
    assert.match(routeSource, /export const runtime = "nodejs"/);
    assert.match(routeSource, /export const dynamic = "force-dynamic"/);
    assert.doesNotMatch(routeSource, /searchParams|get\("CRON_SECRET"\)/);
  }
  assert.deepEqual(vercel.crons, [
    {
      path: "/api/internal/billing/generate",
      schedule: "15 15 * * *",
    },
    {
      path: "/api/internal/billing/reconcile",
      schedule: "*/10 * * * *",
    },
  ]);
});
