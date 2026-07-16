import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(process.cwd(), "database/migrations/0002_billing_foundation.sql"),
  "utf8",
);

const tables = [
  "billing_customers",
  "billing_customer_contacts",
  "billing_sites",
  "billing_products",
  "billing_contracts",
  "billing_contract_items",
  "billing_runs",
  "billing_invoices",
  "billing_invoice_items",
  "billing_invoice_deliveries",
  "billing_admin_roles",
] as const;

test("the migration creates every billing table idempotently", () => {
  for (const table of tables) {
    assert.match(
      migration,
      new RegExp(`create table if not exists ${table}`),
      table,
    );
  }
});

test("billing uniqueness and operational indexes are database-enforced", () => {
  for (const index of [
    "billing_customers_code_uidx",
    "billing_sites_code_uidx",
    "billing_sites_origin_uidx",
    "billing_products_code_uidx",
    "billing_invoices_number_uidx",
    "billing_invoices_generation_key_uidx",
    "billing_admin_roles_admin_role_uidx",
    "billing_contracts_due_idx",
    "billing_invoices_customer_idx",
    "billing_invoices_site_idx",
    "billing_invoices_status_due_idx",
    "billing_invoice_deliveries_retry_idx",
  ]) {
    assert.match(migration, new RegExp(index), index);
  }
});

test("billing state, amount, origin, and permission checks fail closed", () => {
  for (const constraint of [
    "billing_customers_status_check",
    "billing_sites_origin_check",
    "billing_contracts_status_check",
    "billing_contracts_cycle_check",
    "billing_contracts_anchor_check",
    "billing_contract_items_amount_check",
    "billing_invoices_currency_check",
    "billing_invoices_amount_check",
    "billing_invoices_status_check",
    "billing_invoice_items_amount_check",
    "billing_invoice_deliveries_status_check",
    "billing_admin_roles_role_check",
  ]) {
    assert.match(migration, new RegExp(`constraint ${constraint}`), constraint);
  }

  assert.match(migration, /total_amount = supply_amount \+ vat_amount/);
  assert.match(migration, /billing_anchor_day between 1 and 31/);
  assert.match(migration, /BILLING_ADMIN/);
  assert.match(migration, /\^https:\/\//);
});

test("billing foreign keys and update triggers preserve history", () => {
  assert.match(migration, /references admin_users \(id\) on delete restrict/);
  assert.match(migration, /references billing_customers \(id\) on delete restrict/);
  assert.match(migration, /references billing_contracts \(id\) on delete restrict/);

  for (const table of tables) {
    assert.match(
      migration,
      new RegExp(`drop trigger if exists ${table}_set_updated_at on ${table}`),
      table,
    );
  }
});
