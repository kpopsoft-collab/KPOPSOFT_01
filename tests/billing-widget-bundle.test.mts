import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const bundlePath = join(process.cwd(), "public/widgets/kpopsoft-billing.v1.js");

test("widget is one dependency-free shadow DOM custom element", () => {
  const source = readFileSync(bundlePath, "utf8");
  assert.equal((source.match(/customElements\.define\("kpopsoft-billing"/g) ?? []).length, 1);
  assert.match(source, /attachShadow/);
  assert.match(source, /document\.currentScript/);
  assert.doesNotMatch(source, /from ["']|require\(|import\(/);
  assert.doesNotMatch(source, /api-base/);
});

test("widget obtains a same-origin token then uses credential-safe hub fetches", () => {
  const source = readFileSync(bundlePath, "utf8");
  assert.match(source, /credentials: "same-origin"/);
  assert.match(source, /credentials: "omit"/);
  assert.match(source, /\/api\/widget\/v1\/summary/);
  assert.match(source, /\/api\/widget\/v1\/handoffs/);
  assert.match(source, /Authorization/);
  assert.match(source, /X-KPOPSOFT-Widget/);
  assert.match(source, /window\.location\.assign/);
});

test("all safe summary states, Korean labels, and accessible controls are present", () => {
  const source = readFileSync(bundlePath, "utf8");
  for (const state of ["PREPARING", "UPCOMING", "OPEN", "OVERDUE", "PAID", "EMPTY"]) {
    assert.match(source, new RegExp(state));
  }
  for (const label of ["결제 준비 중", "다음 결제일", "결제하기", "납부 기한이 지났습니다", "결제 완료", "결제할 내역이 없습니다", "결제 정보를 불러오지 못했습니다", "다시 시도"]) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /aria-live/);
  assert.match(source, /role/);
  assert.match(source, /min-height: 44px/);
  assert.match(source, /\.disabled = true/);
});

test("server data is assigned as text and bundle has no forbidden merchant data", () => {
  const source = readFileSync(bundlePath, "utf8");
  assert.match(source, /textContent/);
  assert.doesNotMatch(source, /innerHTML/);
  assert.doesNotMatch(source, /businessNumber|registrationNumber|customerId|invoiceId|paymentKey|secretKey|TOSS_PAYMENTS/);
});

test("Vercel serves v1 with immutable cross-origin asset headers", () => {
  const config = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8"));
  const rule = config.headers?.find(
    (entry: { source?: string }) => entry.source === "/widgets/kpopsoft-billing.v1.js",
  );
  assert.ok(rule);
  const headers = Object.fromEntries(
    rule.headers.map((entry: { key: string; value: string }) => [entry.key, entry.value]),
  );
  assert.equal(headers["Cache-Control"], "public, max-age=31536000, immutable");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Cross-Origin-Resource-Policy"], "cross-origin");
  assert.ok(config.crons.some((entry: { path: string }) => entry.path === "/api/internal/billing/generate"));
});
