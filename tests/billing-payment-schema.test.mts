import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";

import {
  billingBankReceipts,
  billingPaymentAttempts,
  billingPaymentEvents,
  billingPayments,
  billingRefunds,
  billingWebhookReceipts,
} from "../src/lib/db/schema.ts";

const tables = [
  billingPaymentAttempts,
  billingPayments,
  billingBankReceipts,
  billingRefunds,
  billingPaymentEvents,
  billingWebhookReceipts,
] as const;

const config = (table: PgTable) => getTableConfig(table);
const columns = (table: PgTable) =>
  config(table).columns.map((column) => column.name);
const checks = (table: PgTable) =>
  config(table).checks.map((value) => value.name);
const indexes = (table: PgTable) =>
  config(table).indexes.map((value) => value.config.name);

test("the Drizzle schema exports all six payment tables", () => {
  assert.deepEqual(
    tables.map((table) => config(table).name),
    [
      "billing_payment_attempts",
      "billing_payments",
      "billing_bank_receipts",
      "billing_refunds",
      "billing_payment_events",
      "billing_webhook_receipts",
    ],
  );
});

test("attempts and completed payments preserve amount and provider identity", () => {
  assert.deepEqual(columns(billingPaymentAttempts), [
    "id",
    "invoice_id",
    "order_id",
    "amount",
    "status",
    "idempotency_key",
    "expires_at",
    "payment_key",
    "failure_code",
    "confirmed_at",
    "created_at",
    "updated_at",
  ]);
  assert.deepEqual(columns(billingPayments), [
    "id",
    "invoice_id",
    "attempt_id",
    "method",
    "amount",
    "approved_at",
    "toss_payment_key",
    "toss_mid",
    "approval_number",
    "masked_method",
    "refunded_amount",
    "created_at",
    "updated_at",
  ]);
  assert.ok(indexes(billingPaymentAttempts).includes("billing_payment_attempts_order_id_uidx"));
  assert.ok(indexes(billingPayments).includes("billing_payments_toss_payment_key_uidx"));
  assert.ok(indexes(billingPayments).includes("billing_payments_completed_invoice_uidx"));
  assert.ok(checks(billingPayments).includes("billing_payments_refunded_amount_check"));
});

test("bank, refund, event, and webhook rows support auditable operations", () => {
  assert.ok(columns(billingBankReceipts).includes("depositor_name"));
  assert.ok(columns(billingBankReceipts).includes("confirmed_by"));
  assert.ok(columns(billingRefunds).includes("toss_transaction_key"));
  assert.ok(columns(billingRefunds).includes("idempotency_key"));
  assert.deepEqual(columns(billingPaymentEvents), [
    "id",
    "payment_id",
    "attempt_id",
    "refund_id",
    "source",
    "event_type",
    "from_status",
    "to_status",
    "correlation_id",
    "occurred_at",
    "metadata",
    "created_at",
  ]);
  assert.ok(
    checks(billingPaymentEvents).includes(
      "billing_payment_events_entity_reference_check",
    ),
  );
  assert.ok(columns(billingWebhookReceipts).includes("payment_key_hash"));
  assert.ok(indexes(billingWebhookReceipts).includes("billing_webhook_receipts_transmission_id_uidx"));
});

test("0003 SQL mirrors uniqueness, checks, indexes, foreign keys, and triggers", () => {
  const sql = readFileSync(
    join(process.cwd(), "database/migrations/0003_billing_payments.sql"),
    "utf8",
  );
  for (const table of [
    "billing_payment_attempts",
    "billing_payments",
    "billing_bank_receipts",
    "billing_refunds",
    "billing_payment_events",
    "billing_webhook_receipts",
  ]) {
    assert.match(sql, new RegExp(`create table if not exists ${table}`));
  }
  assert.match(
    sql,
    /create unique index if not exists billing_payments_completed_invoice_uidx[\s\S]*where amount > 0/,
  );
  assert.match(sql, /constraint billing_payment_events_entity_reference_check/);
  assert.match(sql, /octet_length\(payment_key_hash\) = 32/);
  assert.match(sql, /octet_length\(payload_hash\) = 32/);
  assert.match(sql, /references billing_invoices \(id\) on delete restrict/);
  assert.match(sql, /billing_payment_attempts_set_updated_at/);
  assert.match(sql, /billing_webhook_receipts_set_updated_at/);
});
