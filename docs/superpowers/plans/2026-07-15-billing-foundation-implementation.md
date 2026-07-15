# KPOPSOFT Billing Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the customer, site, product, contract, invoice, administrator permission, automatic draft generation, approval, and invoice-email foundation for KPOPSOFT Billing Hub.

**Architecture:** Extend the existing Neon/Drizzle schema with additive `billing_*` tables. Keep all business transitions in `src/lib/billing`, expose mutations only through re-authorized admin Server Actions or protected internal Route Handlers, and use atomic SQL statements plus unique constraints for concurrency safety. Automatic billing creates private drafts; only an authorized approval transition makes an invoice customer-visible.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript 5, Neon PostgreSQL, Drizzle ORM 0.45.2, Auth.js 5 beta, Zod 4.4.3, Cloudflare Email, Node test runner.

## Global Constraints

- Work only on `codex/kpopsoft-maxonomy-concept-wind` and preserve unrelated user changes.
- Before changing Next.js Proxy, Route Handlers, Server Actions, cookies, forms, or caching, read the matching installed guide under `node_modules/next/dist/docs/` as required by `AGENTS.md`.
- Treat `docs/superpowers/specs/2026-07-15-kpopsoft-billing-hub-design.md` as the product source of truth.
- Use migration `database/migrations/0002_billing_foundation.sql`; never edit the already-applied `0001_vercel_admin_platform.sql`.
- Use KRW integers throughout. Never use JavaScript floating-point arithmetic for stored monetary totals.
- `DRAFT` invoices are private and cannot be paid. Only `OPEN` and `OVERDUE` invoices are payable.
- Do not implement partial payments, automatic card billing, tax-invoice issuance, split settlement, or automatic customer-site suspension.
- Also keep SMS/Kakao notifications, course/schedule/student management, maintenance work logs, contract e-signature/file storage, multi-contract invoice consolidation, prepaid credit balances, and app-specific OTP/MFA outside this implementation.
- Do not seed billing authority for every active administrator. Seed only addresses explicitly supplied through `BILLING_ADMIN_SEED_EMAILS`.
- Every admin read requires `BILLING_VIEW`; every mutation re-runs `requireBillingPermission` before touching the data source.
- Audit approval, void, role, and contract-state mutations without storing customer contact details or secrets in metadata.
- Email failure never rolls back an approved invoice. It becomes a retryable `billing_invoice_deliveries` record.
- Keep feature code fail-closed when `BILLING_ENABLED` or required configuration is absent.
- Each task follows red-green-refactor TDD and ends with its own commit.

## Dependency Order

1. Execute this plan first.
2. Execute Tasks 1–5 of `2026-07-15-billing-widget-rollout-implementation.md` to establish customer payment-session authorization.
3. Execute `2026-07-15-billing-payments-implementation.md` after the widget access checkpoint passes.
4. Resume Tasks 6–10 of the widget/rollout plan after the payments completion gate passes.

## File Structure

### New files

- `database/migrations/0002_billing_foundation.sql` — additive billing schema and constraints.
- `src/lib/billing/types.ts` — domain enums and public service types.
- `src/lib/billing/money.ts` — integer amount validation and total calculation.
- `src/lib/billing/dates.ts` — Asia/Seoul billing dates and month-end correction.
- `src/lib/billing/transitions.ts` — contract and invoice state allowlists.
- `src/lib/billing/runtime.ts` — billing feature and cron-secret configuration.
- `src/lib/billing/permissions.ts` — billing RBAC and recent-auth enforcement seam.
- `src/lib/billing/repository.ts` — customer, contract, invoice, and queue reads.
- `src/lib/billing/contracts.ts` — customer/site/product/contract commands.
- `src/lib/billing/invoice-generator.ts` — idempotent draft generation.
- `src/lib/billing/invoices.ts` — draft edit, approval, void, and delivery orchestration.
- `src/lib/billing/invoice-email.ts` — safe customer invoice email payload.
- `src/app/api/internal/billing/generate/route.ts` — protected daily generator endpoint.
- `src/app/admin/(shell)/billing/page.tsx` — billing operations dashboard.
- `src/app/admin/(shell)/billing/customers/page.tsx` — customer list.
- `src/app/admin/(shell)/billing/customers/new/page.tsx` — customer/site create form.
- `src/app/admin/(shell)/billing/customers/[id]/page.tsx` — customer/site detail.
- `src/app/admin/(shell)/billing/contracts/page.tsx` — contract list.
- `src/app/admin/(shell)/billing/contracts/[id]/page.tsx` — contract editor.
- `src/app/admin/(shell)/billing/invoices/page.tsx` — invoice queue.
- `src/app/admin/(shell)/billing/invoices/[id]/page.tsx` — invoice review.
- `src/app/admin/(shell)/billing/actions.ts` — secured billing Server Actions.
- `src/components/admin/billing/customer-form.tsx` — customer/site form.
- `src/components/admin/billing/contract-form.tsx` — contract and item form.
- `src/components/admin/billing/invoice-review-form.tsx` — approve/void controls.
- `tests/billing-domain.test.mts` — money, date, and state rules.
- `tests/billing-schema.test.mts` — Drizzle table and column contract.
- `tests/billing-migration-contract.test.mts` — SQL constraints and indexes.
- `tests/billing-permissions.test.mts` — role hierarchy and fail-closed guards.
- `tests/billing-generator.test.mts` — due-contract and idempotency rules.
- `tests/billing-invoices.test.mts` — approval, void, and delivery semantics.
- `tests/billing-admin-policy.test.mts` — admin action guard contract.
- `tests/billing-cron-route.test.mts` — cron authentication and no-store contract.

### Modified files

- `src/lib/db/schema.ts` — export all foundation tables and inferred row types.
- `src/lib/admin/auth.ts` — expose login timestamp needed for high-risk reauthentication.
- `src/auth.ts` — persist `authTime` in the admin JWT/session.
- `src/types/next-auth.d.ts` — type `adminId` and `authTime` session/JWT fields.
- `src/components/admin/admin-nav.ts` — add Billing navigation group.
- `tests/db-schema.test.mts` — retain the existing platform-table contract.
- `tests/helpers/admin-action-policy.mts` — recognize billing mutation boundaries.
- `tests/admin-actions-auth.test.mts` — accept permission-specific billing guards while preserving the existing admin guard policy.
- `scripts/seed-neon.mts` — optional explicit billing-role seed.
- `vercel.json` — add the once-daily draft-generation schedule.
- `docs/개발상태.md` — record foundation runtime, flags, checks, and HOLD items.

---

### Task 1: Add pure billing types, money rules, dates, and transitions

**Files:**
- Create: `src/lib/billing/types.ts`
- Create: `src/lib/billing/money.ts`
- Create: `src/lib/billing/dates.ts`
- Create: `src/lib/billing/transitions.ts`
- Create: `tests/billing-domain.test.mts`

**Interfaces:**

```ts
export type ContractStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "ENDED" | "CANCELED";
export type BillingCycle = "MONTHLY" | "ANNUAL" | "ONE_TIME" | "MANUAL";
export type InvoiceStatus = "DRAFT" | "OPEN" | "PAID" | "OVERDUE" | "PARTIALLY_REFUNDED" | "REFUNDED" | "VOID";
export type BillingPermission = "BILLING_VIEW" | "BILLING_EDIT" | "BILLING_APPROVE" | "BILLING_REFUND" | "BILLING_ADMIN";
export type InvoiceTotals = { supplyAmount: number; vatAmount: number; totalAmount: number };

export function calculateInvoiceTotals(items: readonly InvoiceMoneyInput[]): InvoiceTotals;
export function nextInvoiceDate(input: NextInvoiceDateInput): string | null;
export function canTransitionInvoice(from: InvoiceStatus, to: InvoiceStatus): boolean;
```

- [ ] **Step 1: Write the failing domain test**

Cover these exact cases in `tests/billing-domain.test.mts`:

```ts
test("invoice totals accept only safe non-negative KRW integers", () => {
  assert.deepEqual(calculateInvoiceTotals([
    { quantity: 2, unitSupplyAmount: 100_000, vatAmount: 20_000 },
  ]), { supplyAmount: 200_000, vatAmount: 20_000, totalAmount: 220_000 });
  assert.throws(() => calculateInvoiceTotals([
    { quantity: 1.5, unitSupplyAmount: 100, vatAmount: 10 },
  ]), /KRW integer/);
});

test("monthly billing corrects missing month days in Asia\/Seoul", () => {
  assert.equal(nextInvoiceDate({ cycle: "MONTHLY", current: "2026-01-31", endDate: null }), "2026-02-28");
  assert.equal(nextInvoiceDate({ cycle: "MONTHLY", current: "2028-01-31", endDate: null }), "2028-02-29");
});

test("a next date beyond the contract end is not generated", () => {
  assert.equal(nextInvoiceDate({ cycle: "ANNUAL", current: "2026-08-16", endDate: "2027-01-31" }), null);
});

test("drafts cannot become paid without opening", () => {
  assert.equal(canTransitionInvoice("DRAFT", "OPEN"), true);
  assert.equal(canTransitionInvoice("DRAFT", "PAID"), false);
  assert.equal(canTransitionInvoice("PAID", "VOID"), false);
});
```

- [ ] **Step 2: Run the focused test and verify red**

Run:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-domain.test.mts
```

Expected: FAIL because the billing domain modules do not exist.

- [ ] **Step 3: Implement pure rules**

Use calendar-date strings (`YYYY-MM-DD`) at the domain boundary, validate with Zod, and construct dates with `Temporal` only if it is already available; otherwise use explicit UTC calendar helpers without relying on the process timezone. Preserve `billingAnchorDay` when advancing from a month-end-corrected date, so January 31 advances to February 28 and then March 31 rather than March 28. Annual cycles keep the start-date month and the same anchor-day correction rule.

Use this exact transition map:

```ts
export const INVOICE_TRANSITIONS: Readonly<Record<InvoiceStatus, readonly InvoiceStatus[]>> = {
  DRAFT: ["OPEN", "VOID"],
  OPEN: ["PAID", "OVERDUE", "VOID"],
  OVERDUE: ["PAID", "VOID"],
  PAID: ["PARTIALLY_REFUNDED", "REFUNDED"],
  PARTIALLY_REFUNDED: ["REFUNDED"],
  REFUNDED: [],
  VOID: [],
};
```

- [ ] **Step 4: Run focused and baseline tests**

Run:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-domain.test.mts
npm test
```

Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/billing/types.ts src/lib/billing/money.ts src/lib/billing/dates.ts src/lib/billing/transitions.ts tests/billing-domain.test.mts
git commit -m "feat: add billing domain rules"
```

---

### Task 2: Add the complete foundation schema and migration

**Files:**
- Create: `database/migrations/0002_billing_foundation.sql`
- Modify: `src/lib/db/schema.ts`
- Create: `tests/billing-schema.test.mts`
- Create: `tests/billing-migration-contract.test.mts`

**Required SQL manifest:**

| Table | Required business columns |
|---|---|
| `billing_customers` | `code`, `name`, `business_number`, `representative_name`, `tax_email`, `status` |
| `billing_customer_contacts` | `customer_id`, `name`, `email`, `phone`, `receives_billing` |
| `billing_sites` | `customer_id`, `code`, `name`, `primary_origin`, `status` |
| `billing_products` | `code`, `name`, `status` |
| `billing_contracts` | `customer_id`, `site_id`, `status`, `cycle`, `start_date`, `end_date`, `billing_anchor_day`, `next_invoice_date`, `due_days`, `auto_renew` |
| `billing_contract_items` | `contract_id`, `product_id`, `description`, `quantity`, `unit_supply_amount`, `supply_amount`, `vat_amount`, `total_amount`, `sort_order` |
| `billing_runs` | `run_date`, `started_at`, `finished_at`, `target_count`, `created_count`, `failed_count`, `error_summary` |
| `billing_invoices` | `number`, `customer_id`, `site_id`, `contract_id`, `generation_key`, `period_start`, `period_end`, `issue_date`, `due_date`, `currency`, totals, `status`, approval and void fields |
| `billing_invoice_items` | `invoice_id`, `product_code`, `product_name`, `description`, `quantity`, `unit_supply_amount`, totals, `sort_order` |
| `billing_invoice_deliveries` | `invoice_id`, `recipient`, `channel`, `status`, `attempt_count`, `external_id`, `error_code`, `sent_at`, `next_retry_at` |
| `billing_admin_roles` | `admin_id`, `role`, `granted_by`, `granted_at` |

Every table receives UUID `id`, `created_at`, and `updated_at`, except append/run tables may omit `updated_at` only when the Drizzle schema and SQL agree. Use `date` columns for calendar dates and `integer` for KRW and quantity. Enforce:

```sql
unique (code)                           -- customers, sites, products
unique (generation_key)                 -- invoices
unique (admin_id, role)                 -- roles
check (currency = 'KRW')
check (due_days >= 0 and due_days <= 365)
check (billing_anchor_day >= 1 and billing_anchor_day <= 31)
check (quantity > 0)
check (supply_amount >= 0 and vat_amount >= 0 and total_amount = supply_amount + vat_amount)
check (status in (...exact domain values...))
check (role in ('BILLING_VIEW','BILLING_EDIT','BILLING_APPROVE','BILLING_REFUND','BILLING_ADMIN'))
```

`billing_sites.primary_origin` must be unique and normalized as exact `https://host[:port]` with no wildcard or path. Add indexes for active contract due scans, customer/site invoice lists, invoice status/due date, and pending delivery retries.

- [ ] **Step 1: Write failing schema and migration contract tests**

The schema test must import every table and assert the exact table-name list. The migration test must read `0002_billing_foundation.sql` and match all 11 table declarations, the `generation_key` unique index, amount checks, role check, foreign keys, due-scan index, and `set_updated_at` triggers.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-schema.test.mts tests/billing-migration-contract.test.mts
```

Expected: FAIL because migration and exports are absent.

- [ ] **Step 3: Implement the additive Drizzle schema and SQL**

Append the billing exports to `src/lib/db/schema.ts`; do not reorder or rename current exports. Use `$type<...>()` for domain strings and export these inferred row types:

```ts
export type BillingCustomerRow = typeof billingCustomers.$inferSelect;
export type BillingContractRow = typeof billingContracts.$inferSelect;
export type BillingInvoiceRow = typeof billingInvoices.$inferSelect;
export type BillingInvoiceItemRow = typeof billingInvoiceItems.$inferSelect;
```

Migration `0002` must be idempotent under the existing migration runner. Use `create table if not exists`, named indexes, and `drop trigger if exists` before each trigger creation.

- [ ] **Step 4: Run focused tests and typecheck**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-schema.test.mts tests/billing-migration-contract.test.mts tests/db-schema.test.mts tests/neon-migration-contract.test.mts
npx tsc --noEmit
```

Expected: PASS and no TypeScript diagnostics.

- [ ] **Step 5: Commit**

```bash
git add database/migrations/0002_billing_foundation.sql src/lib/db/schema.ts tests/billing-schema.test.mts tests/billing-migration-contract.test.mts
git commit -m "feat: add billing foundation schema"
```

---

### Task 3: Add fail-closed billing runtime and RBAC

**Files:**
- Create: `src/lib/billing/runtime.ts`
- Create: `src/lib/billing/permissions.ts`
- Modify: `src/lib/admin/auth.ts`
- Modify: `src/auth.ts`
- Modify: `src/types/next-auth.d.ts`
- Modify: `scripts/seed-neon.mts`
- Create: `tests/billing-permissions.test.mts`

**Interfaces:**

```ts
export function isBillingEnabled(env?: NodeJS.ProcessEnv): boolean;
export function requireCronSecret(request: Request, env?: NodeJS.ProcessEnv): void;
export async function requireBillingPermission(permission: BillingPermission): Promise<BillingAdminIdentity>;
export async function requireRecentBillingAuth(permission: "BILLING_APPROVE" | "BILLING_REFUND" | "BILLING_ADMIN", maxAgeSeconds?: number): Promise<BillingAdminIdentity>;
export function hasBillingPermission(granted: readonly BillingPermission[], required: BillingPermission): boolean;
```

Use this authority expansion only:

```ts
const IMPLIED: Record<BillingPermission, readonly BillingPermission[]> = {
  BILLING_VIEW: ["BILLING_VIEW"],
  BILLING_EDIT: ["BILLING_VIEW", "BILLING_EDIT"],
  BILLING_APPROVE: ["BILLING_VIEW", "BILLING_APPROVE"],
  BILLING_REFUND: ["BILLING_VIEW", "BILLING_REFUND"],
  BILLING_ADMIN: ["BILLING_VIEW", "BILLING_EDIT", "BILLING_APPROVE", "BILLING_REFUND", "BILLING_ADMIN"],
};
```

- [ ] **Step 1: Write failing permission tests**

Test disabled billing, no role, inactive admin, exact role, admin implication, 15-minute recent-auth boundary, wrong cron secret, and absent cron secret. The production path must throw `Forbidden` or `Billing is not configured`; it must never return a development identity unless the existing non-production bypass is explicitly enabled.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-permissions.test.mts
```

Expected: FAIL because runtime and permission modules do not exist.

- [ ] **Step 3: Persist the authentication time**

Set `token.authTime = Math.floor(Date.now() / 1000)` only when a Google account signs in. Copy it to `session.user.authTime`. Do not refresh it on an ordinary JWT callback. `requireRecentBillingAuth` compares the persisted time to server time and redirects browser flows to `/admin/login?reason=reauth&returnTo=...`; Server Actions may return a typed `reauth_required` state.

- [ ] **Step 4: Add role lookup and explicit seed**

Normalize `BILLING_ADMIN_SEED_EMAILS`, resolve only active `admin_users`, and upsert only `BILLING_ADMIN` for those explicit addresses. Missing input means no billing-role seed, not all admins.

- [ ] **Step 5: Run focused, auth, and type tests**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-permissions.test.mts tests/admin-auth-policy.test.mts tests/admin-users.test.mts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/billing/runtime.ts src/lib/billing/permissions.ts src/lib/admin/auth.ts src/auth.ts src/types/next-auth.d.ts scripts/seed-neon.mts tests/billing-permissions.test.mts
git commit -m "feat: enforce billing permissions"
```

---

### Task 4: Add customer, site, product, and contract commands

**Files:**
- Create: `src/lib/billing/repository.ts`
- Create: `src/lib/billing/contracts.ts`
- Create: `tests/billing-contracts.test.mts`

**Interfaces:**

```ts
export const customerInputSchema: z.ZodType<CustomerInput>;
export const contractInputSchema: z.ZodType<ContractInput>;
export async function createCustomerWithSite(actorId: string, input: CustomerWithSiteInput): Promise<string>;
export async function saveContract(actorId: string, input: ContractInput): Promise<string>;
export async function changeContractStatus(actorId: string, id: string, status: ContractStatus): Promise<void>;
export async function listBillingCustomers(filter: CustomerFilter): Promise<BillingCustomerSummary[]>;
export async function getBillingContract(id: string): Promise<BillingContractDetail | null>;
```

- [ ] **Step 1: Write failing command tests**

Use pure validators and injected repository seams to cover normalized customer codes, Korean business-number format, exact HTTPS origin, unique product/contract items, server-recalculated totals, `ACTIVE` requiring at least one item and a next invoice date, and `ENDED`/`CANCELED` blocking future dates.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-contracts.test.mts
```

- [ ] **Step 3: Implement services with atomic writes**

Use one SQL CTE or `db.batch` per logical mutation so the business row and `audit_logs` entry succeed together. Accepted public error messages are limited to validation conflicts and not-found states; database details stay server-side.

Audit actions:

```text
billing.customer.created
billing.site.created
billing.contract.created
billing.contract.updated
billing.contract.activated
billing.contract.suspended
billing.contract.ended
billing.contract.canceled
```

- [ ] **Step 4: Run focused and baseline tests**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-contracts.test.mts
npm test
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/billing/repository.ts src/lib/billing/contracts.ts tests/billing-contracts.test.mts
git commit -m "feat: add billing contract services"
```

---

### Task 5: Generate idempotent private invoice drafts

**Files:**
- Create: `src/lib/billing/invoice-generator.ts`
- Create: `tests/billing-generator.test.mts`

**Interfaces:**

```ts
export type GenerateDueInvoicesResult = {
  runId: string;
  targetCount: number;
  createdCount: number;
  failed: Array<{ contractId: string; code: string }>;
};

export async function generateDueInvoices(runDate: string): Promise<GenerateDueInvoicesResult>;
export async function retryFailedContract(runId: string, contractId: string): Promise<void>;
export function generationKey(contractId: string, periodStart: string, periodEnd: string): string;
```

- [ ] **Step 1: Write failing generator tests**

Cover monthly, annual, one-time, manual, suspended, ended, end-date boundary, month-end correction, duplicate `generation_key`, deterministic invoice number format, exact item snapshot, failure isolation, and next-date update only when draft insertion succeeds.

Use invoice numbers with no customer data:

```text
KPB-YYYYMM-<10 uppercase Crockford base32 chars>
```

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-generator.test.mts
```

- [ ] **Step 3: Implement the atomic generation statement**

For each due contract, execute one statement that locks the contract with `FOR UPDATE`, inserts the `DRAFT` invoice using `ON CONFLICT (generation_key) DO NOTHING`, copies all items, and advances `next_invoice_date` only if the invoice was inserted. Store only sanitized error codes in `billing_runs.error_summary`.

- [ ] **Step 4: Run focused tests and migration smoke on an isolated DB**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-generator.test.mts
npm test
```

Expected: PASS. If a disposable Preview Neon branch is configured, also run `npm run db:migrate`; otherwise record that live migration smoke is `HOLD`, not PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/billing/invoice-generator.ts tests/billing-generator.test.mts
git commit -m "feat: generate billing invoice drafts"
```

---

### Task 6: Add invoice review, approval, void, and email delivery

**Files:**
- Create: `src/lib/billing/invoices.ts`
- Create: `src/lib/billing/invoice-email.ts`
- Create: `tests/billing-invoices.test.mts`
- Modify: `src/lib/integrations/cloudflare-email.ts`

**Interfaces:**

```ts
export async function updateDraftInvoice(actorId: string, invoiceId: string, input: DraftInvoiceInput): Promise<void>;
export async function approveInvoice(actorId: string, invoiceId: string): Promise<void>;
export async function voidInvoice(actorId: string, invoiceId: string, reason: string): Promise<void>;
export async function retryInvoiceDelivery(actorId: string, deliveryId: string): Promise<void>;
export function buildInvoiceEmail(input: InvoiceEmailInput): { subject: string; text: string; html: string };
```

- [ ] **Step 1: Write failing invoice tests**

Test server-side total recalculation, non-draft edit rejection, approval row locking, approval snapshot immutability, `OPEN` transition, audit insertion, customer-visible timestamp, missing recipient handling, email failure preservation, retry count, and paid invoice void rejection. Assert email contains no permanent payment link; it must direct the recipient to the customer management site.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-invoices.test.mts
```

- [ ] **Step 3: Implement approval as one atomic database boundary**

The approval statement must require `status = 'DRAFT'`, recompute item totals in SQL, update the invoice to `OPEN`, set `approved_by/approved_at`, insert `billing.invoice.approved` into `audit_logs`, and enqueue one delivery per opted-in contact. Send email after the transaction commits.

Voiding must require a trimmed reason of 5–500 characters and a `DRAFT | OPEN | OVERDUE` invoice with no completed payment.

- [ ] **Step 4: Run focused and integration tests**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-invoices.test.mts tests/cloudflare-email.test.mts
npm test
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/billing/invoices.ts src/lib/billing/invoice-email.ts src/lib/integrations/cloudflare-email.ts tests/billing-invoices.test.mts
git commit -m "feat: approve and deliver billing invoices"
```

---

### Task 7: Add the billing administrator UI and guarded actions

**Files:**
- Create: `src/app/admin/(shell)/billing/page.tsx`
- Create: `src/app/admin/(shell)/billing/customers/page.tsx`
- Create: `src/app/admin/(shell)/billing/customers/new/page.tsx`
- Create: `src/app/admin/(shell)/billing/customers/[id]/page.tsx`
- Create: `src/app/admin/(shell)/billing/contracts/page.tsx`
- Create: `src/app/admin/(shell)/billing/contracts/[id]/page.tsx`
- Create: `src/app/admin/(shell)/billing/invoices/page.tsx`
- Create: `src/app/admin/(shell)/billing/invoices/[id]/page.tsx`
- Create: `src/app/admin/(shell)/billing/actions.ts`
- Create: `src/components/admin/billing/customer-form.tsx`
- Create: `src/components/admin/billing/contract-form.tsx`
- Create: `src/components/admin/billing/invoice-review-form.tsx`
- Modify: `src/components/admin/admin-nav.ts`
- Modify: `tests/helpers/admin-action-policy.mts`
- Modify: `tests/admin-actions-auth.test.mts`
- Create: `tests/billing-admin-policy.test.mts`

- [ ] **Step 1: Read installed Next.js guides**

Read the current local documentation for Server Actions, forms, authentication/data security, caching, and dynamic route `params` before editing these files. Record the exact files read in the implementation progress note.

- [ ] **Step 2: Write the failing guard contract**

Extend `MUTATION_BOUNDARIES` with:

```ts
"createCustomerWithSite(",
"saveContract(",
"changeContractStatus(",
"updateDraftInvoice(",
"approveInvoice(",
"voidInvoice(",
"retryInvoiceDelivery(",
```

Update the shared detector to treat `await requireAdminAction()`, `await requireBillingPermission(...)`, and `await requireRecentBillingAuth(...)` as valid guard locations, using the earliest matching guard. Update `tests/admin-actions-auth.test.mts` so legacy actions still require `requireAdminAction`, while files under `/billing/` must import a billing guard. `tests/billing-admin-policy.test.mts` must recursively inspect billing actions and assert the exact required permission for each boundary, not merely the presence of any guard.

- [ ] **Step 3: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-admin-policy.test.mts tests/admin-actions-auth.test.mts
```

- [ ] **Step 4: Implement server-rendered billing pages**

Add a `결제·계약` nav group with dashboard, 고객사, 계약, and 청구서. Use URL search params for filters. Keep list and detail reads in Server Components, client components only for form interactivity, and Server Actions for mutations.

Required page behavior:

- Billing dashboard: draft approvals, overdue invoices, failed deliveries, generator failures.
- Customer list/detail: code/name/status/site/contact, without exposing business number in tables by default.
- Contract list/detail: status/cycle/next invoice date/items and activation controls.
- Invoice list/detail: status/customer/site/period/due date/totals, item snapshot, approval and void confirmation.
- Permission-denied pages return 404 or a neutral unauthorized panel; no row existence leak.

- [ ] **Step 5: Run focused tests and static validation**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-admin-policy.test.mts tests/admin-actions-auth.test.mts
npm run lint
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add 'src/app/admin/(shell)/billing' src/components/admin/billing src/components/admin/admin-nav.ts tests/helpers/admin-action-policy.mts tests/admin-actions-auth.test.mts tests/billing-admin-policy.test.mts
git commit -m "feat: add billing administration UI"
```

---

### Task 8: Add daily generation scheduling and the foundation checkpoint

**Files:**
- Create: `src/app/api/internal/billing/generate/route.ts`
- Create: `tests/billing-cron-route.test.mts`
- Modify: `vercel.json`
- Modify: `docs/개발상태.md`

**Route contract:**

```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET requires Authorization: Bearer <CRON_SECRET>.
// 200: { ok: true, runId, targetCount, createdCount, failedCount }
// 401: { ok: false, code: "unauthorized" }
// 503: { ok: false, code: "billing_disabled" }
```

- [ ] **Step 1: Write failing route contract tests**

Test missing/wrong authorization, disabled feature, successful sanitized response, error response without stack/database details, Node runtime, and `Cache-Control: no-store`.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-cron-route.test.mts
```

- [ ] **Step 3: Implement the protected route and schedule**

Use a daily schedule equivalent to 00:15 Asia/Seoul. Because Vercel schedules are UTC, document and set:

```json
{
  "crons": [
    { "path": "/api/internal/billing/generate", "schedule": "15 15 * * *" }
  ]
}
```

Merge rather than overwrite any existing `vercel.json` fields. Do not accept `CRON_SECRET` in a query parameter.

- [ ] **Step 4: Update the status document**

Record schema/migration name, flags, cron, permissions, test commands, Preview DB migration status, and explicit HOLD for production schedule until the deployment plan and runtime are confirmed.

- [ ] **Step 5: Run the full foundation gate**

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

Expected: all local commands PASS. Preview Neon migration and browser verification remain `HOLD` unless the required external environment is available and intentionally used.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/internal/billing/generate/route.ts tests/billing-cron-route.test.mts vercel.json docs/개발상태.md
git commit -m "feat: schedule billing invoice generation"
```

## Foundation Completion Gate

- [ ] A due active contract creates exactly one private `DRAFT` per contract period.
- [ ] Contract items are immutable invoice snapshots after approval.
- [ ] Only `BILLING_APPROVE` or `BILLING_ADMIN` can approve or void.
- [ ] No unapproved invoice is returned from a customer-facing service.
- [ ] Approval and audit entry are atomic; email is retryable and non-transactional.
- [ ] Existing admin, inquiry, content, auth, migration, lint, type, and build checks remain green.
- [ ] External-only checks are reported as `HOLD` with the missing dependency named.
