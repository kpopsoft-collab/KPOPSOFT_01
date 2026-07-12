import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { isAdminDevBypassEnabled } from "../src/lib/admin/runtime-mode.ts";

const source = readFileSync(join(process.cwd(), "src/proxy.ts"), "utf8");

test("proxy returns from the explicit dev bypass before constructing Supabase", () => {
  const bypass = source.indexOf("if (isAdminDevBypassEnabled())");
  const client = source.indexOf("createServerClient(");

  assert.notEqual(bypass, -1, "proxy must check the shared bypass policy");
  assert.notEqual(client, -1, "proxy must construct Supabase outside bypass mode");
  assert.ok(bypass < client, "bypass must run before createServerClient");
  assert.match(
    source.slice(bypass, client),
    /return NextResponse\.next\(\{ request \}\)/,
  );
});

test("proxy bypass policy remains fail-closed in production", () => {
  assert.equal(
    isAdminDevBypassEnabled({
      NODE_ENV: "production",
      ADMIN_DEV_BYPASS: "true",
    }),
    false,
  );
});
