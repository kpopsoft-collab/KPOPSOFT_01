import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test("operations snapshot contains only bounded counts and the last run timestamp", () => {
  const source = read("src/lib/billing/operations.ts");
  for (const metric of [
    "draftApprovals",
    "overdueInvoices",
    "deliveryFailures",
    "confirmingRecent",
    "confirmingStale",
    "webhookRetries",
    "processingRefunds",
    "failedRefunds",
    "lastBillingRunAt",
  ]) {
    assert.match(source, new RegExp(metric), metric);
  }
  assert.doesNotMatch(
    source,
    /recipient|contact|paymentKey|tossPaymentKey|encryptedSecret|secretIv|secretTag|rawError/i,
  );
});

test("operations queries use explicit status buckets and dashboard renders them", () => {
  const operations = read("src/lib/billing/operations.ts");
  const dashboard = read("src/app/admin/(shell)/billing/page.tsx");
  for (const status of ["DRAFT", "OVERDUE", "FAILED", "CONFIRMING", "RETRY", "PROCESSING"]) {
    assert.match(operations, new RegExp(status), status);
  }
  assert.match(operations, /interval '15 minutes'/);
  assert.match(dashboard, /getBillingOperationsSnapshot/);
  assert.match(dashboard, /확인 중 15분 초과|웹훅 재처리|환불 처리 중/);
});

test("billing browser suite is synthetic by default and gates destructive Preview flows", () => {
  const config = read("playwright.config.ts");
  const widget = read("e2e/billing-widget.spec.ts");
  const admin = read("e2e/billing-admin.spec.ts");
  const packageJson = JSON.parse(read("package.json"));
  assert.equal(packageJson.scripts["test:e2e"], "playwright test");
  assert.match(packageJson.scripts["test:e2e:billing"], /billing-widget\.spec\.ts.*billing-admin\.spec\.ts/);
  assert.match(config, /fixture-server\.mjs/);
  assert.match(widget, /PREPARING|UPCOMING|OVERDUE|PAID/);
  assert.match(widget, /390/);
  assert.match(widget, /minHeight/);
  assert.match(admin, /BILLING_E2E_DISPOSABLE_PREVIEW/);
  assert.match(admin, /test\.skip/);
});
