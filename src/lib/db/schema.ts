import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type {
  BillingCycle,
  BillingPermission,
  ContractStatus,
  InvoiceStatus,
} from "../billing/types";

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

export const billingCustomers = pgTable(
  "billing_customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    businessNumber: text("business_number"),
    representativeName: text("representative_name").notNull().default(""),
    taxEmail: text("tax_email"),
    status: text("status")
      .$type<"ACTIVE" | "INACTIVE">()
      .notNull()
      .default("ACTIVE"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("billing_customers_code_uidx").on(table.code),
    uniqueIndex("billing_customers_business_number_uidx")
      .on(table.businessNumber)
      .where(sql`${table.businessNumber} is not null`),
    check(
      "billing_customers_code_check",
      sql`${table.code} = upper(btrim(${table.code}))
        and ${table.code} ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'`,
    ),
    check(
      "billing_customers_business_number_check",
      sql`${table.businessNumber} is null
        or ${table.businessNumber} ~ '^[0-9]{3}-[0-9]{2}-[0-9]{5}$'`,
    ),
    check(
      "billing_customers_status_check",
      sql`${table.status} in ('ACTIVE', 'INACTIVE')`,
    ),
  ],
);

export const billingCustomerContacts = pgTable(
  "billing_customer_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => billingCustomers.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    receivesBilling: boolean("receives_billing").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("billing_customer_contacts_customer_idx").on(table.customerId),
    check(
      "billing_customer_contacts_email_check",
      sql`${table.email} = lower(btrim(${table.email}))
        and char_length(${table.email}) between 3 and 254`,
    ),
  ],
);

export const billingSites = pgTable(
  "billing_sites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => billingCustomers.id, { onDelete: "restrict" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    primaryOrigin: text("primary_origin").notNull(),
    status: text("status")
      .$type<"ACTIVE" | "INACTIVE">()
      .notNull()
      .default("ACTIVE"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("billing_sites_code_uidx").on(table.code),
    uniqueIndex("billing_sites_origin_uidx").on(table.primaryOrigin),
    index("billing_sites_customer_idx").on(table.customerId),
    check(
      "billing_sites_code_check",
      sql`${table.code} = upper(btrim(${table.code}))
        and ${table.code} ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'`,
    ),
    check(
      "billing_sites_status_check",
      sql`${table.status} in ('ACTIVE', 'INACTIVE')`,
    ),
    check(
      "billing_sites_origin_check",
      sql`${table.primaryOrigin} ~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?$'`,
    ),
  ],
);

export const billingProducts = pgTable(
  "billing_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    status: text("status")
      .$type<"ACTIVE" | "INACTIVE">()
      .notNull()
      .default("ACTIVE"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("billing_products_code_uidx").on(table.code),
    check(
      "billing_products_code_check",
      sql`${table.code} = upper(btrim(${table.code}))
        and ${table.code} ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'`,
    ),
    check(
      "billing_products_status_check",
      sql`${table.status} in ('ACTIVE', 'INACTIVE')`,
    ),
  ],
);

export const billingContracts = pgTable(
  "billing_contracts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => billingCustomers.id, { onDelete: "restrict" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => billingSites.id, { onDelete: "restrict" }),
    status: text("status")
      .$type<ContractStatus>()
      .notNull()
      .default("DRAFT"),
    cycle: text("cycle").$type<BillingCycle>().notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    billingAnchorDay: integer("billing_anchor_day").notNull(),
    nextInvoiceDate: date("next_invoice_date"),
    dueDays: integer("due_days").notNull().default(0),
    autoRenew: boolean("auto_renew").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("billing_contracts_customer_idx").on(table.customerId),
    index("billing_contracts_site_idx").on(table.siteId),
    index("billing_contracts_due_idx")
      .on(table.nextInvoiceDate)
      .where(sql`${table.status} = 'ACTIVE'`),
    check(
      "billing_contracts_status_check",
      sql`${table.status} in ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ENDED', 'CANCELED')`,
    ),
    check(
      "billing_contracts_cycle_check",
      sql`${table.cycle} in ('MONTHLY', 'ANNUAL', 'ONE_TIME', 'MANUAL')`,
    ),
    check(
      "billing_contracts_anchor_check",
      sql`${table.billingAnchorDay} between 1 and 31`,
    ),
    check(
      "billing_contracts_due_days_check",
      sql`${table.dueDays} between 0 and 365`,
    ),
    check(
      "billing_contracts_date_range_check",
      sql`${table.endDate} is null or ${table.endDate} >= ${table.startDate}`,
    ),
  ],
);

export const billingContractItems = pgTable(
  "billing_contract_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => billingContracts.id, { onDelete: "restrict" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => billingProducts.id, { onDelete: "restrict" }),
    description: text("description").notNull().default(""),
    quantity: integer("quantity").notNull(),
    unitSupplyAmount: integer("unit_supply_amount").notNull(),
    supplyAmount: integer("supply_amount").notNull(),
    vatAmount: integer("vat_amount").notNull(),
    totalAmount: integer("total_amount").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("billing_contract_items_contract_idx").on(table.contractId),
    check("billing_contract_items_quantity_check", sql`${table.quantity} > 0`),
    check(
      "billing_contract_items_amount_check",
      sql`${table.unitSupplyAmount} >= 0
        and ${table.supplyAmount} = ${table.quantity} * ${table.unitSupplyAmount}
        and ${table.vatAmount} >= 0
        and ${table.totalAmount} = ${table.supplyAmount} + ${table.vatAmount}`,
    ),
    check(
      "billing_contract_items_sort_order_check",
      sql`${table.sortOrder} >= 0`,
    ),
  ],
);

export const billingRuns = pgTable(
  "billing_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runDate: date("run_date").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    targetCount: integer("target_count").notNull().default(0),
    createdCount: integer("created_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    errorSummary: jsonb("error_summary")
      .$type<Array<{ contractId: string; code: string }>>()
      .notNull()
      .default([]),
    ...timestamps,
  },
  (table) => [
    index("billing_runs_run_date_idx").on(table.runDate),
    check(
      "billing_runs_counts_check",
      sql`${table.targetCount} >= 0
        and ${table.createdCount} >= 0
        and ${table.failedCount} >= 0`,
    ),
    check(
      "billing_runs_error_summary_array_check",
      sql`jsonb_typeof(${table.errorSummary}) = 'array'`,
    ),
  ],
);

export const billingInvoices = pgTable(
  "billing_invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => billingCustomers.id, { onDelete: "restrict" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => billingSites.id, { onDelete: "restrict" }),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => billingContracts.id, { onDelete: "restrict" }),
    generationKey: text("generation_key").notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    currency: text("currency").notNull().default("KRW"),
    supplyAmount: integer("supply_amount").notNull(),
    vatAmount: integer("vat_amount").notNull(),
    totalAmount: integer("total_amount").notNull(),
    status: text("status")
      .$type<InvoiceStatus>()
      .notNull()
      .default("DRAFT"),
    approvedBy: uuid("approved_by").references(() => adminUsers.id, {
      onDelete: "restrict",
    }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    voidedBy: uuid("voided_by").references(() => adminUsers.id, {
      onDelete: "restrict",
    }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidReason: text("void_reason"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("billing_invoices_number_uidx").on(table.number),
    uniqueIndex("billing_invoices_generation_key_uidx").on(
      table.generationKey,
    ),
    index("billing_invoices_customer_idx").on(
      table.customerId,
      table.createdAt,
    ),
    index("billing_invoices_site_idx").on(table.siteId, table.createdAt),
    index("billing_invoices_status_due_idx").on(table.status, table.dueDate),
    check(
      "billing_invoices_number_check",
      sql`${table.number} ~ '^KPB-[0-9]{6}-[0-9A-HJKMNP-TV-Z]{10}$'`,
    ),
    check(
      "billing_invoices_currency_check",
      sql`${table.currency} = 'KRW'`,
    ),
    check(
      "billing_invoices_amount_check",
      sql`${table.supplyAmount} >= 0
        and ${table.vatAmount} >= 0
        and ${table.totalAmount} = ${table.supplyAmount} + ${table.vatAmount}`,
    ),
    check(
      "billing_invoices_status_check",
      sql`${table.status} in ('DRAFT', 'OPEN', 'PAID', 'OVERDUE', 'PARTIALLY_REFUNDED', 'REFUNDED', 'VOID')`,
    ),
    check(
      "billing_invoices_period_check",
      sql`${table.periodEnd} >= ${table.periodStart}`,
    ),
    check(
      "billing_invoices_due_date_check",
      sql`${table.dueDate} >= ${table.issueDate}`,
    ),
    check(
      "billing_invoices_approval_check",
      sql`(
          ${table.status} = 'DRAFT'
          and ${table.approvedBy} is null
          and ${table.approvedAt} is null
        ) or ${table.status} = 'VOID'
        or (
          ${table.status} in ('OPEN', 'PAID', 'OVERDUE', 'PARTIALLY_REFUNDED', 'REFUNDED')
          and ${table.approvedBy} is not null
          and ${table.approvedAt} is not null
        )`,
    ),
    check(
      "billing_invoices_void_check",
      sql`(
          ${table.status} = 'VOID'
          and ${table.voidedBy} is not null
          and ${table.voidedAt} is not null
          and char_length(btrim(${table.voidReason})) between 5 and 500
        ) or (
          ${table.status} <> 'VOID'
          and ${table.voidedBy} is null
          and ${table.voidedAt} is null
          and ${table.voidReason} is null
        )`,
    ),
  ],
);

export const billingInvoiceItems = pgTable(
  "billing_invoice_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => billingInvoices.id, { onDelete: "restrict" }),
    productCode: text("product_code").notNull(),
    productName: text("product_name").notNull(),
    description: text("description").notNull().default(""),
    quantity: integer("quantity").notNull(),
    unitSupplyAmount: integer("unit_supply_amount").notNull(),
    supplyAmount: integer("supply_amount").notNull(),
    vatAmount: integer("vat_amount").notNull(),
    totalAmount: integer("total_amount").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("billing_invoice_items_invoice_idx").on(table.invoiceId),
    check("billing_invoice_items_quantity_check", sql`${table.quantity} > 0`),
    check(
      "billing_invoice_items_amount_check",
      sql`${table.unitSupplyAmount} >= 0
        and ${table.supplyAmount} = ${table.quantity} * ${table.unitSupplyAmount}
        and ${table.vatAmount} >= 0
        and ${table.totalAmount} = ${table.supplyAmount} + ${table.vatAmount}`,
    ),
    check(
      "billing_invoice_items_sort_order_check",
      sql`${table.sortOrder} >= 0`,
    ),
  ],
);

export const billingInvoiceDeliveries = pgTable(
  "billing_invoice_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => billingInvoices.id, { onDelete: "restrict" }),
    recipient: text("recipient").notNull(),
    channel: text("channel").$type<"EMAIL">().notNull().default("EMAIL"),
    status: text("status")
      .$type<"PENDING" | "SENT" | "FAILED">()
      .notNull()
      .default("PENDING"),
    attemptCount: integer("attempt_count").notNull().default(0),
    externalId: text("external_id"),
    errorCode: text("error_code"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("billing_invoice_deliveries_invoice_idx").on(table.invoiceId),
    index("billing_invoice_deliveries_retry_idx")
      .on(table.nextRetryAt)
      .where(sql`${table.status} in ('PENDING', 'FAILED')`),
    check(
      "billing_invoice_deliveries_recipient_check",
      sql`${table.recipient} = lower(btrim(${table.recipient}))
        and char_length(${table.recipient}) between 3 and 254`,
    ),
    check(
      "billing_invoice_deliveries_channel_check",
      sql`${table.channel} = 'EMAIL'`,
    ),
    check(
      "billing_invoice_deliveries_status_check",
      sql`${table.status} in ('PENDING', 'SENT', 'FAILED')`,
    ),
    check(
      "billing_invoice_deliveries_attempt_count_check",
      sql`${table.attemptCount} >= 0`,
    ),
  ],
);

export const billingAdminRoles = pgTable(
  "billing_admin_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "restrict" }),
    role: text("role").$type<BillingPermission>().notNull(),
    grantedBy: uuid("granted_by")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "restrict" }),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("billing_admin_roles_admin_role_uidx").on(
      table.adminId,
      table.role,
    ),
    index("billing_admin_roles_admin_idx").on(table.adminId),
    check(
      "billing_admin_roles_role_check",
      sql`${table.role} in ('BILLING_VIEW', 'BILLING_EDIT', 'BILLING_APPROVE', 'BILLING_REFUND', 'BILLING_ADMIN')`,
    ),
  ],
);

export type BillingCustomerRow = typeof billingCustomers.$inferSelect;
export type BillingContractRow = typeof billingContracts.$inferSelect;
export type BillingInvoiceRow = typeof billingInvoices.$inferSelect;
export type BillingInvoiceItemRow = typeof billingInvoiceItems.$inferSelect;
