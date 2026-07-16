import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test("payment operations pages require BILLING_VIEW through the shared page guard", () => {
  const list = read("src/app/admin/(shell)/billing/payments/page.tsx");
  const detail = read("src/app/admin/(shell)/billing/payments/[id]/page.tsx");
  const auth = read("src/lib/billing/page-auth.ts");
  assert.match(list, /requireBillingPageView/);
  assert.match(detail, /requireBillingPageView/);
  assert.match(auth, /requireBillingPermission\("BILLING_VIEW"\)/);
});

test("bank, refund, and provider requery use their exact recent authority", () => {
  const invoiceActions = read("src/app/admin/(shell)/billing/actions.ts");
  const paymentActions = read("src/app/admin/(shell)/billing/payment-actions.ts");
  assert.ok(invoiceActions.indexOf('requireRecentBillingAuth("BILLING_APPROVE")') < invoiceActions.indexOf("confirmBankReceipt("));
  assert.ok(paymentActions.indexOf('requireRecentBillingAuth("BILLING_REFUND")') < paymentActions.indexOf("requestTossRefund("));
  assert.ok(paymentActions.indexOf('requireRecentBillingAuth("BILLING_APPROVE")') < paymentActions.indexOf("requeryBillingPayment("));
});

test("public payment and widget routes never depend on admin authorization", () => {
  const publicSources = [
    "src/app/api/payments/toss/attempts/route.ts",
    "src/app/api/payments/toss/confirm/route.ts",
    "src/app/api/payments/toss/webhook/route.ts",
    "src/app/api/widget/v1/summary/route.ts",
    "src/app/api/widget/v1/handoffs/route.ts",
  ].map(read).join("\n");
  assert.doesNotMatch(publicSources, /requireAdminAction|requireBillingPermission|requireRecentBillingAuth/);
});

test("rendered payment contracts contain no secret, full payment key, or raw provider error", () => {
  const rendered = [
    "src/app/admin/(shell)/billing/payments/page.tsx",
    "src/app/admin/(shell)/billing/payments/[id]/page.tsx",
    "src/components/admin/billing/refund-form.tsx",
    "src/components/billing/toss-payment-button.tsx",
  ].map(read).join("\n");
  assert.doesNotMatch(rendered, /TOSS_PAYMENTS_SECRET_KEY|test_gsk_|live_gsk_|tossPaymentKey|payment_key|error\.stack/);
});

test("navigation exposes payment operations and site integrations", () => {
  const nav = read("src/components/admin/admin-nav.ts");
  assert.match(nav, /\/admin\/billing\/payments/);
  assert.match(nav, /\/admin\/billing\/integrations/);
});
