import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "database/migrations/0001_vercel_admin_platform.sql",
  ),
  "utf8",
);

test("the Neon migration creates the full platform schema idempotently", () => {
  for (const table of [
    "admin_users",
    "audit_logs",
    "inquiries",
    "inquiry_types",
    "inquiry_subtypes",
    "work_items",
    "insights",
    "testimonials",
    "experts",
    "stats",
    "media_assets",
  ]) {
    assert.match(migration, new RegExp(`create table if not exists ${table}`));
  }

  assert.match(migration, /inquiries_submission_key_uidx/);
  assert.match(migration, /inquiries_email_status_check/);
  assert.match(migration, /inquiries_linear_status_check/);
  assert.match(migration, /create or replace function set_updated_at/);
  assert.match(migration, /drop trigger if exists inquiries_set_updated_at/);
  assert.match(migration, /jsonb_typeof\(results\) = 'array'/);
});
