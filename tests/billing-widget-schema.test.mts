import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";

import {
  billingHandoffs,
  billingPaymentSessions,
  billingWidgetIntegrations,
  billingWidgetRateLimits,
  billingWidgetTokenUses,
} from "../src/lib/db/schema.ts";

const tables = [
  billingWidgetIntegrations,
  billingWidgetTokenUses,
  billingWidgetRateLimits,
  billingHandoffs,
  billingPaymentSessions,
] as const;

const config = (table: PgTable) => getTableConfig(table);
const names = (table: PgTable) =>
  config(table).columns.map((column) => column.name);
const checkNames = (table: PgTable) =>
  config(table).checks.map((value) => value.name);
const indexNames = (table: PgTable) =>
  config(table).indexes.map((value) => value.config.name);

test("the Drizzle schema exports the five widget access tables", () => {
  assert.deepEqual(
    tables.map((table) => config(table).name),
    [
      "billing_widget_integrations",
      "billing_widget_token_uses",
      "billing_widget_rate_limits",
      "billing_handoffs",
      "billing_payment_sessions",
    ],
  );
});

test("integration credentials stay encrypted and lifecycle constrained", () => {
  assert.deepEqual(names(billingWidgetIntegrations), [
    "id",
    "public_id",
    "site_id",
    "encrypted_secret",
    "secret_iv",
    "secret_tag",
    "allowed_origin",
    "key_version",
    "status",
    "last_used_at",
    "rotated_at",
    "created_at",
    "updated_at",
  ]);
  assert.deepEqual(
    checkNames(billingWidgetIntegrations).sort(),
    [
      "billing_widget_integrations_allowed_origin_check",
      "billing_widget_integrations_key_version_check",
      "billing_widget_integrations_secret_iv_check",
      "billing_widget_integrations_secret_tag_check",
      "billing_widget_integrations_status_check",
    ].sort(),
  );
  assert.ok(
    indexNames(billingWidgetIntegrations).includes(
      "billing_widget_integrations_public_id_uidx",
    ),
  );
  assert.ok(
    indexNames(billingWidgetIntegrations).includes(
      "billing_widget_integrations_site_id_uidx",
    ),
  );
});

test("replay and rate-limit state use hashes and atomic bucket uniqueness", () => {
  assert.deepEqual(names(billingWidgetTokenUses), [
    "id",
    "integration_id",
    "jti_hash",
    "origin_hash",
    "expires_at",
    "first_used_at",
    "last_used_at",
    "use_count",
    "created_at",
  ]);
  assert.ok(
    checkNames(billingWidgetTokenUses).includes(
      "billing_widget_token_uses_use_count_check",
    ),
  );
  assert.deepEqual(names(billingWidgetRateLimits), [
    "id",
    "integration_id",
    "scope",
    "key_hash",
    "bucket_start",
    "request_count",
    "created_at",
    "updated_at",
  ]);
  assert.ok(
    checkNames(billingWidgetRateLimits).includes(
      "billing_widget_rate_limits_scope_check",
    ),
  );
  assert.ok(
    indexNames(billingWidgetRateLimits).includes(
      "billing_widget_rate_limits_bucket_uidx",
    ),
  );
});

test("handoffs and sessions are hash-only, scoped, and expiry-indexed", () => {
  assert.deepEqual(names(billingHandoffs), [
    "id",
    "token_hash",
    "integration_id",
    "site_id",
    "customer_id",
    "expires_at",
    "used_at",
    "created_ip_hash",
    "created_at",
  ]);
  assert.deepEqual(names(billingPaymentSessions), [
    "id",
    "session_hash",
    "site_id",
    "customer_id",
    "expires_at",
    "absolute_expires_at",
    "revoked_at",
    "last_seen_at",
    "created_at",
    "updated_at",
  ]);
  assert.ok(indexNames(billingHandoffs).includes("billing_handoffs_expiry_idx"));
  assert.ok(
    indexNames(billingPaymentSessions).includes(
      "billing_payment_sessions_active_scope_idx",
    ),
  );
});

test("0004 migration mirrors byte sizes, foreign keys, indexes, and triggers", () => {
  const sql = readFileSync(
    join(process.cwd(), "database/migrations/0004_billing_widget.sql"),
    "utf8",
  );

  for (const table of [
    "billing_widget_integrations",
    "billing_widget_token_uses",
    "billing_widget_rate_limits",
    "billing_handoffs",
    "billing_payment_sessions",
  ]) {
    assert.match(sql, new RegExp(`create table if not exists ${table}`));
  }
  assert.match(sql, /octet_length\(secret_iv\) = 12/);
  assert.match(sql, /octet_length\(secret_tag\) = 16/);
  assert.match(sql, /allowed_origin ~ '\^https:\/\/\[\^\/\]\+\$'/);
  assert.match(
    sql,
    /unique \(integration_id, scope, key_hash, bucket_start\)/,
  );
  assert.match(sql, /references billing_sites \(id\) on delete restrict/);
  assert.match(sql, /references billing_customers \(id\) on delete restrict/);
  assert.match(sql, /billing_widget_integrations_set_updated_at/);
  assert.match(sql, /billing_widget_rate_limits_set_updated_at/);
  assert.match(sql, /billing_payment_sessions_set_updated_at/);
});
