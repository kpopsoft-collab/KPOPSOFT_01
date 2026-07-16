import assert from "node:assert/strict";
import test from "node:test";

import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";

import {
  billingAdminRoles,
  billingContractItems,
  billingContracts,
  billingCustomerContacts,
  billingCustomers,
  billingInvoiceDeliveries,
  billingInvoiceItems,
  billingInvoices,
  billingProducts,
  billingRuns,
  billingSites,
} from "../src/lib/db/schema.ts";

const tables = [
  billingCustomers,
  billingCustomerContacts,
  billingSites,
  billingProducts,
  billingContracts,
  billingContractItems,
  billingRuns,
  billingInvoices,
  billingInvoiceItems,
  billingInvoiceDeliveries,
  billingAdminRoles,
] as const;

const tableName = (table: PgTable) => getTableConfig(table).name;
const columnNames = (table: PgTable) =>
  getTableConfig(table).columns.map((column) => column.name);
const checkNames = (table: PgTable) =>
  getTableConfig(table).checks.map((check) => check.name);

test("the Drizzle schema exports every billing foundation table", () => {
  assert.deepEqual(tables.map(tableName), [
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
  ]);
});

test("customer and contract columns preserve billing ownership and cadence", () => {
  assert.deepEqual(columnNames(billingCustomers), [
    "id",
    "code",
    "name",
    "business_number",
    "representative_name",
    "tax_email",
    "status",
    "created_at",
    "updated_at",
  ]);
  assert.deepEqual(columnNames(billingContracts), [
    "id",
    "customer_id",
    "site_id",
    "status",
    "cycle",
    "start_date",
    "end_date",
    "billing_anchor_day",
    "next_invoice_date",
    "due_days",
    "auto_renew",
    "created_at",
    "updated_at",
  ]);
});

test("invoice columns keep immutable totals and approval history", () => {
  assert.deepEqual(columnNames(billingInvoices), [
    "id",
    "number",
    "customer_id",
    "site_id",
    "contract_id",
    "generation_key",
    "period_start",
    "period_end",
    "issue_date",
    "due_date",
    "currency",
    "supply_amount",
    "vat_amount",
    "total_amount",
    "status",
    "approved_by",
    "approved_at",
    "voided_by",
    "voided_at",
    "void_reason",
    "created_at",
    "updated_at",
  ]);
  assert.ok(columnNames(billingInvoiceItems).includes("product_name"));
  assert.ok(columnNames(billingInvoiceDeliveries).includes("next_retry_at"));
  assert.ok(columnNames(billingAdminRoles).includes("granted_by"));
});

test("Drizzle mirrors normalization and lifecycle checks from SQL", () => {
  for (const check of [
    "billing_customers_code_check",
    "billing_customers_business_number_check",
  ]) {
    assert.ok(checkNames(billingCustomers).includes(check), check);
  }
  for (const check of [
    "billing_invoices_number_check",
    "billing_invoices_approval_check",
    "billing_invoices_void_check",
  ]) {
    assert.ok(checkNames(billingInvoices).includes(check), check);
  }
  assert.ok(
    checkNames(billingInvoiceDeliveries).includes(
      "billing_invoice_deliveries_recipient_check",
    ),
  );
});
