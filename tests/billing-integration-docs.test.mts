import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test("integration list and detail require billing view and never select encrypted fields", () => {
  const list = read("src/app/admin/(shell)/billing/integrations/page.tsx");
  const detail = read("src/app/admin/(shell)/billing/integrations/[id]/page.tsx");
  const service = read("src/lib/billing/widget/integrations.ts");
  assert.match(list, /requireBillingPageView/);
  assert.match(detail, /requireBillingPageView/);
  assert.match(list + detail, /publicId/);
  const readBoundary = service.slice(service.indexOf("export async function listWidgetIntegrationsForAdmin"));
  assert.doesNotMatch(readBoundary, /encryptedSecret|secretIv|secretTag/);
});

test("integration UI warns before rotation and provides version-pinned embed HTML", () => {
  const source = [
    read("src/app/admin/(shell)/billing/integrations/[id]/page.tsx"),
    read("src/components/admin/billing/integration-manager.tsx"),
  ].join("\n");
  assert.match(source, /kpopsoft-billing\.v1\.js/);
  assert.match(source, /kpopsoft-billing/);
  assert.match(source, /기존.*비밀키|즉시.*무효|교체/);
  assert.match(source, /IntegrationKeyDialog/);
});

test("all guides authenticate first, use server env, short tokens, no-store, and pinned component", () => {
  for (const path of [
    "docs/billing/widget-integration-nextjs.md",
    "docs/billing/widget-integration-php.md",
    "docs/billing/widget-integration-rest.md",
  ]) {
    const source = read(path);
    assert.match(source, /로그인|세션|authenticate/i, path);
    assert.match(source, /환경변수|environment/i, path);
    assert.match(source, /120|2분/, path);
    assert.match(source, /jti/i, path);
    assert.match(source, /HMAC-SHA256|sha256/i, path);
    assert.match(source, /Cache-Control.*no-store/i, path);
    assert.match(source, /kpopsoft-billing\.v1\.js/, path);
    assert.match(source, /브라우저.*비밀키|비밀키.*브라우저/, path);
  }
});

test("PHP and generic guides preserve exact signing and a fixed vector", () => {
  const php = read("docs/billing/widget-integration-php.md");
  const rest = read("docs/billing/widget-integration-rest.md");
  assert.match(php, /hash_hmac\('sha256'[\s\S]*true\)/);
  assert.match(php, /rtrim\(strtr\(base64_encode[\s\S]*/);
  assert.match(rest, /iss[\s\S]*aud[\s\S]*siteId[\s\S]*sub[\s\S]*iat[\s\S]*exp[\s\S]*jti[\s\S]*kv/);
  assert.match(rest, /고정 테스트 벡터/);
  assert.match(rest, /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
});
