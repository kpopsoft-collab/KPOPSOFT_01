import assert from "node:assert/strict";
import test from "node:test";

import {
  isAdminDevBypassEnabled,
  resolveAdminDataMode,
} from "../src/lib/admin/runtime-mode.ts";

test("admin bypass is opt-in and never enabled in production", () => {
  assert.equal(isAdminDevBypassEnabled({ NODE_ENV: "development" }), false);
  assert.equal(
    isAdminDevBypassEnabled({
      NODE_ENV: "development",
      ADMIN_DEV_BYPASS: "true",
    }),
    true,
  );
  assert.equal(
    isAdminDevBypassEnabled({
      NODE_ENV: "production",
      ADMIN_DEV_BYPASS: "true",
    }),
    false,
  );
});

test("admin data never falls back to mock storage implicitly", () => {
  assert.equal(
    resolveAdminDataMode({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret",
    }),
    "supabase",
  );
  assert.equal(resolveAdminDataMode({ NODE_ENV: "production" }), "misconfigured");
  assert.equal(
    resolveAdminDataMode({
      NODE_ENV: "development",
      ADMIN_DEV_BYPASS: "true",
    }),
    "mock",
  );
});
