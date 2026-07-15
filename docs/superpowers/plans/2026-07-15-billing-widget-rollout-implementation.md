# KPOPSOFT Billing Widget and Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a reusable customer-site Web Component, site-scoped HMAC authentication, one-time central-payment handoff, host isolation, operations hardening, and controlled Preview-to-Production rollout for Billing Hub.

**Architecture:** A logged-in customer site issues a 120-second site token on its own backend. Billing Hub verifies the HMAC, exact origin, audience, key version, site status, and replay state before returning a no-store summary. A pay click exchanges that authorization for a hashed five-minute one-time handoff; `pay.kpopsoft.com` consumes it and issues a separate host-only payment session. One Vercel project routes `www`, `pay`, and `admin.pay` by host, while all sensitive authorization remains inside Route Handlers and domain services.

**Tech Stack:** Next.js 16.2.10 Proxy/App Router, Node crypto, Neon PostgreSQL, Drizzle ORM, versioned vanilla Web Component, Auth.js admin sessions, Playwright browser tests, Vercel domains/cron/feature flags.

## Global Constraints

- Execute the foundation plan before Task 1 and the payments plan between Tasks 5 and 6 as specified below.
- Before changing `src/proxy.ts`, Route Handlers, cookies, CORS, headers, rewrites, or static assets, read the corresponding installed Next.js 16.2.10 guides.
- Do not use iframe third-party cookies or share the Auth.js admin cookie with `pay.kpopsoft.com`.
- Do not place customer name, email, invoice number, amount, or payment status in the site HMAC token.
- Site tokens expire in at most 120 seconds. Handoffs expire in at most 5 minutes and are single-use.
- Store only token/handoff hashes and replay identifiers. Never store raw tokens, HMAC secrets, master keys, or cookies.
- Encrypt each site secret with AES-256-GCM under a 32-byte environment master key. Show plaintext once at creation/rotation and never recover it to an administrator UI later.
- Exact `Origin` matching only; no wildcard, suffix, referrer, or substring authorization.
- Require the customer-site backend to authenticate its own user before it issues a token. The browser must never receive the site HMAC secret.
- Widget APIs use explicit CORS, `Vary: Origin`, `Cache-Control: no-store`, request-size limits, and rate limiting.
- Amount and invoice status always come from Billing Hub DB; the token/widget DOM never supplies authoritative billing data.
- `www.kpopsoft.com`, `pay.kpopsoft.com`, and `admin.pay.kpopsoft.com` use the same deployment but distinct route/cookie policies.
- Feature flags are server-side and fail closed: `BILLING_ENABLED`, `BANK_TRANSFER_ENABLED`, `TOSS_PAYMENTS_ENABLED`, `BILLING_WIDGET_ENABLED`.
- Production activation remains `HOLD` until Toss approval/keys, domains/certificates, bank account, production admin 2FA confirmation, and rehearsal evidence exist.
- Each task follows red-green-refactor TDD and ends with a separate commit.

## Dependency Order

1. Complete the billing foundation plan.
2. Execute this plan through Task 5 and pass the customer-access checkpoint below.
3. Pause this plan and execute the billing payments plan, which consumes the payment-session boundary.
4. After the payments completion gate passes, resume this plan at Task 6 and continue through rollout.

## File Structure

### New files

- `database/migrations/0004_billing_widget.sql` — integration, replay, rate-limit, handoff, and payment-session schema.
- `src/lib/billing/widget/runtime.ts` — master-key, issuer, audience, and host config.
- `src/lib/billing/widget/crypto.ts` — AES-GCM secret storage and HMAC helpers.
- `src/lib/billing/widget/tokens.ts` — compact site token creation/verification.
- `src/lib/billing/widget/origins.ts` — exact origin normalization and CORS headers.
- `src/lib/billing/widget/rate-limit.ts` — central request throttling seam.
- `src/lib/billing/widget/integrations.ts` — create, rotate, disable, and key-version commands.
- `src/lib/billing/widget/summary.ts` — site-scoped invoice summary.
- `src/lib/billing/widget/handoffs.ts` — one-time handoff issue/consume.
- `src/lib/billing/widget/payment-session.ts` — host-only encrypted session cookie.
- `src/lib/billing/hosts.ts` — normalized production/preview host routing policy.
- `src/app/api/widget/v1/summary/route.ts` — authenticated no-store summary.
- `src/app/api/widget/v1/handoffs/route.ts` — authenticated one-time handoff issue.
- `src/app/pay/start/[token]/route.ts` — consume handoff and issue payment session.
- `src/app/pay/page.tsx` — site-scoped invoice list.
- `src/app/api/pay/session/route.ts` — current payment-session status/expiry endpoint.
- `public/widgets/kpopsoft-billing.v1.js` — immutable reusable Web Component.
- `src/app/admin/(shell)/billing/integrations/page.tsx` — site integration list.
- `src/app/admin/(shell)/billing/integrations/[id]/page.tsx` — origin/key lifecycle.
- `src/app/admin/(shell)/billing/integration-actions.ts` — secured create/rotate/disable actions.
- `src/components/admin/billing/integration-key-dialog.tsx` — one-time secret display.
- `tests/billing-widget-schema.test.mts` — schema and migration contract.
- `tests/billing-widget-crypto.test.mts` — encryption and HMAC rules.
- `tests/billing-widget-token.test.mts` — claims, expiry, version, and replay.
- `tests/billing-widget-cors.test.mts` — exact origin and preflight.
- `tests/billing-widget-summary.test.mts` — visibility and prioritization.
- `tests/billing-handoff.test.mts` — issue/consume/session scope.
- `tests/billing-host-routing.test.mts` — host rewrite and cookie isolation.
- `tests/billing-widget-bundle.test.mts` — custom element contract and secret scan.
- `tests/billing-observability.test.mts` — safe metrics/queue contracts.
- `playwright.config.ts` — local browser verification config.
- `e2e/billing-widget.spec.ts` — widget and handoff browser scenarios.
- `e2e/billing-admin.spec.ts` — admin billing critical path.
- `docs/billing/widget-integration-nextjs.md` — Next.js server token example.
- `docs/billing/widget-integration-php.md` — PHP server token example.
- `docs/billing/widget-integration-rest.md` — generic REST contract.
- `docs/billing/operations-runbook.md` — deployment, rollback, reconciliation, incidents.
- `docs/billing/verification-report.md` — rollout evidence and PASS/HOLD register.

### Modified files

- `src/lib/db/schema.ts` — widget integration, replay, handoff, and session tables.
- `src/proxy.ts` — host mapping plus existing optimistic admin session check.
- `src/auth.config.ts` — preserve admin login route under admin host mapping.
- `src/app/admin/(shell)/billing/page.tsx` — operations metrics and queues.
- `src/components/admin/admin-nav.ts` — integrations link.
- `tests/proxy-runtime-contract.test.mts` — preserve Edge-safe/no-DB Proxy constraints.
- `tests/helpers/admin-action-policy.mts` — integration mutation boundaries.
- `next.config.ts` — security headers only if current Next docs require config-level declarations.
- `vercel.json` — widget cache/security headers; preserve cron entries.
- `package.json`, `package-lock.json` — Playwright test tooling and scripts.
- `docs/개발상태.md` — final architecture, environment, domains, verification, HOLD.

---

### Task 1: Add widget integration, replay, handoff, and session schema

**Files:**
- Create: `database/migrations/0004_billing_widget.sql`
- Modify: `src/lib/db/schema.ts`
- Create: `tests/billing-widget-schema.test.mts`

**Required SQL manifest:**

| Table | Required business columns |
|---|---|
| `billing_widget_integrations` | unique `public_id`, unique `site_id`, `encrypted_secret`, `secret_iv`, `secret_tag`, `allowed_origin`, `key_version`, `status`, `last_used_at`, `rotated_at` |
| `billing_widget_token_uses` | `integration_id`, unique `jti_hash`, `expires_at`, `first_used_at`, `last_used_at`, `use_count` |
| `billing_widget_rate_limits` | `integration_id`, `scope`, `key_hash`, `bucket_start`, `request_count` |
| `billing_handoffs` | unique `token_hash`, `integration_id`, `site_id`, `customer_id`, `expires_at`, `used_at`, `created_ip_hash` |
| `billing_payment_sessions` | unique `session_hash`, `site_id`, `customer_id`, `expires_at`, `revoked_at`, `last_seen_at` |

Constraints:

```sql
check (key_version > 0)
check (status in ('ACTIVE','DISABLED'))
check (allowed_origin ~ '^https://[^/]+$')
check (octet_length(secret_iv) = 12)
check (octet_length(secret_tag) = 16)
check (use_count >= 1)
check (scope in ('INTEGRATION','INTEGRATION_IP'))
check (request_count >= 1)
```

Use `bytea` for encrypted secret/IV/tag and hashes. Add `unique (integration_id, scope, key_hash, bucket_start)` for atomic fixed-window increments. Index token-use, rate-limit bucket, and handoff expiry for cleanup, active integrations by site, and active sessions by site/customer.

- [ ] **Step 1: Write failing schema/migration contract tests**

Assert exact five table exports, required columns, unique identifiers, encryption field sizes, origin/status/version checks, rate-limit uniqueness, foreign keys, expiry indexes, and update triggers where applicable.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-widget-schema.test.mts
```

- [ ] **Step 3: Implement the additive Drizzle schema and `0004`**

Export inferred row types for integration, handoff, and payment session. Do not expose `encryptedSecret`, `secretIv`, or `secretTag` through generic repository return types.

- [ ] **Step 4: Test and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-widget-schema.test.mts tests/billing-schema.test.mts tests/billing-payment-schema.test.mts
npx tsc --noEmit
git add database/migrations/0004_billing_widget.sql src/lib/db/schema.ts tests/billing-widget-schema.test.mts
git commit -m "feat: add billing widget schema"
```

---

### Task 2: Add secret encryption, integration lifecycle, and one-time display

**Files:**
- Create: `src/lib/billing/widget/runtime.ts`
- Create: `src/lib/billing/widget/crypto.ts`
- Create: `src/lib/billing/widget/integrations.ts`
- Create: `src/app/admin/(shell)/billing/integration-actions.ts`
- Create: `src/components/admin/billing/integration-key-dialog.tsx`
- Create: `tests/billing-widget-crypto.test.mts`

**Environment contract:**

```text
BILLING_WIDGET_MASTER_KEY=<base64 exactly 32 bytes>
BILLING_WIDGET_ISSUER=https://pay.kpopsoft.com
BILLING_WIDGET_AUDIENCE=kpopsoft-billing-widget
BILLING_PAY_SESSION_KEY=<base64 exactly 32 bytes, distinct from master key>
BILLING_RATE_LIMIT_HASH_KEY=<base64 exactly 32 bytes, distinct from other keys>
BILLING_PAY_HOST=pay.kpopsoft.com
BILLING_ADMIN_HOST=admin.pay.kpopsoft.com
```

**Interfaces:**

```ts
export function encryptWidgetSecret(secret: Uint8Array, masterKey: Uint8Array): EncryptedSecret;
export function decryptWidgetSecret(value: EncryptedSecret, masterKey: Uint8Array): Uint8Array;
export async function createWidgetIntegration(actorId: string, siteId: string, allowedOrigin: string): Promise<{ publicId: string; secret: string }>;
export async function rotateWidgetIntegration(actorId: string, integrationId: string): Promise<{ secret: string; keyVersion: number }>;
export async function setWidgetIntegrationEnabled(actorId: string, integrationId: string, enabled: boolean): Promise<void>;
```

- [ ] **Step 1: Write failing crypto/lifecycle tests**

Test 32-byte master-key validation, random 32-byte site secret, 12-byte nonce, 16-byte tag, round-trip, tamper rejection, different ciphertext per encryption, wrong master key, exact origin normalization, version increment, old version rejection after rotation, disabled integration, one-time return of plaintext, and no plaintext in DB/audit/log payloads.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-widget-crypto.test.mts
```

- [ ] **Step 3: Implement Node crypto primitives**

Use `randomBytes(32)`, `createCipheriv("aes-256-gcm", ...)`, and `timingSafeEqual` where equality involves MACs/hashes. Include `publicId`, `siteId`, and `keyVersion` as authenticated additional data so encrypted secrets cannot be moved between rows.

- [ ] **Step 4: Implement guarded lifecycle actions**

Require recent `BILLING_ADMIN`. Create/rotate writes audit actions `billing.widget.created`, `billing.widget.rotated`, or `billing.widget.disabled` with identifiers only. The Server Action returns plaintext only in its immediate success state; the dialog must warn that closing it makes the secret unrecoverable.

- [ ] **Step 5: Test and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-widget-crypto.test.mts tests/billing-admin-policy.test.mts
npm run lint
npx tsc --noEmit
git add src/lib/billing/widget/runtime.ts src/lib/billing/widget/crypto.ts src/lib/billing/widget/integrations.ts 'src/app/admin/(shell)/billing/integration-actions.ts' src/components/admin/billing/integration-key-dialog.tsx tests/billing-widget-crypto.test.mts
git commit -m "feat: manage billing widget credentials"
```

---

### Task 3: Define and verify short-lived site HMAC tokens

**Files:**
- Create: `src/lib/billing/widget/tokens.ts`
- Create: `tests/billing-widget-token.test.mts`

**Wire format:**

```text
base64url(UTF8 JSON claims) + "." + base64url(HMAC-SHA256(payload, siteSecret))
```

**Exact claims:**

```ts
type WidgetClaims = {
  iss: string;
  aud: "kpopsoft-billing-widget";
  siteId: string;
  sub: string;       // opaque per-site user reference, never email/name
  iat: number;
  exp: number;
  jti: string;
  kv: number;
};
```

**Interfaces:**

```ts
export function signWidgetToken(claims: WidgetClaims, secret: Uint8Array): string;
export async function verifyWidgetToken(input: { token: string; origin: string; now?: number }): Promise<VerifiedWidgetContext>;
```

- [ ] **Step 1: Write failing token tests**

Cover canonical JSON serialization, valid signature, single-byte tamper, wrong secret, malformed base64/JSON, unknown claims, wrong issuer/audience/site/key version, `iat` over 30 seconds in the future, lifetime above 120 seconds, expiry, disabled site/integration, wrong origin, missing `jti`, and replay count.

The first summary request may reuse the same token for rendering and handoff creation during its 120-second lifetime, but cap `use_count` at 4 and reject use from a different origin. This is replay detection/rate control, not global one-use semantics; the handoff itself is strictly one-use.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-widget-token.test.mts
```

- [ ] **Step 3: Implement strict parsing and constant-time comparison**

Reject duplicate JSON keys by parsing through a strict token schema, cap the token at 4096 bytes, hash `jti` with SHA-256 before storage, and update integration `last_used_at` only after full verification.

- [ ] **Step 4: Test and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-widget-token.test.mts tests/billing-widget-crypto.test.mts
npx tsc --noEmit
git add src/lib/billing/widget/tokens.ts tests/billing-widget-token.test.mts
git commit -m "feat: verify billing widget tokens"
```

---

### Task 4: Add exact-origin CORS, throttling, and the widget summary API

**Files:**
- Create: `src/lib/billing/widget/origins.ts`
- Create: `src/lib/billing/widget/rate-limit.ts`
- Create: `src/lib/billing/widget/summary.ts`
- Create: `src/app/api/widget/v1/summary/route.ts`
- Create: `tests/billing-widget-cors.test.mts`
- Create: `tests/billing-widget-summary.test.mts`

**Summary response:**

```ts
type WidgetSummary = {
  state: "PREPARING" | "UPCOMING" | "OPEN" | "OVERDUE" | "PAID" | "EMPTY";
  nextPaymentDate: string | null;
  amount: number | null;
  currency: "KRW";
  openInvoiceCount: number;
  canPay: boolean;
};
```

Do not return customer name, contact data, business number, contract internals, DB IDs, or invoice number from the summary endpoint.

- [ ] **Step 1: Write failing CORS and summary tests**

Test exact scheme/host/port, wildcard rejection, sibling/subdomain rejection, absent/null origin, allowed preflight, disallowed preflight, `Vary: Origin`, no credentials, allowed headers/methods, Bearer required, 16 KiB request/header cap, per integration/IP hash limit, DRAFT privacy, earliest `OVERDUE` then `OPEN`, multiple count, upcoming/preparing/paid/empty, and no-store response.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-widget-cors.test.mts tests/billing-widget-summary.test.mts
```

- [ ] **Step 3: Implement route order**

1. Parse and normalize `Origin`.
2. Resolve public integration ID from `X-KPOPSOFT-Widget`.
3. Return CORS denial before querying invoice rows.
4. Verify Bearer token.
5. Apply rate limit keyed by integration + HMACed IP prefix.
6. Query only the verified `siteId`.
7. Return safe summary with `Cache-Control: private, no-store, max-age=0`.

Use an injected in-memory limiter for unit tests and a Neon implementation in runtime. Increment `billing_widget_rate_limits` atomically and enforce 60 requests/minute per integration+IP prefix plus 300 requests/minute per integration. HMAC the normalized IP prefix with `BILLING_RATE_LIMIT_HASH_KEY` before storage, and delete buckets older than one day during the daily cleanup path. A process-local limiter is never accepted for Production.

- [ ] **Step 4: Test and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-widget-cors.test.mts tests/billing-widget-summary.test.mts
npm test
npx tsc --noEmit
git add src/lib/billing/widget/origins.ts src/lib/billing/widget/rate-limit.ts src/lib/billing/widget/summary.ts src/app/api/widget/v1/summary/route.ts tests/billing-widget-cors.test.mts tests/billing-widget-summary.test.mts
git commit -m "feat: serve billing widget summaries"
```

---

### Task 5: Issue one-time handoffs and isolated payment sessions

**Files:**
- Create: `src/lib/billing/widget/handoffs.ts`
- Create: `src/lib/billing/widget/payment-session.ts`
- Create: `src/app/api/widget/v1/handoffs/route.ts`
- Create: `src/app/pay/start/[token]/route.ts`
- Create: `src/app/pay/page.tsx`
- Create: `src/app/api/pay/session/route.ts`
- Create: `tests/billing-handoff.test.mts`

**Interfaces:**

```ts
export async function issueHandoff(context: VerifiedWidgetContext): Promise<{ url: string; expiresAt: string }>;
export async function consumeHandoff(rawToken: string): Promise<PaymentSessionClaims>;
export function createPaymentSessionCookie(claims: PaymentSessionClaims): { name: string; value: string; options: CookieOptions };
export async function requirePaymentSession(): Promise<PaymentSessionClaims>;
```

- [ ] **Step 1: Write failing handoff/session tests**

Cover no payable/visible data, correct site/customer scope, 32-byte random token, SHA-256 storage only, five-minute expiry, first consume success, concurrent second consume failure, expired token, disabled site/integration, host mismatch, session encryption/authentication, 30-minute idle/2-hour absolute expiry, revocation, cross-site invoice access, cookie name, and exact cookie flags.

Cookie contract:

```ts
{
  name: "__Host-kpopsoft-pay",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  domain: undefined,
}
```

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-handoff.test.mts
```

- [ ] **Step 3: Implement issue and atomic consume**

The widget endpoint accepts no customer/site/invoice fields; it uses verified token context. The start route hashes the path token and atomically sets `used_at` only where it is null and unexpired. It then inserts a hashed session row, sets the host-only cookie, and redirects to `/pay` without retaining the token in URL/history.

- [ ] **Step 4: Implement the central invoice list**

Show customer/site display names, each `OPEN | OVERDUE` invoice, items, supply/VAT/total, due date, and payment methods. Scope all reads through `requirePaymentSession`. The payments plan's invoice route must also require the same site/customer scope.

- [ ] **Step 5: Test and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-handoff.test.mts
npm run lint
npx tsc --noEmit
git add src/lib/billing/widget/handoffs.ts src/lib/billing/widget/payment-session.ts src/app/api/widget/v1/handoffs/route.ts 'src/app/pay/start/[token]/route.ts' src/app/pay/page.tsx src/app/api/pay/session/route.ts tests/billing-handoff.test.mts
git commit -m "feat: hand off billing payment sessions"
```

## Customer-Access Checkpoint Before Payments

- [ ] A verified customer-site token is the only way to issue a handoff.
- [ ] A handoff is site/customer scoped, five-minute, hashed, and single-use.
- [ ] The resulting payment session is host-only and exposes only that customer/site's approved invoices.
- [ ] The `/pay` shell and `requirePaymentSession` interface pass tests and typecheck.
- [ ] Pause here, execute the payments plan, and resume this plan at Task 6 only after its completion gate.

---

### Task 6: Publish the reusable versioned Web Component

**Files:**
- Create: `public/widgets/kpopsoft-billing.v1.js`
- Create: `tests/billing-widget-bundle.test.mts`
- Modify: `vercel.json`

**HTML integration contract:**

```html
<script src="https://pay.kpopsoft.com/widgets/kpopsoft-billing.v1.js" defer></script>
<kpopsoft-billing
  public-id="wgt_live_public_identifier"
  token-endpoint="/api/kpopsoft/billing-token"
></kpopsoft-billing>
```

The customer `token-endpoint` returns:

```json
{ "token": "<short-lived signed token>" }
```

- [ ] **Step 1: Write failing bundle contract tests**

Assert one `customElements.define("kpopsoft-billing", ...)`, shadow DOM, no `innerHTML` with server data, credential-safe `fetch`, summary/handoff endpoints, loading/preparing/upcoming/open/overdue/paid/empty/error rendering, Korean labels, disabled double click, top-level navigation, accessible button/status, 44px minimum control height, and absence of business numbers, secrets, keys, and internal IDs.

- [ ] **Step 2: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-widget-bundle.test.mts
```

- [ ] **Step 3: Implement the dependency-free component**

Capture the Billing Hub origin once at script evaluation from `document.currentScript.src`; do not accept an API base from an element attribute. Fetch the customer site's same-origin token endpoint with `credentials: "same-origin"`, then call that captured Billing Hub origin with Bearer token and `X-KPOPSOFT-Widget`; the browser supplies `Origin`. Use `textContent` for data. On pay click, POST the handoff endpoint with the same short-lived token and set `window.location.assign(response.url)`.

Errors display `결제 정보를 불러오지 못했습니다` with a retry button and never guess an amount/date.

- [ ] **Step 4: Add immutable asset headers**

Merge this rule into `vercel.json`:

```json
{
  "source": "/widgets/kpopsoft-billing.v1.js",
  "headers": [
    { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" },
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "Cross-Origin-Resource-Policy", "value": "cross-origin" }
  ]
}
```

Any breaking change publishes `v2`; never alter the contract of an already customer-deployed version without compatibility tests.

- [ ] **Step 5: Test and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-widget-bundle.test.mts
npm run lint
git add public/widgets/kpopsoft-billing.v1.js tests/billing-widget-bundle.test.mts vercel.json
git commit -m "feat: publish billing web component"
```

---

### Task 7: Route three hosts without weakening authorization

**Files:**
- Create: `src/lib/billing/hosts.ts`
- Modify: `src/proxy.ts`
- Modify: `src/auth.config.ts`
- Modify: `tests/proxy-runtime-contract.test.mts`
- Create: `tests/billing-host-routing.test.mts`

**Host mapping:**

| Request host/path | Internal destination |
|---|---|
| `www.kpopsoft.com/*` | unchanged existing site routes |
| `pay.kpopsoft.com/` | `/pay` |
| `pay.kpopsoft.com/invoices/*` | `/pay/invoices/*` |
| `pay.kpopsoft.com/start/*` | `/pay/start/*` |
| `admin.pay.kpopsoft.com/` | `/admin/billing` |
| `admin.pay.kpopsoft.com/login` | `/admin/login` |
| `admin.pay.kpopsoft.com/*` | `/admin/billing/*` when a matching billing route exists |

- [ ] **Step 1: Read the installed Proxy and multi-tenant docs**

Confirm the current Next 16 matcher, rewrite, headers, and Auth.js compatibility requirements. The Proxy must stay Edge-compatible and import neither DB, Node crypto, `server-only`, nor billing repositories.

- [ ] **Step 2: Write failing routing tests**

Test production hosts, `host:port` preview/local input, `x-forwarded-host` trust policy on Vercel, unknown host, www unchanged, pay route restriction, admin login/auth flow, direct public access to internal admin billing paths, and no admin cookie Domain broadening.

- [ ] **Step 3: Run and verify red**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-host-routing.test.mts tests/proxy-runtime-contract.test.mts
```

- [ ] **Step 4: Implement pure host policy plus Proxy orchestration**

Resolve host-to-route through a pure `billingHostDestination` function. Proxy may rewrite or redirect and perform the existing Auth.js optimistic cookie check only. Every destination page/API still performs its own DB-backed authorization.

Unknown production hosts return the existing app behavior; they must not gain pay/admin mapping. Direct `/pay` on `www` redirects to the canonical pay host when enabled. Direct `/admin/billing` on `www` redirects to the canonical admin host after authentication without sharing a broader cookie.

- [ ] **Step 5: Test and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-host-routing.test.mts tests/proxy-runtime-contract.test.mts tests/admin-auth-policy.test.mts
npm run lint
npx tsc --noEmit
git add src/lib/billing/hosts.ts src/proxy.ts src/auth.config.ts tests/proxy-runtime-contract.test.mts tests/billing-host-routing.test.mts
git commit -m "feat: route billing hosts safely"
```

---

### Task 8: Add integration guides and administrator lifecycle UI

**Files:**
- Create: `src/app/admin/(shell)/billing/integrations/page.tsx`
- Create: `src/app/admin/(shell)/billing/integrations/[id]/page.tsx`
- Modify: `src/components/admin/admin-nav.ts`
- Create: `docs/billing/widget-integration-nextjs.md`
- Create: `docs/billing/widget-integration-php.md`
- Create: `docs/billing/widget-integration-rest.md`
- Modify: `tests/helpers/admin-action-policy.mts`

- [ ] **Step 1: Add action boundaries and permission tests**

Recognize `createWidgetIntegration`, `rotateWidgetIntegration`, and `setWidgetIntegrationEnabled`; require recent `BILLING_ADMIN` before each call.

- [ ] **Step 2: Implement integration list/detail**

Show site, public ID, exact allowed origin, key version, state, last use, rotation time, and safe copyable embed HTML. Never display encrypted fields. Rotation requires an explicit impact warning because existing customer backends must switch secrets.

- [ ] **Step 3: Write complete server-side examples**

Each guide must:

1. verify the customer's existing login/session first;
2. load secret from a server environment variable;
3. create exact claims with <=120-second expiry and random `jti`;
4. sign HMAC-SHA256 using the wire format from Task 3;
5. return token with `Cache-Control: no-store`;
6. render the version-pinned Web Component;
7. state that secret, amount, and payment status must never be stored in browser code.

The PHP sample uses `hash_hmac(..., true)` and base64url without padding. The generic REST guide provides language-neutral canonical JSON ordering and a fixed test vector generated by `tests/billing-widget-token.test.mts`.

- [ ] **Step 4: Validate docs and commit**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-widget-token.test.mts tests/billing-admin-policy.test.mts
rg -n "secret|HMAC|token" docs/billing public/widgets/kpopsoft-billing.v1.js
git diff --check
git add 'src/app/admin/(shell)/billing/integrations' src/components/admin/admin-nav.ts docs/billing/widget-integration-nextjs.md docs/billing/widget-integration-php.md docs/billing/widget-integration-rest.md tests/helpers/admin-action-policy.mts
git commit -m "docs: add billing widget integrations"
```

Review the `rg` output manually to confirm examples use clearly fake environment values, never real values.

---

### Task 9: Add browser verification and safe observability

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.ts`
- Create: `e2e/billing-widget.spec.ts`
- Create: `e2e/billing-admin.spec.ts`
- Create: `src/lib/billing/operations.ts`
- Create: `tests/billing-observability.test.mts`
- Modify: `src/app/admin/(shell)/billing/page.tsx`

- [ ] **Step 1: Install and configure browser testing**

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

Add scripts:

```json
{
  "test:e2e": "playwright test",
  "test:e2e:billing": "playwright test e2e/billing-widget.spec.ts e2e/billing-admin.spec.ts"
}
```

Use only synthetic fixtures and a disposable Preview database. Do not point automated destructive tests at Production.

- [ ] **Step 2: Write critical browser scenarios**

Cover 390px and desktop:

- widget preparing/upcoming/open/overdue/paid/error states;
- non-logged-in customer token endpoint denial;
- expired token, wrong origin, replay limit;
- handoff top-level navigation and second-use denial;
- payment session scoped invoice list;
- bank instructions hidden when unconfigured;
- Toss success/cancel/fail fixtures without live provider calls;
- admin draft review/approval, bank confirm, payment queue, refund confirmation;
- keyboard access, accessible names/status, no horizontal overflow, 44px targets.

- [ ] **Step 3: Add safe operations aggregates**

Expose counts only: draft approvals, overdue invoices, delivery failures, `CONFIRMING` age buckets, webhook retries, processing/failed refunds, and last billing run. No contact details, payment keys, secrets, or raw errors in metrics/logs.

Use structured correlation fields:

```ts
{ correlationId, invoiceIdHash, attemptId, event: "billing.payment.confirm.pending", errorCode }
```

- [ ] **Step 4: Run local browser and static gates**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/billing-observability.test.mts
npm run test:e2e:billing
npm run lint
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json playwright.config.ts e2e src/lib/billing/operations.ts tests/billing-observability.test.mts 'src/app/admin/(shell)/billing/page.tsx'
git commit -m "test: verify billing customer flows"
```

---

### Task 10: Perform controlled rollout, document HOLD, and close the project gate

**Files:**
- Create: `docs/billing/operations-runbook.md`
- Create: `docs/billing/verification-report.md`
- Modify: `docs/개발상태.md`

- [ ] **Step 1: Write the operations runbook before deployment**

Include:

- environment variable names and owners, never values;
- migration order `0002 -> 0003 -> 0004` and backup/restore checkpoint;
- feature activation order: billing, bank, Toss, widget;
- Preview Neon branch and Toss test-key separation;
- domain/DNS/certificate checks;
- webhook registration and resend test;
- reconciliation queue handling;
- widget key creation/rotation/disable;
- new-payment rollback that keeps webhook/reconcile running;
- the fact that Vercel Instant Rollback does not update active cron schedules, so cron disable/update is a separate rollback step;
- provider outage, duplicate payment, wrong bank receipt, stuck refund, and secret compromise procedures;
- audit evidence and escalation contacts by role, not personal credentials.

- [ ] **Step 2: Run the complete local gate**

```bash
npm test
npm run test:e2e:billing
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

Record command, date/time, commit SHA, exit status, and concise result in `docs/billing/verification-report.md`.

- [ ] **Step 3: Deploy Preview with all payment entry flags off**

Required initial values:

```text
BILLING_ENABLED=true
BANK_TRANSFER_ENABLED=false
TOSS_PAYMENTS_ENABLED=false
BILLING_WIDGET_ENABLED=false
```

Apply migrations only to the disposable Preview Neon branch. Verify existing www/admin/inquiry/content flows before billing flows. If the correct Vercel identity or isolated DB cannot be verified, stop and record `HOLD`.

- [ ] **Step 4: Verify Preview in activation stages**

1. Enable contract/invoice admin only; generate and approve a synthetic draft.
2. Configure test bank display; verify exact manual confirmation with synthetic data.
3. Configure Toss test keys/MID/webhook; run success, tamper, duplicate, timeout/reconcile, resend, full/partial cancel.
4. Configure one staging customer integration; verify login, token, origin, summary, handoff, and pay page.
5. Confirm logs/HTML/bundle/DB audit samples contain no forbidden secret or raw payment data.

- [ ] **Step 5: Keep external Production dependencies explicit**

These remain `HOLD` until evidence is attached:

- Toss merchant review and contracted card/easy-pay methods;
- test and live keys plus correct MID;
- `pay.kpopsoft.com` and `admin.pay.kpopsoft.com` DNS/certificates;
- production bank account values;
- target customer-site backend access and authenticated token endpoint;
- production admin Google 2FA confirmation;
- authorized small live payment and full-cancel rehearsal;
- Vercel commercial plan/schedule suitability.

- [ ] **Step 6: Production activation sequence**

After all HOLD items clear:

1. verify the intended Vercel account/project/branch;
2. create/verify DB backup and run additive migrations;
3. deploy with all payment entry flags off;
4. verify webhooks/reconciliation and existing site smoke;
5. enable billing admin, then bank or Toss one at a time;
6. complete authorized small live payment and full cancel;
7. enable widget for one staging/customer site;
8. observe queues and logs for 24 hours before the next site;
9. record PASS/HOLD/FAIL and rollback decision.

- [ ] **Step 7: Commit documentation**

```bash
git add docs/billing/operations-runbook.md docs/billing/verification-report.md docs/개발상태.md
git commit -m "docs: add billing operations runbook"
```

## Final Completion Gate

- [ ] Unapproved drafts are absent from all widget, handoff, pay-page, and payment-attempt paths.
- [ ] Widget token verifies signature, issuer, audience, site, version, lifetime, exact origin, site status, and replay policy.
- [ ] Handoff is hashed, five-minute, and atomically single-use.
- [ ] Payment cookie is encrypted/authenticated, host-only, Secure, HttpOnly, SameSite=Lax, and site/customer scoped.
- [ ] `www`, `pay`, and `admin.pay` routing does not broaden admin authorization or cookies.
- [ ] Widget v1 is version-pinned, dependency-free, accessible, mobile-safe, and contains no secret/business/payment data.
- [ ] Full local verification and isolated Preview evidence are recorded.
- [ ] Production activation is PASS only when every external HOLD is cleared; otherwise the honest final status is `HOLD`.

## Design Coverage Matrix

| Approved design section | Implementation location |
|---|---|
| Goals, decisions, scope, architecture, module boundaries | Three plan headers and global constraints |
| Customer/contract/invoice model and states | Foundation Tasks 1–6 |
| Automatic drafts and approval | Foundation Tasks 5–8 |
| Bank transfer | Payments Tasks 2–3 |
| Toss one-time payment | Payments Tasks 4–6 |
| Webhook/reconciliation | Payments Task 7 |
| Full/partial refund | Payments Task 8 |
| Admin permissions/audit | Foundation Task 3 and all guarded actions |
| Customer widget/handoff | Widget Tasks 1–6 |
| Host/cookie isolation | Widget Tasks 5 and 7 |
| Notifications/error/privacy | Foundation Task 6, payment constraints, widget constraints |
| Admin/customer screens | Foundation Task 7, Payments Tasks 3/5/9, Widget Tasks 5/8 |
| Tests/deploy/rollback/observability/HOLD | Widget Tasks 9–10 and every plan completion gate |
| Explicit out-of-scope list | All three plans' global constraints |
