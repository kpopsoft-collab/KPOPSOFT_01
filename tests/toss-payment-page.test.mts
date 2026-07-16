import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test("attempt route accepts no client amount or invoice id and disables caching", () => {
  const source = read("src/app/api/payments/toss/attempts/route.ts");
  assert.match(source, /force-dynamic/);
  assert.match(source, /no-store/);
  assert.match(source, /requirePaymentSession/);
  assert.doesNotMatch(source, /body\.amount|invoiceId/);
  assert.doesNotMatch(source, /TOSS_PAYMENTS_SECRET_KEY/);
});

test("invoice page loads the V2 SDK only on the protected payment route", () => {
  const page = read("src/app/pay/invoices/[invoiceNumber]/page.tsx");
  const component = read("src/components/billing/toss-payment-button.tsx");
  assert.match(page, /requirePaymentSession/);
  assert.match(page, /force-dynamic/);
  assert.match(component, /https:\/\/js\.tosspayments\.com\/v2\/standard/);
  assert.match(component, /setAmount/);
  assert.match(component, /renderPaymentMethods/);
  assert.match(component, /requestPayment/);
  assert.match(component, /disabled=/);
  assert.doesNotMatch(page + component, /TOSS_PAYMENTS_SECRET_KEY|test_gsk_|live_gsk_/);
});

test("success and failure pages use client bridges and never mutate in server components", () => {
  const success = read("src/app/pay/invoices/[invoiceNumber]/success/page.tsx");
  const fail = read("src/app/pay/invoices/[invoiceNumber]/fail/page.tsx");
  assert.match(success, /TossSuccessBridge/);
  assert.match(fail, /TossFailureNotice/);
  assert.doesNotMatch(success + fail, /getDb\(|\.update\(|\.insert\(/);
});
