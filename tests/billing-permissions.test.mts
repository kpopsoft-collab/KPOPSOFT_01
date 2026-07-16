import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  isBillingEnabled,
  requireCronSecret,
} from "../src/lib/billing/runtime.ts";
import {
  BillingReauthenticationRequiredError,
  authorizeBillingIdentity,
  hasBillingPermission,
  isRecentBillingAuth,
} from "../src/lib/billing/permissions.ts";

const admin = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "billing@example.com",
  name: "Billing Admin",
  avatarUrl: null,
  authTime: 10_000,
};

const readSource = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), "utf8");

test("billing is enabled only by the exact server flag", () => {
  assert.equal(isBillingEnabled({ BILLING_ENABLED: "true" }), true);
  assert.equal(isBillingEnabled({ BILLING_ENABLED: "TRUE" }), false);
  assert.equal(isBillingEnabled({}), false);
});

test("cron authorization fails closed for absent or wrong configuration", () => {
  const valid = new Request("https://example.com", {
    headers: { authorization: "Bearer correct-secret" },
  });
  const wrong = new Request("https://example.com", {
    headers: { authorization: "Bearer wrong-secret" },
  });

  assert.throws(
    () => requireCronSecret(valid, {}),
    /Billing is not configured/,
  );
  assert.throws(
    () =>
      requireCronSecret(wrong, {
        BILLING_ENABLED: "true",
        BILLING_CRON_SECRET: "correct-secret",
      }),
    /Forbidden/,
  );
  assert.doesNotThrow(() =>
    requireCronSecret(valid, {
      BILLING_ENABLED: "true",
      BILLING_CRON_SECRET: "correct-secret",
    }),
  );
});

test("billing roles imply only the approved authority expansion", () => {
  assert.equal(hasBillingPermission(["BILLING_EDIT"], "BILLING_VIEW"), true);
  assert.equal(hasBillingPermission(["BILLING_EDIT"], "BILLING_EDIT"), true);
  assert.equal(
    hasBillingPermission(["BILLING_EDIT"], "BILLING_APPROVE"),
    false,
  );
  assert.equal(
    hasBillingPermission(["BILLING_APPROVE"], "BILLING_EDIT"),
    false,
  );

  for (const permission of [
    "BILLING_VIEW",
    "BILLING_EDIT",
    "BILLING_APPROVE",
    "BILLING_REFUND",
    "BILLING_ADMIN",
  ] as const) {
    assert.equal(
      hasBillingPermission(["BILLING_ADMIN"], permission),
      true,
      permission,
    );
  }
});

test("authorization rejects missing, inactive, and underprivileged admins", () => {
  assert.throws(
    () =>
      authorizeBillingIdentity({
        admin: null,
        active: false,
        granted: [],
        required: "BILLING_VIEW",
      }),
    /Forbidden/,
  );
  assert.throws(
    () =>
      authorizeBillingIdentity({
        admin,
        active: false,
        granted: ["BILLING_ADMIN"],
        required: "BILLING_VIEW",
      }),
    /Forbidden/,
  );
  assert.throws(
    () =>
      authorizeBillingIdentity({
        admin,
        active: true,
        granted: [],
        required: "BILLING_VIEW",
      }),
    /Forbidden/,
  );
  assert.throws(
    () =>
      authorizeBillingIdentity({
        admin,
        active: true,
        granted: ["BILLING_VIEW"],
        required: "BILLING_EDIT",
      }),
    /Forbidden/,
  );
});

test("authorization accepts an exact role and returns expanded permissions", () => {
  const identity = authorizeBillingIdentity({
    admin,
    active: true,
    granted: ["BILLING_EDIT"],
    required: "BILLING_EDIT",
  });

  assert.deepEqual(identity.permissions, ["BILLING_VIEW", "BILLING_EDIT"]);
  assert.equal(identity.email, admin.email);
});

test("recent authentication includes the 15-minute boundary only", () => {
  assert.equal(
    isRecentBillingAuth(9_100, { nowSeconds: 10_000, maxAgeSeconds: 900 }),
    true,
  );
  assert.equal(
    isRecentBillingAuth(9_099, { nowSeconds: 10_000, maxAgeSeconds: 900 }),
    false,
  );
  assert.equal(
    isRecentBillingAuth(10_001, { nowSeconds: 10_000, maxAgeSeconds: 900 }),
    false,
  );
  assert.equal(
    isRecentBillingAuth(null, { nowSeconds: 10_000, maxAgeSeconds: 900 }),
    false,
  );

  const error = new BillingReauthenticationRequiredError("/admin/billing");
  assert.equal(error.code, "reauth_required");
  assert.equal(
    error.redirectTo,
    "/admin/login?reason=reauth&returnTo=%2Fadmin%2Fbilling",
  );
});

test("Google sign-in time is persisted without ordinary JWT refresh", () => {
  const authSource = readSource("src/auth.ts");
  const typesSource = readSource("src/types/next-auth.d.ts");

  assert.match(authSource, /account\?\.provider === "google"/);
  assert.match(authSource, /token\.authTime = Math\.floor\(Date\.now\(\) \/ 1000\)/);
  assert.match(authSource, /session\.user\.authTime/);
  assert.match(typesSource, /authTime\?: number/);
});

test("billing admin seed is optional, explicit, and active-user-only", () => {
  const seedSource = readSource("scripts/seed-neon.mts");

  assert.match(seedSource, /BILLING_ADMIN_SEED_EMAILS/);
  assert.match(seedSource, /billingAdminEmails/);
  assert.match(seedSource, /BILLING_ADMIN/);
  assert.match(seedSource, /is_active = true/);
  assert.match(seedSource, /on conflict \(admin_id, role\) do nothing/);
  assert.doesNotMatch(
    seedSource,
    /from admin_users[\s\S]+where is_active = true\s+on conflict/,
  );
});

test("the production permission adapter checks the feature before data access", () => {
  const source = readSource("src/lib/billing/permissions.ts");
  const featureGuard = source.indexOf("isBillingEnabled()");
  const sessionRead = source.indexOf("getAdminSession");

  assert.notEqual(featureGuard, -1);
  assert.notEqual(sessionRead, -1);
  assert.ok(featureGuard < sessionRead);
  assert.match(source, /isAdminDevBypassEnabled\(\)/);
  assert.match(source, /billingAdminRoles/);
  assert.match(source, /adminUsers\.isActive/);
});
