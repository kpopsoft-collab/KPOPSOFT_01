import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

const publishedContent = {
  id: uuid("id").primaryKey().defaultRandom(),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  ...timestamps,
};

const accentCheck = (column: { name: string }) =>
  sql.raw(
    `"${column.name}" in ('blue','red','yellow','coral','mint','sky','navy')`,
  );

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("admin_users_email_uidx").on(table.email)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorAdminId: uuid("actor_admin_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_actor_idx").on(table.actorAdminId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionKey: text("submission_key").notNull(),
    type: text("type").notNull(),
    subtype: text("subtype").notNull(),
    sender: text("sender").notNull().default(""),
    contact: text("contact").notNull().default(""),
    message: text("message").notNull(),
    status: text("status").notNull().default("new"),
    memo: text("memo").notNull().default(""),
    emailStatus: text("email_status").notNull().default("pending"),
    emailMessageId: text("email_message_id"),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    emailError: text("email_error"),
    linearStatus: text("linear_status").notNull().default("pending"),
    linearIssueId: text("linear_issue_id"),
    linearIssueUrl: text("linear_issue_url"),
    linearError: text("linear_error"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("inquiries_submission_key_uidx").on(table.submissionKey),
    index("inquiries_status_idx").on(table.status),
    index("inquiries_created_at_idx").on(table.createdAt),
    check(
      "inquiries_status_check",
      sql`${table.status} in ('new', 'in_progress', 'done')`,
    ),
    check(
      "inquiries_email_status_check",
      sql`${table.emailStatus} in ('pending', 'sent', 'failed')`,
    ),
    check(
      "inquiries_linear_status_check",
      sql`${table.linearStatus} in ('pending', 'created', 'failed')`,
    ),
  ],
);

export const inquiryTypes = pgTable(
  "inquiry_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("inquiry_types_label_uidx").on(table.label),
    check("inquiry_types_sort_order_check", sql`${table.sortOrder} >= 0`),
  ],
);

export const inquirySubtypes = pgTable(
  "inquiry_subtypes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    typeId: uuid("type_id")
      .notNull()
      .references(() => inquiryTypes.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    placeholder: text("placeholder").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("inquiry_subtypes_type_label_uidx").on(
      table.typeId,
      table.label,
    ),
    index("inquiry_subtypes_type_id_idx").on(table.typeId),
    check("inquiry_subtypes_sort_order_check", sql`${table.sortOrder} >= 0`),
  ],
);

export const workItems = pgTable(
  "work_items",
  {
    ...publishedContent,
    client: text("client").notNull().default(""),
    title: text("title").notNull().default(""),
    category: text("category").notNull().default(""),
    accent: text("accent").notNull().default("blue"),
    summary: text("summary").notNull().default(""),
    challenge: text("challenge").notNull().default(""),
    solution: text("solution").notNull().default(""),
    results: jsonb("results").$type<string[]>().notNull().default([]),
    imageUrl: text("image_url"),
  },
  (table) => [
    check("work_items_sort_order_check", sql`${table.sortOrder} >= 0`),
    check("work_items_accent_check", accentCheck(table.accent)),
    check("work_items_results_array_check", sql`jsonb_typeof(${table.results}) = 'array'`),
  ],
);

export const insights = pgTable(
  "insights",
  {
    ...publishedContent,
    tag: text("tag").notNull().default(""),
    title: text("title").notNull().default(""),
    date: text("date").notNull().default(""),
    accent: text("accent").notNull().default("blue"),
    excerpt: text("excerpt").notNull().default(""),
    body: jsonb("body").$type<string[]>().notNull().default([]),
    slug: text("slug").notNull(),
    imageUrl: text("image_url"),
    inquiryType: text("inquiry_type"),
    inquirySubtype: text("inquiry_subtype"),
  },
  (table) => [
    uniqueIndex("insights_slug_uidx").on(table.slug),
    check("insights_sort_order_check", sql`${table.sortOrder} >= 0`),
    check("insights_accent_check", accentCheck(table.accent)),
    check("insights_body_array_check", sql`jsonb_typeof(${table.body}) = 'array'`),
  ],
);

export const testimonials = pgTable(
  "testimonials",
  {
    ...publishedContent,
    quote: text("quote").notNull().default(""),
    author: text("author").notNull().default(""),
    program: text("program").notNull().default(""),
    result: text("result").notNull().default(""),
  },
  (table) => [
    check("testimonials_sort_order_check", sql`${table.sortOrder} >= 0`),
  ],
);

export const experts = pgTable(
  "experts",
  {
    ...publishedContent,
    name: text("name").notNull().default(""),
    role: text("role").notNull().default(""),
    quote: text("quote").notNull().default(""),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    accent: text("accent").notNull().default("blue"),
    imageUrl: text("image_url"),
  },
  (table) => [
    check("experts_sort_order_check", sql`${table.sortOrder} >= 0`),
    check("experts_accent_check", accentCheck(table.accent)),
    check("experts_tags_array_check", sql`jsonb_typeof(${table.tags}) = 'array'`),
  ],
);

export const stats = pgTable(
  "stats",
  {
    ...publishedContent,
    value: integer("value").notNull().default(0),
    suffix: text("suffix").notNull().default(""),
    label: text("label").notNull().default(""),
  },
  (table) => [
    check("stats_sort_order_check", sql`${table.sortOrder} >= 0`),
    check("stats_value_check", sql`${table.value} >= 0`),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blobUrl: text("blob_url").notNull(),
    pathname: text("pathname").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("media_assets_blob_url_uidx").on(table.blobUrl),
    index("media_assets_uploaded_by_idx").on(table.uploadedBy),
    check("media_assets_size_check", sql`${table.sizeBytes} >= 0`),
    check(
      "media_assets_content_type_check",
      sql`${table.contentType} in ('image/jpeg', 'image/png', 'image/webp')`,
    ),
  ],
);

export type AdminUserRow = typeof adminUsers.$inferSelect;
export type InquiryRow = typeof inquiries.$inferSelect;
