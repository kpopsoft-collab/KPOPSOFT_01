import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const readSource = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), "utf8");

test("secure admin checks query the active Neon administrator", () => {
  const source = readSource("src/lib/admin/auth.ts");
  assert.match(source, /adminUsers/);
  assert.match(source, /adminUsers\.isActive/);
  assert.match(source, /eq\(adminUsers\.email/);
  assert.match(source, /await auth\(\)/);
  assert.doesNotMatch(source, /Supabase|createSupabase/);
});

test("the Proxy auth configuration stays database-free", () => {
  const proxySource = readSource("src/proxy.ts");
  const configSource = readSource("src/auth.config.ts");
  assert.match(proxySource, /NextAuth\(authConfig\)/);
  assert.doesNotMatch(
    `${proxySource}\n${configSource}`,
    /getDb|adminUsers|DATABASE_URL|Supabase/,
  );
});

test("admin authentication is Google-only and has no password fields", () => {
  const authSource = readSource("src/auth.ts");
  const configSource = readSource("src/auth.config.ts");
  const actionsSource = readSource("src/lib/admin/auth-actions.ts");
  const loginSource = readSource("src/app/admin/login/page.tsx");
  assert.match(`${configSource}\n${authSource}`, /Google/);
  assert.match(actionsSource, /signIn\("google"/);
  assert.match(loginSource, /Google로 로그인/);
  assert.doesNotMatch(loginSource, /type="password"|name="password"/);
  assert.doesNotMatch(actionsSource, /signInWithPassword|Supabase/);
});
