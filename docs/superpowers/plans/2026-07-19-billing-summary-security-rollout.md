# Billing Summary, Security, and Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Link Hub projects to Billing records, show a minimal read-only payment summary in Hub, harden public and internal integration boundaries, and complete a gated Preview-to-Production rollout record.

**Architecture:** Billing remains fully mutable only in homepage/Neon. A project link triggers a minimal aggregate summary event to Hub; Supabase stores only totals, dates, status, and an admin deep link. Security work adds Turnstile, distributed rate limits, HMAC key rotation, replay reconciliation, observability, and feature-by-feature rollout gates without enabling payment providers.

**Tech Stack:** Existing Billing Hub domain, Neon/Drizzle, Cloudflare Turnstile, Vercel runtime, Supabase, Next.js, Vitest, Node test runner, Playwright.

## Global Constraints

- Hub never approves invoices, confirms bank receipts, starts payments, or requests refunds.
- Before Task 1, invoke `superpowers:using-git-worktrees` and create homepage branch `codex/billing-summary-security-rollout` plus Hub branch `codex/hub-billing-summary` from their reviewed integration baselines.
- Contract version is exactly `2026-07-19.v1`.
- Do not transmit customer contacts, bank details, Toss identifiers, refund detail, provider payloads, or administrator permissions to Hub.
- Billing and integration feature flags remain independent.
- Public-form abuse controls fail closed only for suspicious/invalid submissions; integration outage must not erase valid persisted inquiries.
- HMAC key rotation supports current and previous verification keys during a controlled overlap.
- Production DB, DNS, bank transfer, Toss, widget, and Production cron remain HOLD until separately approved.
- Existing Billing recovery webhooks and reconciliation must remain functional when new payment entry is disabled.

---

### Task 1: Link Billing Customers and Contracts to Hub Projects

**Files (Homepage repository):**
- Create: `database/migrations/0009_billing_hub_summary.sql`
- Modify: `src/lib/db/schema.ts`
- Create: `src/lib/billing/hub-links.ts`
- Create: `tests/billing-hub-links.test.mts`
- Modify: `tests/billing-migration-contract.test.mts`

**Interfaces:**
- Produces: `linkBillingProject()`, `unlinkBillingProject()`, and table `billing_hub_project_links`.

- [ ] **Step 1: Write the failing uniqueness test**

```ts
test("one Hub project has one active Billing link", () => {
  assert.match(migration, /billing_hub_project_links_hub_project_uidx/);
  assert.match(migration, /where archived_at is null/);
});
```

- [ ] **Step 2: Run the test**

Run: `npm test -- --test-name-pattern="Hub project has one active Billing link"`

Expected: FAIL because migration `0009` is absent.

- [ ] **Step 3: Add the additive link table**

```sql
create table if not exists billing_hub_project_links (
  id uuid primary key default gen_random_uuid(),
  hub_project_id uuid not null,
  customer_id uuid not null references billing_customers(id) on delete restrict,
  contract_id uuid references billing_contracts(id) on delete restrict,
  created_by uuid not null references admin_users(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists billing_hub_project_links_hub_project_uidx
  on billing_hub_project_links(hub_project_id) where archived_at is null;
```

- [ ] **Step 4: Implement guarded link commands**

`linkBillingProject` requires `billing.contracts.manage`, validates that the
contract belongs to the selected customer, archives an old link only after the
replacement validates, and writes an audit log.

- [ ] **Step 5: Run and commit**

```bash
npm test -- --test-name-pattern="billing Hub"
git add database/migrations/0009_billing_hub_summary.sql src/lib/db/schema.ts src/lib/billing/hub-links.ts tests/billing-hub-links.test.mts tests/billing-migration-contract.test.mts
git commit -m "feat: link Billing records to Hub projects"
```

### Task 2: Build and Emit the Minimal Billing Summary

**Files (Homepage repository):**
- Create: `src/lib/billing/hub-summary.ts`
- Create: `src/lib/billing/hub-summary-events.ts`
- Create: `tests/billing-hub-summary.test.mts`

**Interfaces:**
- Produces: `BillingHubSummaryPayload`, `buildBillingHubSummary()`, and `enqueueBillingHubSummary()`.

- [ ] **Step 1: Write the failing privacy and arithmetic tests**

```ts
test("builds a minimal read-only Hub summary", async () => {
  const summary = await buildBillingHubSummary("hub-project-1", repository);
  assert.deepEqual(summary, {
    hubProjectId: "hub-project-1",
    contractStatus: "active",
    invoicedAmount: 500000,
    paidAmount: 300000,
    outstandingAmount: 200000,
    latestInvoiceDate: "2026-07-01",
    nextDueDate: "2026-08-01",
    adminUrl: "https://admin.pay.kpopsoft.com/admin/billing/customers/customer-1",
    syncedAt: "2026-07-19T05:00:00.000Z",
  });
  assert.equal("contact" in summary, false);
  assert.equal("paymentKey" in summary, false);
});
```

- [ ] **Step 2: Run the test**

Run: `npm test -- --test-name-pattern="minimal read-only Hub summary"`

Expected: FAIL because the summary builder is absent.

- [ ] **Step 3: Implement the exact payload**

```ts
export type BillingHubSummaryPayload = {
  hubProjectId: string;
  contractStatus: string | null;
  invoicedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  latestInvoiceDate: string | null;
  nextDueDate: string | null;
  adminUrl: string;
  syncedAt: string;
};
```

Use approved/non-void invoice totals and completed payment totals. Clamp
outstanding amount at zero. No query selects contacts, account fields, provider
keys, refund rows, or webhook payloads.

- [ ] **Step 4: Emit on relevant changes**

Enqueue `billing.summary.updated:<hubProjectId>:<aggregateVersion>` after
contract status, invoice approval/void, bank confirmation, Toss confirmation,
or refund completion commits. Event source is `billing`.

- [ ] **Step 5: Run and commit**

```bash
npm test -- --test-name-pattern="billing Hub summary"
git add src/lib/billing/hub-summary.ts src/lib/billing/hub-summary-events.ts tests/billing-hub-summary.test.mts
git commit -m "feat: emit minimal Billing summaries to Hub"
```

### Task 3: Add the Read-Only Billing Tab in Hub

**Files (Hub repository):**
- Create: `supabase/migrations/20260719160000_add_billing_summaries.sql`
- Modify: `src/app/api/internal/integrations/events/route.ts`
- Modify: `src/lib/data/types.ts`
- Create: `src/lib/data/billing-summary.ts`
- Create: `src/features/projects/billing-summary-panel.tsx`
- Modify: `src/app/(app)/projects/[id]/page.tsx`
- Create: `tests/unit/billing-summary-panel.test.tsx`
- Create: `tests/e2e/billing-summary.spec.ts`

**Interfaces:**
- Consumes: `billing.summary.updated`.
- Produces: service-role-updated `billing_project_summaries` and read-only `결제 요약` tab.

- [ ] **Step 1: Write the failing read-only UI test**

```tsx
it("renders Billing totals without mutation controls", () => {
  render(<BillingSummaryPanel summary={summary} />);
  expect(screen.getByText("미수금")).toBeTruthy();
  expect(screen.getByText("200,000원")).toBeTruthy();
  expect(screen.getByRole("link", { name: "어드민에서 열기" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: /승인|입금|환불|결제/ })).toBeNull();
});
```

- [ ] **Step 2: Run the test**

Run: `pnpm test -- billing-summary-panel`

Expected: FAIL because the component is missing.

- [ ] **Step 3: Add service-role-only mutation and RLS read**

The migration grants authenticated users SELECT only. The integration event
route upserts newer `synced_at` payloads and rejects negative amounts or
`paid_amount > invoiced_amount` unless outstanding is explicitly zero after a
credit adjustment.

- [ ] **Step 4: Implement the panel**

Add `{ key: "billing", label: "결제 요약", content: billingSection }`.
Render contract status, invoiced, paid, outstanding, latest invoice, next due,
last sync, and admin deep link. Show `연결되지 않음` when no summary exists.

- [ ] **Step 5: Run and commit**

```bash
pnpm test
pnpm lint
pnpm build
pnpm test:e2e -- billing-summary.spec.ts
git add supabase/migrations/20260719160000_add_billing_summaries.sql src/app/api/internal/integrations/events/route.ts src/lib/data/types.ts src/lib/data/billing-summary.ts src/features/projects/billing-summary-panel.tsx 'src/app/(app)/projects/[id]/page.tsx' tests/unit/billing-summary-panel.test.tsx tests/e2e/billing-summary.spec.ts
git commit -m "feat: show read-only Billing summary in Hub"
gh auth switch -h github.com -u h19h29-design
git push -u origin codex/hub-billing-summary
```

### Task 4: Add Turnstile and Distributed Inquiry Rate Limits

**Files (Homepage repository):**
- Create: `src/lib/inquiries/turnstile.ts`
- Create: `src/lib/inquiries/rate-limit.ts`
- Modify: `src/lib/inquiry-actions.ts`
- Create: `tests/inquiry-abuse-protection.test.mts`

**Interfaces:**
- Produces: `verifyTurnstileToken()`, `checkInquiryRateLimit()`, and sanitized rejection codes.

- [ ] **Step 1: Write failing abuse-control tests**

```ts
test("rejects a reused Turnstile token", async () => {
  const first = await verifyTurnstileToken(token, dependencies);
  const second = await verifyTurnstileToken(token, dependencies);
  assert.equal(first.ok, true);
  assert.deepEqual(second, { ok: false, code: "challenge_reused" });
});

test("rate limit key never contains the raw IP", () => {
  const key = buildInquiryRateLimitKey("203.0.113.7", "hash-secret");
  assert.doesNotMatch(key, /203\.0\.113\.7/);
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- --test-name-pattern="Turnstile|raw IP"`

Expected: FAIL because abuse-control modules are absent.

- [ ] **Step 3: Implement Turnstile verification**

POST server-side to Cloudflare siteverify with secret, response token, and
remote IP. Accept only `success=true`, expected hostname, and action
`inquiry_submit`. Store only a hash of a successful token for its short replay
window.

- [ ] **Step 4: Implement distributed rate limiting**

Use a durable Neon table keyed by HMAC-SHA256 of normalized IP and form class.
Allow five attempts per ten minutes and twenty per day; successful persistence
does not depend on notification delivery. Return generic Korean UI messages and
log only normalized codes.

- [ ] **Step 5: Run and commit**

```bash
npm test -- --test-name-pattern="inquiry"
git add src/lib/inquiries/turnstile.ts src/lib/inquiries/rate-limit.ts src/lib/inquiry-actions.ts tests/inquiry-abuse-protection.test.mts
git commit -m "feat: harden public inquiry submission"
```

### Task 5: Add Key Rotation, Reconciliation, and Safe Observability

**Files (Homepage repository):**
- Modify: `src/lib/integrations/hmac.ts`
- Create: `src/lib/integrations/reconcile.ts`
- Create: `src/lib/integrations/operations.ts`
- Create: `src/app/admin/(shell)/integrations/page.tsx`
- Modify: `src/components/admin/admin-nav.ts`
- Create: `tests/integration-key-rotation.test.mts`
- Create: `tests/integration-observability.test.mts`

**Interfaces:**
- Produces: multi-key verification, single active signing key, reconciliation report, and sanitized operations dashboard.

- [ ] **Step 1: Write failing rotation tests**

```ts
test("signs with the active key and verifies current plus previous keys", () => {
  const ring = parseKeyRing("v2:bbbb,v1:aaaa", "v2");
  assert.equal(ring.signingKey.id, "v2");
  assert.deepEqual(Object.keys(ring.verificationKeys).sort(), ["v1", "v2"]);
});

test("operations snapshot excludes payload and secrets", async () => {
  const snapshot = await getIntegrationOperationsSnapshot(repository);
  assert.equal(JSON.stringify(snapshot).includes("payload"), false);
  assert.equal(JSON.stringify(snapshot).includes("signature"), false);
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- --test-name-pattern="active key|operations snapshot"`

Expected: FAIL because the rotation and operations modules do not exist.

- [ ] **Step 3: Implement key-ring parsing**

```ts
export type HmacKeyRing = {
  signingKey: { id: string; secret: string };
  verificationKeys: Record<string, string>;
};
```

Require 32-byte decoded secrets, unique key IDs, and an active ID present in the
ring. Rotation adds the new key, switches signing, verifies both during
overlap, then removes the old key after in-flight requests expire.

- [ ] **Step 4: Implement reconciliation and dashboard**

Reconciliation compares linked entity IDs and provider update timestamps,
enqueues missing mirrors, and marks conflicts for attention without guessing.
The dashboard shows counts by status, oldest pending age, last success,
sanitized error code, and retry button guarded by `requireAdminAction()`.

- [ ] **Step 5: Run and commit**

```bash
npm test -- --test-name-pattern="integration"
npm run lint
npx tsc --noEmit
git add src/lib/integrations src/app/admin/'(shell)'/integrations/page.tsx src/components/admin/admin-nav.ts tests/integration-key-rotation.test.mts tests/integration-observability.test.mts
git commit -m "feat: harden integration operations"
```

### Task 6: Execute the Gated Rollout and Close the Plan

**Files:**
- Modify: `docs/billing/verification-report.md`
- Modify: `docs/개발상태.md`
- Create: `docs/integrations/operations-runbook.md`
- Create: `docs/integrations/verification-report.md`
- Modify: `docs/superpowers/specs/2026-07-19-kpopsoft-platform-orchestration-design.md`

**Interfaces:**
- Consumes: all five prior implementation plans and paired homepage/Hub Preview deployments.
- Produces: feature-by-feature rollout evidence, rollback commands, matched commit matrix, and explicit Production HOLD/PASS decisions.

- [ ] **Step 1: Write the rollout matrix**

The report records:

```text
feature
homepage commit SHA
Hub commit SHA
homepage deployment ID
Hub deployment ID
Neon migration versions
Supabase migration timestamps
flag before/after
smoke result
rollback owner
```

- [ ] **Step 2: Run the complete local gates**

Homepage:

```bash
npm test
npm run test:e2e:billing
npm run lint
npx tsc --noEmit
npm run build
npm audit --omit=dev
git diff --check
```

Hub:

```bash
pnpm test
pnpm lint
pnpm build
pnpm test:e2e
git diff --check
```

Expected: all mandatory tests pass; external payment scenarios remain
documented HOLD rather than silently skipped as success.

- [ ] **Step 3: Enable Preview flags one at a time**

Order:

```text
INTEGRATIONS_ENABLED
LINEAR_MIRROR_ENABLED
LINEAR_WRITE_ENABLED
DRIVE_SYNC_ENABLED
INQUIRY_CONVERSION_ENABLED
HUB_BILLING_SUMMARY_ENABLED
```

After every flag, smoke both apps and verify queue/retry counts before
continuing. Disable the just-enabled flag on failure.

- [ ] **Step 4: Verify Billing remains isolated**

Confirm:

```text
BANK_TRANSFER_ENABLED=false
TOSS_PAYMENTS_ENABLED=false
BILLING_WIDGET_ENABLED=false
Production Neon has no 0002-0009 rollout from this task
Production cron unchanged
Production DNS unchanged
```

- [ ] **Step 5: Commit and push documentation**

```bash
git add docs/billing/verification-report.md docs/개발상태.md docs/integrations/operations-runbook.md docs/integrations/verification-report.md docs/superpowers/specs/2026-07-19-kpopsoft-platform-orchestration-design.md
git commit -m "docs: record integrated platform rollout"
gh auth switch -h github.com -u kpopsoft-collab
git push -u origin codex/billing-summary-security-rollout
```

- [ ] **Step 6: Request explicit Production approval**

Do not migrate or enable Production. Present the verification report with
separate decisions for:

```text
Operations integrations
Billing database
Bank transfer
Toss
Customer widget
DNS
Production cron
```

Each item remains HOLD until the user explicitly approves that item.
