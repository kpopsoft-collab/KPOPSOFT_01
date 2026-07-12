# Inquiry Operations Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make KPOPSOFT inquiry intake and administration fail closed, notify `kpopsoft@gmail.com` without leaking contact data to logs, and leave a tested boundary for the later Linear adapter.

**Architecture:** Keep the existing Next.js Server Action and data-source seams, but make development bypass and mock storage explicit opt-ins. Every admin mutation re-authorizes inside the Server Action, public inquiry validation moves into a pure tested module, and email delivery uses a pure message builder plus a server-only Resend adapter. The Supabase policy change is an external HOLD until the Supabase CLI or authenticated MCP is available.

**Tech Stack:** Next.js 16.2, React 19.2, TypeScript 5, Node.js 22 test runner, Supabase SSR, Resend 6.17.

## Global Constraints

- Work only on branch `codex/kpopsoft-maxonomy-concept-wind`.
- Do not replace or redesign the public homepage while image direction is under review.
- Admin access must fail closed in production; `ADMIN_DEV_BYPASS` is allowed only when explicitly equal to `true` outside production.
- Every exported admin mutation must authorize inside the Server Action; layout protection alone is insufficient.
- Inquiry submission must never log sender names, email addresses, phone numbers, or message bodies.
- Email notification recipient defaults to `kpopsoft@gmail.com`; `INQUIRY_NOTIFY_TO` may override it with a comma-separated list.
- Missing email or Linear credentials must not roll back a successfully stored inquiry.
- Never log `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `LINEAR_API_KEY`, OAuth tokens, or raw request bodies.
- Do not apply a database migration without an authenticated Supabase MCP or a discovered Supabase CLI command.

---

### Task 1: Add a dependency-free test command and fail-closed runtime mode

**Files:**
- Create: `src/lib/admin/runtime-mode.ts`
- Create: `tests/admin-runtime-mode.test.mts`
- Modify: `package.json`
- Modify: `src/lib/admin/auth.ts`
- Modify: `src/lib/admin/auth-actions.ts`
- Modify: `src/proxy.ts`
- Modify: `src/lib/admin/data.ts`

**Interfaces:**
- Produces: `isAdminDevBypassEnabled(env): boolean`
- Produces: `resolveAdminDataMode(env): "supabase" | "mock" | "misconfigured"`

- [ ] **Step 1: Add the failing runtime-mode tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  isAdminDevBypassEnabled,
  resolveAdminDataMode,
} from "../src/lib/admin/runtime-mode.ts";

test("admin bypass is opt-in and never enabled in production", () => {
  assert.equal(isAdminDevBypassEnabled({ NODE_ENV: "development" }), false);
  assert.equal(
    isAdminDevBypassEnabled({
      NODE_ENV: "development",
      ADMIN_DEV_BYPASS: "true",
    }),
    true,
  );
  assert.equal(
    isAdminDevBypassEnabled({
      NODE_ENV: "production",
      ADMIN_DEV_BYPASS: "true",
    }),
    false,
  );
});

test("admin data never falls back to mock storage implicitly", () => {
  assert.equal(
    resolveAdminDataMode({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret",
    }),
    "supabase",
  );
  assert.equal(resolveAdminDataMode({ NODE_ENV: "production" }), "misconfigured");
  assert.equal(
    resolveAdminDataMode({
      NODE_ENV: "development",
      ADMIN_DEV_BYPASS: "true",
    }),
    "mock",
  );
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/admin-runtime-mode.test.mts`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/lib/admin/runtime-mode.ts`.

- [ ] **Step 3: Implement the pure runtime policy**

```ts
export type RuntimeEnv = Partial<
  Record<
    | "NODE_ENV"
    | "ADMIN_DEV_BYPASS"
    | "NEXT_PUBLIC_SUPABASE_URL"
    | "SUPABASE_SERVICE_ROLE_KEY",
    string
  >
>;

export function isAdminDevBypassEnabled(env: RuntimeEnv = process.env) {
  return env.NODE_ENV !== "production" && env.ADMIN_DEV_BYPASS === "true";
}

export function resolveAdminDataMode(
  env: RuntimeEnv = process.env,
): "supabase" | "mock" | "misconfigured" {
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    return "supabase";
  }
  return isAdminDevBypassEnabled(env) ? "mock" : "misconfigured";
}
```

- [ ] **Step 4: Use the shared policy everywhere**

Replace each permissive expression `process.env.ADMIN_DEV_BYPASS !== "false"` with `isAdminDevBypassEnabled()`. In `getAdminData()`, return Supabase only for `"supabase"`, return mock only for `"mock"`, and throw `new Error("Admin data source is not configured")` for `"misconfigured"`.

- [ ] **Step 5: Add the repeatable test script and verify GREEN**

Add to `package.json`:

```json
"test": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/*.test.mts"
```

Run: `npm test && npm run lint`

Expected: all runtime-mode tests pass and ESLint exits 0.

---

### Task 2: Re-authorize every admin Server Action

**Files:**
- Modify: `src/lib/admin/auth.ts`
- Create: `tests/admin-actions-auth.test.mts`
- Modify: `src/app/admin/(shell)/inquiries/actions.ts`
- Modify: `src/app/admin/(shell)/settings/actions.ts`
- Modify: `src/app/admin/(shell)/content/experts/actions.ts`
- Modify: `src/app/admin/(shell)/content/inquiry-options/actions.ts`
- Modify: `src/app/admin/(shell)/content/insights/actions.ts`
- Modify: `src/app/admin/(shell)/content/stats/actions.ts`
- Modify: `src/app/admin/(shell)/content/testimonials/actions.ts`
- Modify: `src/app/admin/(shell)/content/work/actions.ts`

**Interfaces:**
- Produces: `requireAdminAction(): Promise<{ email: string }>`

- [ ] **Step 1: Add a failing structural authorization test**

The test recursively finds `src/app/admin/(shell)/**/actions.ts`, excludes no mutation file, and asserts that every exported function except local type declarations contains `await requireAdminAction()` before its first data-source or Supabase call.

```ts
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(process.cwd(), "src/app/admin/(shell)");

function actionFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return actionFiles(path);
    return entry.name === "actions.ts" ? [path] : [];
  });
}

test("every admin mutation re-authorizes inside its server action", () => {
  for (const file of actionFiles(root)) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /import \{ requireAdminAction \}/, file);
    const exports = source.split(/export async function /).slice(1);
    for (const body of exports) {
      assert.match(body, /await requireAdminAction\(\)/, file);
    }
  }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/admin-actions-auth.test.mts`

Expected: FAIL on `src/app/admin/(shell)/inquiries/actions.ts` because no action-level guard exists.

- [ ] **Step 3: Add the action guard**

```ts
export async function requireAdminAction(): Promise<{ email: string }> {
  const session = await getAdminSession();
  if (!session) throw new Error("Forbidden");
  return session;
}
```

- [ ] **Step 4: Guard every exported admin mutation**

Import `requireAdminAction` from `@/lib/admin/auth` and make `await requireAdminAction();` the first executable statement in every exported mutation listed in **Files**.

- [ ] **Step 5: Verify GREEN**

Run: `npm test && npm run lint`

Expected: structural policy test and runtime-mode tests pass; ESLint exits 0.

---

### Task 3: Bound inquiry input and remove PII from operational logs

**Files:**
- Create: `src/lib/inquiries/validation.ts`
- Create: `tests/inquiry-validation.test.mts`
- Modify: `src/lib/inquiry-actions.ts`
- Modify: `src/lib/email.ts`

**Interfaces:**
- Produces: `validateInquiry(input): { ok: true; value: NewInquiry } | { ok: false; error: string }`
- Constraints: type 80, subtype 120, sender 120, contact 254, message 5,000 characters.

- [ ] **Step 1: Write failing validation tests**

Cover required type/subtype/message, trimming, plausible contact validation, each maximum length, and rejection of an over-limit message.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/inquiry-validation.test.mts`

Expected: FAIL because `src/lib/inquiries/validation.ts` does not exist.

- [ ] **Step 3: Implement and use the validator**

`submitInquiry()` keeps the honeypot early return, delegates all remaining checks and trimming to `validateInquiry()`, and passes only the returned `value` to `createInquiry()`.

- [ ] **Step 4: Make logs PII-safe**

Allowed inquiry log fields are only `id`, `type`, `subtype`, `createdAt`, and a short error category. Remove `sender`, `contact`, and message content from every `console.*` payload.

- [ ] **Step 5: Verify GREEN**

Run: `npm test && npm run lint && npm run build`

Expected: validation tests pass, lint exits 0, and the Webpack production build succeeds.

---

### Task 4: Send idempotent inquiry notifications to the requested mailbox

**Files:**
- Create: `src/lib/inquiries/email-message.ts`
- Create: `tests/inquiry-email-message.test.mts`
- Modify: `src/lib/email.ts`

**Interfaces:**
- Produces: `buildInquiryEmail(inquiry): { subject: string; text: string; replyTo?: string; idempotencyKey: string }`
- Default recipient: `kpopsoft@gmail.com`

- [ ] **Step 1: Write failing email-message tests**

Assert the subject includes type/subtype, the text includes the admin detail URL `/admin/inquiries/<id>`, `replyTo` is present only for an email-shaped contact, and `idempotencyKey` is exactly `inquiry-<uuid>`.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/inquiry-email-message.test.mts`

Expected: FAIL because `src/lib/inquiries/email-message.ts` does not exist.

- [ ] **Step 3: Implement the pure message builder**

The builder returns plain text, derives the detail URL from `NEXT_PUBLIC_SITE_URL ?? "https://kpopsoft.com"`, and does not log or expose API credentials.

- [ ] **Step 4: Wire the installed Resend SDK**

Resolve recipients from `INQUIRY_NOTIFY_TO`, default to `["kpopsoft@gmail.com"]`, and send with:

```ts
await resend.emails.send(
  {
    from: process.env.RESEND_FROM ?? "KPOPSOFT <onboarding@resend.dev>",
    to,
    subject,
    text,
    ...(replyTo ? { replyTo } : {}),
  },
  { idempotencyKey },
);
```

- [ ] **Step 5: Verify without sending real mail**

Run: `npm test && npm run lint && npm run build`

Expected: pure email tests pass. Do not set `RESEND_API_KEY` locally and do not send to a real mailbox during automated verification.

---

### Task 5: Supabase policy hardening — external HOLD

**Files:**
- Future migration created only with: `supabase migration new harden_inquiry_intake`

**Interfaces:**
- Revokes direct `anon`/`authenticated` INSERT into `public.inquiries`.
- Grants only the exact Data API privileges needed by authenticated administrators.
- Revokes default `PUBLIC` execution of `public.is_admin()` and grants execution only to `authenticated`.

- [ ] **Step 1: Unblock the migration tool**

Use an authenticated Supabase MCP or install/discover the Supabase CLI, then run `supabase migration new --help` before creating the file. The CLI and authenticated MCP are currently unavailable, so no migration filename may be invented and no remote schema may be changed.

- [ ] **Step 2: Create and review the migration**

The migration must drop `inquiries_insert_anon`, revoke INSERT from `anon, authenticated`, preserve admin SELECT/UPDATE/DELETE through RLS, add required explicit grants for the project Data API setting introduced in April 2026, and lock down function execution.

- [ ] **Step 3: Run Supabase advisors and a role matrix**

Verify: anon INSERT denied; unauthenticated SELECT denied; non-admin authenticated SELECT/UPDATE denied; admin SELECT/UPDATE allowed; server service-role INSERT allowed.

---

### Follow-up subsystem: Linear adapter

Linear creation is intentionally a separate implementation plan because it has a different external credential and failure domain. It will consume only the stored `Inquiry` DTO, create one issue through `https://api.linear.app/graphql`, check both HTTP errors and GraphQL `errors[]`, and store or log only the returned issue identifier. End-to-end verification remains HOLD until `LINEAR_API_KEY`/OAuth and `LINEAR_TEAM_ID` are supplied to the deployment environment.
