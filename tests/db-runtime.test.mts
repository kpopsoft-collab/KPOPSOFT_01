import assert from "node:assert/strict";
import test from "node:test";

import {
  hasDatabaseUrl,
  requireDatabaseUrl,
} from "../src/lib/db/runtime.ts";

test("database configuration is explicit", () => {
  assert.equal(hasDatabaseUrl({}), false);
  assert.equal(
    hasDatabaseUrl({ DATABASE_URL: "postgresql://example" }),
    true,
  );
});

test("database access fails closed without DATABASE_URL", () => {
  assert.throws(
    () => requireDatabaseUrl({}),
    /DATABASE_URL is not configured/,
  );
});
