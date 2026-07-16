import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { findAdminActionGuardViolations } from "./helpers/admin-action-policy.mts";

const actionsPath = join(
  process.cwd(),
  "src/app/admin/(shell)/billing/actions.ts",
);

function functionSource(source: string, name: string): string {
  const start = source.indexOf(`export async function ${name}`);
  assert.notEqual(start, -1, name);
  const next = source.indexOf("export async function ", start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

test("billing mutations use a billing guard before their service boundary", () => {
  const source = readFileSync(actionsPath, "utf8");
  assert.deepEqual(findAdminActionGuardViolations(source), []);
  assert.match(source, /import \{[\s\S]*requireBillingPermission/);
  assert.match(source, /requireRecentBillingAuth/);
});

test("each billing action requires the exact approved permission", () => {
  const source = readFileSync(actionsPath, "utf8");
  const expected = {
    createBillingCustomer: 'requireBillingPermission("BILLING_EDIT")',
    saveBillingContract: 'requireBillingPermission("BILLING_EDIT")',
    changeBillingContractState: 'requireBillingPermission("BILLING_EDIT")',
    updateBillingInvoiceDraft: 'requireBillingPermission("BILLING_EDIT")',
    approveBillingInvoice: 'requireRecentBillingAuth("BILLING_APPROVE")',
    voidBillingInvoice: 'requireRecentBillingAuth("BILLING_APPROVE")',
    retryBillingInvoiceDelivery:
      'requireBillingPermission("BILLING_EDIT")',
  } as const;

  for (const [name, guard] of Object.entries(expected)) {
    const body = functionSource(source, name);
    assert.match(body, new RegExp(guard.replace(/[()]/g, "\\$&")), name);
    const guardIndex = body.indexOf(guard);
    const serviceIndex = Math.min(
      ...[
        "createCustomerWithSite(",
        "saveContract(",
        "changeContractStatus(",
        "updateDraftInvoice(",
        "approveInvoice(",
        "voidInvoice(",
        "retryInvoiceDelivery(",
      ]
        .map((boundary) => body.indexOf(boundary))
        .filter((index) => index !== -1),
    );
    assert.ok(guardIndex < serviceIndex, name);
  }
});
