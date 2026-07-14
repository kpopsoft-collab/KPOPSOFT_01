import assert from "node:assert/strict";
import test from "node:test";

import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";

import {
  adminUsers,
  auditLogs,
  experts,
  inquiries,
  inquirySubtypes,
  inquiryTypes,
  insights,
  mediaAssets,
  stats,
  testimonials,
  workItems,
} from "../src/lib/db/schema.ts";

const tableName = (table: PgTable) => getTableConfig(table).name;
const columnNames = (table: PgTable) =>
  getTableConfig(table).columns.map((column) => column.name);

test("the Neon schema exposes every administrator platform table", () => {
  assert.deepEqual(
    [
      adminUsers,
      auditLogs,
      inquiries,
      inquiryTypes,
      inquirySubtypes,
      workItems,
      insights,
      testimonials,
      experts,
      stats,
      mediaAssets,
    ].map(tableName),
    [
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
    ],
  );
});

test("inquiry delivery and option placeholder columns match the UI contract", () => {
  assert.deepEqual(columnNames(inquiries), [
    "id",
    "submission_key",
    "type",
    "subtype",
    "sender",
    "contact",
    "message",
    "status",
    "memo",
    "email_status",
    "email_message_id",
    "email_sent_at",
    "email_error",
    "linear_status",
    "linear_issue_id",
    "linear_issue_url",
    "linear_error",
    "created_at",
    "updated_at",
  ]);
  assert.ok(columnNames(inquirySubtypes).includes("placeholder"));
});
