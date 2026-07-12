import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
  assert.equal(
    resolveAdminDataMode({
      NODE_ENV: "production",
      ADMIN_DEV_BYPASS: "true",
    }),
    "misconfigured",
  );
  assert.equal(
    resolveAdminDataMode({
      NODE_ENV: "development",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    }),
    "misconfigured",
  );
  assert.equal(
    resolveAdminDataMode({
      NODE_ENV: "development",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret",
    }),
    "misconfigured",
  );
  assert.equal(
    resolveAdminDataMode({
      NODE_ENV: "production",
      ADMIN_DEV_BYPASS: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret",
    }),
    "supabase",
  );
});

test("every admin repository accessor uses the shared fail-closed mode policy", () => {
  for (const relativePath of [
    "src/lib/admin/data.ts",
    "src/lib/admin/content-data.ts",
    "src/lib/admin/inquiry-options.ts",
  ]) {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");
    const accessor = source.slice(source.lastIndexOf("export function get"));

    assert.match(source, /import \{ resolveAdminDataMode \}/, relativePath);
    assert.match(accessor, /const mode = resolveAdminDataMode\(\)/, relativePath);
    assert.match(accessor, /if \(mode === "supabase"\)/, relativePath);
    assert.match(accessor, /if \(mode === "mock"\) return /, relativePath);
    assert.match(accessor, /throw new Error\("Admin data source is not configured"\)/, relativePath);
    assert.doesNotMatch(accessor, /process\.env\./, relativePath);
  }
});
