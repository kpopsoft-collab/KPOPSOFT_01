import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(join(process.cwd(), "src/proxy.ts"), "utf8");

test("Proxy performs only an optimistic Auth.js session check", () => {
  assert.match(source, /NextAuth/);
  assert.match(source, /authConfig/);
  assert.match(source, /export async function proxy\(/);
  assert.doesNotMatch(
    source,
    /getDb|adminUsers|DATABASE_URL|createServerClient|Supabase|server-only|node:crypto/,
  );
  assert.match(source, /matcher:/);
  assert.match(source, /_next\/static/);
});
