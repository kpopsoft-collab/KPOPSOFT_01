# KPOPSOFT Billing Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add exact-amount bank-transfer confirmation plus Toss Payments V2 one-time card/easy-pay approval, verified webhooks, reconciliation, and full/partial cancellation to approved Billing Hub invoices.

**Architecture:** Create payment attempts before opening Toss, preserve the invoice amount as a server snapshot, and confirm only after server-side order/amount/state validation. Treat Toss redirects and general payment webhooks as untrusted notifications: query the provider before changing internal state. Serialize all payment, bank receipt, and refund transitions around invoice/payment rows and append normalized payment events plus existing admin audit logs.

**Tech Stack:** Next.js 16.2.10 Route Handlers and Server Actions, Neon PostgreSQL, Drizzle ORM, Toss Payments REST API and V2 Payment Widget, Auth.js billing RBAC, Zod, Node test runner.

## Global Constraints

- Execute `2026-07-15-billing-foundation-implementation.md` first and require its completion gate.
- Execute Tasks 1–5 of `2026-07-15-billing-widget-rollout-implementation.md` next and require its customer-access checkpoint; this plan consumes `requirePaymentSession` and the `/pay` shell created there.
- Read the installed Next.js Route Handler, security, cookies, forms, and caching guides before implementation.
- Re-check current Toss V2 official documentation before coding; if an endpoint, header, event, or payload differs from this plan, stop and update the plan/spec before implementation.
- General Toss payment webhooks do not have a signature header. Never invent signature verification; re-query the Payment API by `paymentKey` and compare MID, key, order ID, amount, and status.
- A success redirect never marks an invoice paid by itself.
- No provider call occurs before internal permission, invoice status, amount, duplicate-payment, and input validation passes.
- Use UUID v4 `Idempotency-Key` on Toss POST requests and persist it before the request. Never generate a different key for a retry of the same logical operation.
- Treat timeouts and connection failures as unknown outcomes. Query before retrying or creating a replacement order.
- Do not store raw card numbers, CVC, expiry, customer authentication data, Toss secret keys, full provider payloads, or unsanitized provider errors.
- Only masked payment-method fields returned by Toss may be stored.
- Bank transfer uses one server-side configured KPOPSOFT account. It remains hidden when incomplete or disabled.
- Partial customer payments are out of scope. A bank receipt must exactly equal the outstanding invoice total.
- Refunds never reopen the old invoice; any amount to charge again uses a new invoice.
- Keep webhook/reconciliation endpoints active during a new-payment rollback so in-flight transactions can settle.
- Each task follows red-green-refactor TDD and ends with a separate commit.

## File Structure

### New files

- `database/migrations/0003_billing_payments.sql` — payment, bank receipt, refund, event, and webhook tables.
- `src/lib/billing/payments/types.ts` — attempt/payment/refund/provider types.
- `src/lib/billing/payments/runtime.ts` — bank and Toss fail-closed configuration.
- `src/lib/billing/payments/transitions.ts` — attempt/refund transition allowlists.
- `src/lib/billing/payments/repository.ts` — payment and operations-queue queries.
- `src/lib/billing/payments/bank.ts` — account presentation and manual confirmation.
- `src/lib/billing/payments/toss-client.ts` — isolated Toss REST adapter.
- `src/lib/billing/payments/attempts.ts` — one-time order creation and expiry.
- `src/lib/billing/payments/confirm.ts` — verified approval and payment persistence.
- `src/lib/billing/payments/provider-verification.ts` — Toss query comparison.
- `src/lib/billing/payments/webhooks.ts` — dedupe, query, and event application.
- `src/lib/billing/payments/reconcile.ts` — unresolved attempt/webhook/refund recovery.
- `src/lib/billing/payments/refunds.ts` — full/partial cancellation workflow.
- `src/app/pay/invoices/[invoiceNumber]/page.tsx` — central invoice/payment page.
- `src/app/pay/invoices/[invoiceNumber]/success/page.tsx` — Toss return bridge.
- `src/app/pay/invoices/[invoiceNumber]/fail/page.tsx` — safe failure/cancel page.
- `src/app/api/payments/toss/attempts/route.ts` — create payment attempt.
- `src/app/api/payments/toss/confirm/route.ts` — validate and confirm payment.
- `src/app/api/payments/toss/webhook/route.ts` — Toss webhook receiver.
- `src/app/api/internal/billing/reconcile/route.ts` — protected recovery job.
- `src/app/admin/(shell)/billing/payments/page.tsx` — payment operations queue.
- `src/app/admin/(shell)/billing/payments/[id]/page.tsx` — payment/refund detail.
- `src/app/admin/(shell)/billing/payment-actions.ts` — bank/refund/requery actions.
- `src/components/billing/toss-payment-button.tsx` — V2 browser checkout launcher.
- `src/components/admin/billing/bank-confirmation-form.tsx` — exact receipt confirmation.
- `src/components/admin/billing/refund-form.tsx` — high-risk refund confirmation.
- `tests/billing-payment-domain.test.mts` — transitions and amount rules.
- `tests/billing-payment-schema.test.mts` — Drizzle and SQL contract.
- `tests/billing-bank-transfer.test.mts` — account and confirmation rules.
- `tests/toss-client.test.mts` — request/response adapter contract.
- `tests/toss-confirmation.test.mts` — tampering, idempotency, ambiguity, and persistence.
- `tests/toss-webhook.test.mts` — dedupe and query verification.
- `tests/billing-reconciliation.test.mts` — recovery candidates and results.
- `tests/billing-refunds.test.mts` — full/partial cancel rules.
- `tests/billing-payment-policy.test.mts` — admin and public boundary guards.

### Modified files

- `src/lib/db/schema.ts` — export payment tables and row types.
- `src/app/admin/(shell)/billing/invoices/[id]/page.tsx` — bank/payment history and actions.
- `src/components/admin/admin-nav.ts` — add payment operations link.
- `tests/helpers/admin-action-policy.mts` — recognize payment mutation boundaries.
- `vercel.json` — add reconciliation schedule without replacing generation schedule.
- `docs/개발상태.md` — payment flags, endpoints, verification, and HOLD state.

---

### Task 1: Add payment domain types, transitions, and additive schema

**Files:**
- Create: `src/lib/billing/payments/types.ts`
- Create: `src/lib/billing/payments/transitions.ts`
- Create: `database/migrations/0003_billing_payments.sql`
- Modify: `src/lib/db/schema.ts`
- Create: `tests/billing-payment-domain.test.mts`
- Create: `tests/billing-payment-schema.test.mts`

**Types:**

```ts
export type PaymentAttemptStatus = "CREATED" | "AUTHENTICATED" | "CONFIRMING" | "DONE" | "FAILED" | "EXPIRED" | "CANCELED";
export type PaymentMethod = "BANK_TRANSFER" | "CARD" | "EASY_PAY";
export type RefundStatus = "REQUESTED" | "PROCESSING" | "DONE" | "FAILED";
export type WebhookStatus = "RECEIVED" | "PROCESSING" | "DONE" | "RETRY" | "REJECTED";
```

**Required SQL manifest:**

| Table | Required business columns |
|---|---|
| `billing_payment_attempts` | `invoice_id`, unique `order_id`, `amount`, `status`, `idempotency_key`, `expires_at`, `payment_key`, `failure_code`, `confirmed_at` |
| `billing_payments` | `invoice_id`, `attempt_id`, `method`, `amount`, `approved_at`, unique nullable `toss_payment_key`, `toss_mid`, `approval_number`, `masked_method`, `refunded_amount` |
| `billing_bank_receipts` | unique `payment_id`, `depositor_name`, `amount`, `deposited_on`, `confirmed_by`, `evidence_note`, `confirmed_at` |
| `billing_refunds` | `payment_id`, `amount`, `reason`, `status`, `idempotency_key`, `requested_by`, `processed_by`, `toss_transaction_key`, `provider_code`, `completed_at` |
| `billing_payment_events` | `payment_id`, `attempt_id`, `refund_id`, `source`, `event_type`, `from_status`, `to_status`, `correlation_id`, `occurred_at`, `metadata` |
| `billing_webhook_receipts` | unique `transmission_id`, nullable `attempt_id`, `event_type`, server-only `payment_key`, `payment_key_hash`, `order_id`, `payload_hash`, `status`, `attempt_count`, `last_error_code`, `received_at`, `processed_at` |

Add checks for positive amounts, refunded amount between zero and payment amount, valid states/methods/sources, UUID idempotency keys, and at least one entity reference on `billing_payment_events`. Add a partial unique index preventing more than one completed payment per invoice:

```sql
create unique index billing_payments_completed_invoice_uidx
  on billing_payments (invoice_id)
  where amount > 0;
```

Because every inserted `billing_payments` row is a completed payment, do not insert provisional rows there; provisional provider activity belongs in `billing_payment_attempts`.

- [ ] **Step 1: Write failing domain/schema tests**

Test exact allowed attempt transitions, exact refund transitions, all six table names, unique order/payment/transmission identifiers, amount checks, foreign keys, operational indexes, and append-only event shape.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-payment-domain.test.mts tests/billing-payment-schema.test.mts
```

- [ ] **Step 3: Implement types, Drizzle exports, and `0003`**

Use this attempt transition map:

```ts
export const PAYMENT_ATTEMPT_TRANSITIONS = {
  CREATED: ["AUTHENTICATED", "EXPIRED", "CANCELED"],
  AUTHENTICATED: ["CONFIRMING", "EXPIRED", "CANCELED"],
  CONFIRMING: ["DONE", "FAILED"],
  DONE: [],
  FAILED: [],
  EXPIRED: [],
  CANCELED: [],
} as const;
```

An ambiguous provider result remains `CONFIRMING`; only a verified provider query may move it to `DONE` or `FAILED`.

- [ ] **Step 4: Run focused tests and typecheck**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-payment-domain.test.mts tests/billing-payment-schema.test.mts tests/billing-schema.test.mts
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/billing/payments/types.ts src/lib/billing/payments/transitions.ts database/migrations/0003_billing_payments.sql src/lib/db/schema.ts tests/billing-payment-domain.test.mts tests/billing-payment-schema.test.mts
git commit -m "feat: add billing payment schema"
```

---

### Task 2: Add fail-closed bank and Toss runtime configuration

**Files:**
- Create: `src/lib/billing/payments/runtime.ts`
- Create: `tests/billing-payment-runtime.test.mts`

**Environment contract:**

```text
BANK_TRANSFER_ENABLED=true|false
BANK_ACCOUNT_BANK=<server-only display value>
BANK_ACCOUNT_NUMBER=<server-only display value>
BANK_ACCOUNT_HOLDER=<server-only display value>
TOSS_PAYMENTS_ENABLED=true|false
TOSS_PAYMENTS_CLIENT_KEY=<client_... key allowed in rendered checkout only>
TOSS_PAYMENTS_SECRET_KEY=<server only>
TOSS_PAYMENTS_MID=<server only expected merchant id>
TOSS_PAYMENTS_API_BASE=https://api.tosspayments.com
```

`TOSS_PAYMENTS_API_BASE` may be overridden only outside production for a local fake server. Reject non-HTTPS production base URLs.

- [ ] **Step 1: Write failing runtime tests**

Test disabled flags, missing individual account fields, incomplete Toss key set, secret-key leakage from public config, invalid API base, test/live key mismatch, and fully configured test mode.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-payment-runtime.test.mts
```

- [ ] **Step 3: Implement pure parsers and server-only accessors**

Export only:

```ts
export function bankTransferConfig(env?: NodeJS.ProcessEnv): BankTransferConfig | null;
export function tossServerConfig(env?: NodeJS.ProcessEnv): TossServerConfig | null;
export function tossPublicConfig(env?: NodeJS.ProcessEnv): { clientKey: string } | null;
```

Do not prefix the client key environment variable with `NEXT_PUBLIC_`; render it only from the protected payment page after checking the feature and invoice session.

- [ ] **Step 4: Test and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-payment-runtime.test.mts
npx tsc --noEmit
git add src/lib/billing/payments/runtime.ts tests/billing-payment-runtime.test.mts
git commit -m "feat: add payment runtime policy"
```

---

### Task 3: Add exact bank-transfer confirmation

**Files:**
- Create: `src/lib/billing/payments/bank.ts`
- Create: `src/components/admin/billing/bank-confirmation-form.tsx`
- Create: `tests/billing-bank-transfer.test.mts`
- Modify: `src/app/admin/(shell)/billing/actions.ts`
- Modify: `src/app/admin/(shell)/billing/invoices/[id]/page.tsx`

**Interfaces:**

```ts
export function getBankTransferInstructions(invoice: PayableInvoice): BankTransferInstructions | null;
export async function confirmBankReceipt(actorId: string, input: ConfirmBankReceiptInput): Promise<string>;
```

- [ ] **Step 1: Write failing bank tests**

Cover disabled/missing account, non-payable invoice, exact amount, shortage, overpayment, existing payment, concurrent duplicate confirmation, evidence note length, deposited date, and atomic invoice/payment/receipt/event/audit writes.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-bank-transfer.test.mts
```

- [ ] **Step 3: Implement one atomic confirmation statement**

Lock the invoice, require `OPEN | OVERDUE`, require no completed payment, require input amount equal to invoice total, insert a `BANK_TRANSFER` payment and receipt, set invoice `PAID`, append `payment.completed`, and audit `billing.bank_receipt.confirmed`. Return a neutral conflict when another confirmation wins.

The form requires a final screen showing customer, invoice number, expected amount, input amount, deposited date, depositor, and evidence note. Guard with `requireRecentBillingAuth("BILLING_APPROVE")`.

- [ ] **Step 4: Test and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-bank-transfer.test.mts tests/billing-admin-policy.test.mts
npm run lint
npx tsc --noEmit
git add src/lib/billing/payments/bank.ts src/components/admin/billing/bank-confirmation-form.tsx 'src/app/admin/(shell)/billing/actions.ts' 'src/app/admin/(shell)/billing/invoices/[id]/page.tsx' tests/billing-bank-transfer.test.mts
git commit -m "feat: confirm billing bank receipts"
```

---

### Task 4: Add the isolated Toss REST adapter

**Files:**
- Create: `src/lib/billing/payments/toss-client.ts`
- Create: `src/lib/billing/payments/provider-verification.ts`
- Create: `tests/toss-client.test.mts`

**Interfaces:**

```ts
export interface TossClient {
  confirm(input: { paymentKey: string; orderId: string; amount: number; idempotencyKey: string }): Promise<TossPayment>;
  getPayment(paymentKey: string): Promise<TossPayment>;
  cancel(input: { paymentKey: string; cancelAmount: number; cancelReason: string; idempotencyKey: string }): Promise<TossPayment>;
}

export function createTossClient(config: TossServerConfig, fetchImpl?: typeof fetch): TossClient;
export function verifyTossPayment(expected: ExpectedTossPayment, actual: TossPayment): VerifiedTossPayment;
```

- [ ] **Step 1: Re-read official Toss references**

Verify the current endpoints and payloads for confirm, payment lookup, cancel, V2 window, idempotency, and webhooks. Record reference URLs and access date in `docs/개발상태.md`. If the live contract differs, update this plan first.

- [ ] **Step 2: Write failing adapter tests with an injected fake fetch**

Assert Basic authorization is constructed only inside the adapter, `Content-Type: application/json`, exact `Idempotency-Key`, confirm and cancel bodies, URL encoding, 10-second abort, success mapping, safe error mapping, retryable classification, and no secret/raw body in thrown errors.

- [ ] **Step 3: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/toss-client.test.mts
```

- [ ] **Step 4: Implement the adapter and strict Zod response parsing**

Return only the provider fields needed by the domain: `mId`, `paymentKey`, `orderId`, `status`, `totalAmount`, `balanceAmount`, `method`, approval timestamp/number, masked card/easy-pay data, and cancel entries. Hash payment keys before structured logging.

- [ ] **Step 5: Test and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/toss-client.test.mts
npx tsc --noEmit
git add src/lib/billing/payments/toss-client.ts src/lib/billing/payments/provider-verification.ts tests/toss-client.test.mts docs/개발상태.md
git commit -m "feat: add verified Toss client"
```

---

### Task 5: Create Toss attempts and render the V2 payment flow

**Files:**
- Create: `src/lib/billing/payments/attempts.ts`
- Create: `src/app/api/payments/toss/attempts/route.ts`
- Create: `src/app/pay/invoices/[invoiceNumber]/page.tsx`
- Create: `src/app/pay/invoices/[invoiceNumber]/success/page.tsx`
- Create: `src/app/pay/invoices/[invoiceNumber]/fail/page.tsx`
- Create: `src/components/billing/toss-payment-button.tsx`
- Create: `tests/toss-attempts.test.mts`
- Create: `tests/toss-payment-page.test.mts`

**Interfaces:**

```ts
export async function createTossAttempt(input: {
  invoiceId: string;
  paymentSessionId: string;
}): Promise<{ orderId: string; amount: number; clientKey: string; expiresAt: string }>;
```

- [ ] **Step 1: Write failing attempt and page contract tests**

Test payment-session scope, invoice status, existing payment, amount from DB only, 10-minute expiry, unique `orderId`, UUID idempotency key persisted before browser launch, disabled Toss, no secret in response/HTML, and no caching.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/toss-attempts.test.mts tests/toss-payment-page.test.mts
```

- [ ] **Step 3: Implement the attempt endpoint**

Accept no amount and no customer/invoice ID in the JSON body. Resolve invoice scope from the host-only payment session. Return only `orderId`, integer amount, public client key, safe order/customer display text, and success/fail URLs.

- [ ] **Step 4: Implement the V2 checkout client**

Load `https://js.tosspayments.com/v2/standard` only on the payment page. Initialize the widget with the server-returned client key and anonymous customer key scoped to the handoff session. Use the exact current V2 `requestPayment` contract verified in Task 4. Disable repeated clicks while the request is in flight.

Success and fail pages do not mutate payment state in a Server Component. Success posts the returned triple to the confirm Route Handler; failure records only a safe cancellation/failure classification for the matching attempt.

- [ ] **Step 5: Test and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/toss-attempts.test.mts tests/toss-payment-page.test.mts
npm run lint
npx tsc --noEmit
git add src/lib/billing/payments/attempts.ts src/app/api/payments/toss/attempts/route.ts src/app/pay src/components/billing/toss-payment-button.tsx tests/toss-attempts.test.mts tests/toss-payment-page.test.mts
git commit -m "feat: launch Toss invoice payments"
```

---

### Task 6: Confirm payments without trusting the redirect

**Files:**
- Create: `src/lib/billing/payments/confirm.ts`
- Create: `src/app/api/payments/toss/confirm/route.ts`
- Create: `tests/toss-confirmation.test.mts`

**Interfaces:**

```ts
export async function confirmTossPayment(input: {
  paymentSessionId: string;
  paymentKey: string;
  orderId: string;
  amount: number;
}, client?: TossClient): Promise<ConfirmPaymentResult>;
```

- [ ] **Step 1: Write failing confirmation tests**

Cover missing session, wrong invoice scope, unknown order, amount tampering, wrong order, expired attempt, already-paid invoice, duplicate confirm, `CREATED -> AUTHENTICATED -> CONFIRMING`, provider mismatch, success persistence, provider rejection, timeout/unknown result, and retry using the original idempotency key.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/toss-confirmation.test.mts
```

- [ ] **Step 3: Implement validation before provider call**

Compare request `orderId` and `amount` against the stored attempt, not the URL or rendered page. Lock invoice/attempt, reject any completed payment, then persist `paymentKey` and `CONFIRMING` before calling Toss.

- [ ] **Step 4: Apply only a verified result**

After confirm, require exact expected MID, payment key, order ID, total amount, and `DONE`. In one atomic statement insert the payment, set attempt `DONE`, set invoice `PAID`, append `payment.completed`, and enqueue receipt email. A provider error known to be terminal may set `FAILED`; timeout/network/parser errors stay `CONFIRMING` and return `{ status: "PENDING" }`.

- [ ] **Step 5: Test and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/toss-confirmation.test.mts tests/toss-client.test.mts
npm test
npx tsc --noEmit
git add src/lib/billing/payments/confirm.ts src/app/api/payments/toss/confirm/route.ts tests/toss-confirmation.test.mts
git commit -m "feat: confirm Toss payments safely"
```

---

### Task 7: Verify webhooks and reconcile unknown outcomes

**Files:**
- Create: `src/lib/billing/payments/webhooks.ts`
- Create: `src/lib/billing/payments/reconcile.ts`
- Create: `src/app/api/payments/toss/webhook/route.ts`
- Create: `src/app/api/internal/billing/reconcile/route.ts`
- Create: `tests/toss-webhook.test.mts`
- Create: `tests/billing-reconciliation.test.mts`
- Modify: `vercel.json`

- [ ] **Step 1: Write failing webhook tests**

Test HTTPS expectation via forwarded protocol policy, POST only, JSON content type, 64 KiB body cap, supported event allowlist, missing transmission ID, duplicate transmission ID, payload hash, payment-key hashing, provider query required, MID/order/amount mismatch rejection, idempotent same-state event, new-state append, temporary lookup failure, and sanitized response.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/toss-webhook.test.mts tests/billing-reconciliation.test.mts
```

- [ ] **Step 3: Implement webhook receipt-first processing**

Read `tosspayments-webhook-transmission-id`, parse the limited `paymentKey` and `orderId` fields, link the receipt to the internal attempt by order ID, and insert `RECEIVED` plus hashes before processing. The raw payment key is retained only in this server-only DB field because reconciliation must query Toss after a failed first lookup; never return or log it. Return `200` immediately for an already completed duplicate. For supported payment/cancel events, query Toss with a seven-second timeout and pass the result through `verifyTossPayment`. Return `200` only after a verified terminal/no-op application; return non-2xx before the ten-second delivery deadline for a retryable lookup failure so Toss can retry.

- [ ] **Step 4: Implement reconciliation candidates**

Scan:

- `CONFIRMING` attempts older than 2 minutes,
- webhook receipts in `RETRY`,
- refunds in `PROCESSING` older than 2 minutes.

Claim rows with `FOR UPDATE SKIP LOCKED`, cap each run at 100, query provider, and apply only verified transitions. The internal route uses the same bearer `CRON_SECRET` policy as invoice generation.

- [ ] **Step 5: Add the schedule only after the Vercel plan gate passes**

First verify the active Vercel team is Pro or Enterprise. Official Vercel limits permit Hobby cron only once per day and reject a `*/10` deployment. If Pro/Enterprise is confirmed, merge this job into `vercel.json`:

```json
{ "path": "/api/internal/billing/reconcile", "schedule": "*/10 * * * *" }
```

If the selected Vercel plan does not support this cadence, do not add the invalid cron entry. Keep the endpoint, expose manual recovery in the operations queue, and mark Production payment activation plus automated reconciliation `HOLD`; never silently reduce the integrity requirement. Reference [Vercel Cron usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) and [Cron authentication/rollback behavior](https://vercel.com/docs/cron-jobs/manage-cron-jobs) in the status note.

- [ ] **Step 6: Test and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/toss-webhook.test.mts tests/billing-reconciliation.test.mts
npm test
npx tsc --noEmit
git add src/lib/billing/payments/webhooks.ts src/lib/billing/payments/reconcile.ts src/app/api/payments/toss/webhook/route.ts src/app/api/internal/billing/reconcile/route.ts tests/toss-webhook.test.mts tests/billing-reconciliation.test.mts vercel.json
git commit -m "feat: reconcile Toss payment events"
```

---

### Task 8: Add full and partial Toss cancellation

**Files:**
- Create: `src/lib/billing/payments/refunds.ts`
- Create: `src/lib/billing/payments/repository.ts`
- Create: `src/components/admin/billing/refund-form.tsx`
- Create: `src/app/admin/(shell)/billing/payment-actions.ts`
- Create: `tests/billing-refunds.test.mts`
- Create: `src/app/admin/(shell)/billing/payments/[id]/page.tsx`
- Modify: `tests/helpers/admin-action-policy.mts`

**Interfaces:**

```ts
export async function requestTossRefund(actorId: string, input: {
  paymentId: string;
  amount: number;
  reason: string;
}, client?: TossClient): Promise<{ refundId: string; status: RefundStatus }>;
```

- [ ] **Step 1: Write failing refund tests**

Cover recent `BILLING_REFUND` auth, non-Toss payment, 1 KRW minimum, refund above provider/internal balance, duplicate click, concurrent requests, persisted idempotency key, reason length, provider partial-cancel rejection, terminal success, timeout as `PROCESSING`, verified transaction key, cumulative refund amount, `PARTIALLY_REFUNDED`, and `REFUNDED`.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-refunds.test.mts
```

- [ ] **Step 3: Implement request-before-provider workflow**

Lock payment/refunds, query Toss for current cancelable balance, insert `REQUESTED` with idempotency key, then mark `PROCESSING` before calling cancel. Never report timeout as success. On verified response, persist transaction key and amounts, append `refund.completed`, update payment refunded total and invoice state, and audit `billing.refund.completed` without the payment key.

- [ ] **Step 4: Implement high-risk confirmation UI**

Show customer, invoice, original amount, already refunded, maximum refundable, requested amount, reason, and resulting remaining amount. Require explicit checkbox and recent authentication. Do not use a browser-only limit as the authority.

- [ ] **Step 5: Test and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-refunds.test.mts tests/billing-admin-policy.test.mts
npm run lint
npx tsc --noEmit
git add src/lib/billing/payments/refunds.ts src/lib/billing/payments/repository.ts src/components/admin/billing/refund-form.tsx 'src/app/admin/(shell)/billing/payment-actions.ts' 'src/app/admin/(shell)/billing/payments/[id]/page.tsx' tests/billing-refunds.test.mts tests/helpers/admin-action-policy.mts
git commit -m "feat: refund Toss payments"
```

---

### Task 9: Add the payment operations list and run the payment checkpoint

**Files:**
- Create: `src/app/admin/(shell)/billing/payments/page.tsx`
- Modify: `src/app/admin/(shell)/billing/payments/[id]/page.tsx`
- Modify: `src/components/admin/admin-nav.ts`
- Create: `tests/billing-payment-policy.test.mts`
- Modify: `docs/개발상태.md`

- [ ] **Step 1: Write failing policy/UI contracts**

Assert payment pages require `BILLING_VIEW`, bank confirm requires recent approve, refund requires recent refund authority, provider re-query is guarded, public routes never call admin guards, and no secret/payment key/raw provider error appears in rendered or logged data contracts.

- [ ] **Step 2: Implement operations queues**

Required filters and details:

- attempts in `CONFIRMING` beyond threshold,
- failed/retry webhooks,
- paid invoices and masked method,
- bank receipts with evidence,
- processing/failed refunds,
- append-only event timeline,
- manual provider re-query with safe result.

Use correlation IDs and key hashes for support display; never render full `paymentKey`.

- [ ] **Step 3: Update status and HOLD register**

Document environment names without values, webhook URL, schedules, feature flags, test/live separation, rollback behavior, and explicit external HOLD for Toss account review, method contracts, test/live keys, MID, webhook registration, and real-payment rehearsal.

- [ ] **Step 4: Run the full payment gate**

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

If Toss test keys are available, additionally run card/easy-pay success, user cancel, tampered amount, duplicate confirm, webhook resend, full cancel, and partial cancel in Preview. Otherwise report each as `HOLD`.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/admin/(shell)/billing/payments' src/components/admin/admin-nav.ts tests/billing-payment-policy.test.mts docs/개발상태.md
git commit -m "feat: add billing payment operations"
```

## Payments Completion Gate

- [ ] Bank transfer cannot mark an invoice paid without recent authorized manual confirmation and exact amount.
- [ ] A redirect/query-string amount, order ID, or payment key never bypasses stored attempt validation.
- [ ] A general webhook never changes state without a successful provider query and exact MID/order/amount comparison.
- [ ] Duplicate confirms, webhook deliveries, bank confirmations, and refund clicks are idempotent.
- [ ] Unknown provider outcomes remain recoverable and are visible in the operations queue.
- [ ] Full and partial refunds preserve immutable payment/invoice history.
- [ ] New-payment rollback leaves webhook and reconciliation paths enabled.
- [ ] External Toss tests are PASS only with actual test/live credentials and recorded evidence; otherwise they remain `HOLD`.
