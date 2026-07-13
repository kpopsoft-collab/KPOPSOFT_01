# KPOPSOFT Vercel Admin Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the production Supabase admin runtime with a fail-closed Vercel-hosted admin platform using Auth.js Google login, Neon Postgres, Vercel Blob, Cloudflare Email Service, and Linear.

**Architecture:** Keep the existing admin UI contracts and replace only their authentication, persistence, notification, and upload adapters. Proxy performs an optimistic cookie check; every page data read, Server Action, Route Handler, and upload token request performs a secure Neon-backed administrator check. Public inquiry persistence succeeds or fails solely on Neon, while email and Linear run as retryable follow-up deliveries.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, Auth.js `next-auth@5.0.0-beta.31`, Neon serverless Postgres, Drizzle ORM, Vercel Blob, Cloudflare Node SDK, Linear TypeScript SDK, Zod, Node test runner.

## Global Constraints

- Work only on `codex/kpopsoft-maxonomy-concept-wind`; preserve unrelated user changes.
- Read the installed guides in `node_modules/next/dist/docs/` before changing Next.js authentication, Proxy, Server Actions, Route Handlers, forms, or environment handling.
- Production must never fall back to mock data or an auth bypass.
- Proxy may perform only an optimistic cookie check; secure authorization belongs in the DAL and every mutation boundary.
- Every registered active team member has the same 최고관리자 authority.
- Never commit team email lists, OAuth secrets, DB URLs, Cloudflare credentials, Linear credentials, or Vercel tokens.
- Persist an inquiry in Neon before attempting email or Linear delivery.
- Email or Linear failure must not roll back a stored inquiry.
- Only verified `kpopsoft@gmail.com` receives the free Cloudflare notification in this scope.
- Visitor confirmation email and the education application template redesign remain out of scope.
- Images are JPEG, PNG, or WebP only and no larger than 10 MB.
- Public CTA, navigation, accordion, fallback content, existing instructor photography, and semantic mobile order must remain intact.
- Vercel Hobby is a free pilot only; commercial production remains `HOLD` pending a compliant Vercel plan decision.
- Each task follows TDD and ends with a separate commit.

## File Structure

### New files

- `src/lib/db/schema.ts` — Drizzle table definitions and shared row types.
- `src/lib/db/runtime.ts` — pure fail-closed database environment validation.
- `src/lib/db/index.ts` — lazy Neon/Drizzle initialization with fail-closed env validation.
- `database/migrations/0001_vercel_admin_platform.sql` — idempotent production schema migration.
- `scripts/migrate-neon.mts` — applies checked-in migrations using `DATABASE_URL`.
- `scripts/seed-neon.mts` — seeds current public content and protected admin emails supplied at runtime.
- `src/auth.ts` — Auth.js Google provider, JWT callbacks, and allowlist gate.
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js Route Handler exports.
- `src/lib/admin/neon-data.ts` — Neon implementation of `AdminDataSource`.
- `src/lib/admin/neon-content.ts` — Neon content repositories.
- `src/lib/admin/neon-inquiry-options.ts` — Neon inquiry option repository.
- `src/lib/admin/admin-users.ts` — administrator list, activation, last-admin protection, and audit writes.
- `src/app/admin/(shell)/settings/team-actions.ts` — secured team management Server Actions.
- `src/components/admin/settings/team-manager.tsx` — responsive administrator management UI.
- `src/lib/integrations/cloudflare-email.ts` — Cloudflare send adapter and response mapping.
- `src/lib/integrations/linear.ts` — Linear issue adapter and idempotent response mapping.
- `src/lib/inquiries/delivery.ts` — orchestration and retry functions for email and Linear.
- `src/app/admin/(shell)/inquiries/delivery-actions.ts` — secured retry actions.
- `src/app/api/admin/uploads/route.ts` — authenticated Vercel Blob client-upload token endpoint.
- `src/lib/media/blob.ts` — MIME/size validation and Blob metadata persistence.
- `tests/db-runtime.test.mts` — fail-closed DB initialization contract.
- `tests/admin-auth-policy.test.mts` — Auth.js, DAL, Proxy, and action guard contracts.
- `tests/admin-users.test.mts` — normalization and last-admin rules.
- `tests/inquiry-delivery.test.mts` — delivery result and retry state transitions.
- `tests/cloudflare-email.test.mts` — message and Cloudflare response mapping.
- `tests/linear-integration.test.mts` — issue payload and idempotency mapping.
- `tests/blob-upload-policy.test.mts` — MIME and size policy.
- `tests/supabase-removal-contract.test.mts` — production runtime dependency removal.

### Modified files

- `package.json`, `package-lock.json` — runtime and migration dependencies/scripts.
- `src/proxy.ts` — Auth.js optimistic session redirect only.
- `src/lib/admin/auth.ts`, `src/lib/admin/auth-actions.ts` — Google OAuth and Neon DAL.
- `src/app/admin/login/page.tsx` — Google-only login UI.
- `src/app/admin/(shell)/settings/page.tsx` — team management instead of password change.
- `src/lib/admin/runtime-mode.ts` — `neon | mock | misconfigured` runtime policy.
- `src/lib/admin/data.ts`, `src/lib/admin/content-data.ts`, `src/lib/admin/inquiry-options.ts` — Neon adapter selection.
- `src/lib/admin/types.ts` — delivery state and external reference fields.
- `src/lib/public-content.ts` — Neon public reads with existing seed fallback.
- `src/lib/inquiry-actions.ts` — idempotent persistence then delivery orchestration.
- `src/lib/inquiries/validation.ts` — Zod schema and anti-spam timing input.
- `src/lib/inquiries/email-message.ts` — HTML/text Cloudflare message payload.
- `src/components/admin/content/image-upload.tsx` — Vercel Blob client upload.
- `src/app/admin/(shell)/inquiries/[id]/page.tsx` — delivery status, external link, retry controls.
- `src/app/admin/(shell)/inquiries/actions.ts` — audit-aware secured mutations.
- `tests/helpers/admin-action-policy.mts` — Neon mutation boundary detection.
- `docs/개발상태.md`, `docs/어드민기획.md` — actual runtime, HOLD items, and verification evidence.

### Removed files after replacement tests pass

- `src/lib/admin/supabase-data.ts`
- `src/lib/admin/supabase-content.ts`
- `src/lib/admin/supabase-inquiry-options.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/public.ts`
- `src/lib/supabase/server.ts`
- `src/lib/email.ts`
- `src/components/admin/settings/password-form.tsx`
- `src/app/admin/(shell)/settings/actions.ts`

---

### Task 1: Add the fail-closed Neon foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/db/index.ts`
- Create: `src/lib/db/runtime.ts`
- Create: `tests/db-runtime.test.mts`

**Interfaces:**
- Produces: `getDb(env?: NodeJS.ProcessEnv): NeonHttpDatabase<typeof schema>`
- Produces: `hasDatabaseUrl(env?: NodeJS.ProcessEnv): boolean` and `requireDatabaseUrl(env): string` from a pure module safe to import in Node tests.
- Consumes later: all admin, public-content, audit, inquiry, and media repositories.

- [ ] **Step 1: Install exact dependencies and scripts**

Run:

```bash
npm install next-auth@5.0.0-beta.31 @neondatabase/serverless@1.1.0 drizzle-orm@0.45.2 @vercel/blob@2.6.1 cloudflare@7.0.0 @linear/sdk@88.1.0 zod@4.4.3
npm install --save-dev drizzle-kit@0.31.10 dotenv-cli@11.0.0 tsx
```

Add scripts:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "dotenv -e .env.local -- tsx scripts/migrate-neon.mts",
  "db:seed": "dotenv -e .env.local -- tsx scripts/seed-neon.mts"
}
```

- [ ] **Step 2: Write the failing DB runtime test**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { hasDatabaseUrl, requireDatabaseUrl } from "../src/lib/db/runtime.ts";

test("database configuration is explicit", () => {
  assert.equal(hasDatabaseUrl({}), false);
  assert.equal(hasDatabaseUrl({ DATABASE_URL: "postgresql://example" }), true);
});

test("database access fails closed without DATABASE_URL", () => {
  assert.throws(() => requireDatabaseUrl({}), /DATABASE_URL is not configured/);
});
```

- [ ] **Step 3: Run the focused test and verify the red state**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="database" tests/db-runtime.test.mts`

Expected: FAIL because `src/lib/db/runtime.ts` does not exist.

- [ ] **Step 4: Implement lazy Neon initialization**

Create `src/lib/db/runtime.ts`:

```ts
export function hasDatabaseUrl(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.DATABASE_URL?.trim());
}

export function requireDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not configured");
  return url;
}
```

Create `src/lib/db/index.ts`:

```ts
import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";
import { requireDatabaseUrl } from "./runtime";

type Database = NeonHttpDatabase<typeof schema>;
let cachedDb: Database | null = null;
let cachedSql: NeonQueryFunction<false, false> | null = null;

export function getDb(env: NodeJS.ProcessEnv = process.env): Database {
  const databaseUrl = requireDatabaseUrl(env);
  if (!cachedDb) {
    cachedSql = neon(databaseUrl);
    cachedDb = drizzle(cachedSql, { schema });
  }
  return cachedDb;
}
```

Create `src/lib/db/schema.ts` temporarily with `export {};` so the focused test can load; Task 2 replaces it with the complete schema.

- [ ] **Step 5: Run the focused and baseline suites**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="database" tests/db-runtime.test.mts`

Expected: PASS.

Run: `npm test`

Expected: existing suite remains green.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/db/index.ts src/lib/db/runtime.ts src/lib/db/schema.ts tests/db-runtime.test.mts
git commit -m "feat: add fail-closed Neon foundation"
```

---

### Task 2: Define and migrate the Neon schema

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: `database/migrations/0001_vercel_admin_platform.sql`
- Create: `scripts/migrate-neon.mts`
- Create: `scripts/seed-neon.mts`
- Create: `tests/admin-users.test.mts`

**Interfaces:**
- Produces: `adminUsers`, `auditLogs`, `inquiries`, `inquiryTypes`, `inquirySubtypes`, `workItems`, `insights`, `testimonials`, `experts`, `stats`, `mediaAssets`.
- Produces: `normalizeAdminEmail(email: string): string` and `canDeactivateAdmin(activeCount: number, targetActive: boolean): boolean`.

- [ ] **Step 1: Write pure administrator policy tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { canDeactivateAdmin, normalizeAdminEmail } from "../src/lib/admin/admin-users.ts";

test("administrator emails are normalized", () => {
  assert.equal(normalizeAdminEmail(" Team@Example.COM "), "team@example.com");
});

test("the final active administrator cannot be deactivated", () => {
  assert.equal(canDeactivateAdmin(1, true), false);
  assert.equal(canDeactivateAdmin(2, true), true);
  assert.equal(canDeactivateAdmin(1, false), true);
});
```

- [ ] **Step 2: Verify the test fails**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="administrator" tests/admin-users.test.mts`

Expected: FAIL because `src/lib/admin/admin-users.ts` does not exist.

- [ ] **Step 3: Define tables with explicit constraints**

Use Drizzle `pgTable`, `uuid`, `text`, `integer`, `boolean`, `timestamp`, `jsonb`, `uniqueIndex`, and `index`. The complete `inquiries` definition must include:

```ts
export const inquiries = pgTable("inquiries", {
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("inquiries_submission_key_uidx").on(table.submissionKey),
  index("inquiries_status_idx").on(table.status),
  index("inquiries_created_at_idx").on(table.createdAt),
]);
```

Define the remaining tables with these exact columns (all tables also have UUID `id`, integer `sort_order`, boolean `is_published`, and timezone-aware `created_at`/`updated_at` unless noted):

- `admin_users`: unique normalized `email`, nullable `name`/`avatar_url`, `is_active`, `last_login_at`, timestamps; no public sorting/publishing columns.
- `audit_logs`: UUID `actor_admin_id` FK, `action`, `entity_type`, nullable `entity_id`, JSONB `metadata`, `created_at`; append-only, no sorting/publishing columns.
- `inquiry_types`: unique `value`, `label`, `sort_order`, `is_active`, timestamps; `inquiry_subtypes`: `type_id` FK with cascade, `value`, `label`, `sort_order`, `is_active`, timestamps, unique `(type_id, value)`.
- `work_items`: `client`, `title`, `category`, `accent`, `summary`, `challenge`, `solution`, JSONB string-array `results`, nullable `image_url`.
- `insights`: `tag`, `title`, display `date`, `accent`, `excerpt`, JSONB string-array `body`, unique `slug`, nullable `image_url`, nullable `inquiry_type`/`inquiry_subtype`.
- `testimonials`: `quote`, `author`, `program`, `result`.
- `experts`: `name`, `role`, `quote`, JSONB string-array `tags`, `accent`, nullable `image_url`.
- `stats`: integer `value`, `suffix`, `label`.
- `media_assets`: unique `blob_url`, `pathname`, `content_type`, integer `size_bytes`, UUID `uploaded_by` FK, `created_at`; no sorting/publishing columns.

Add database checks for the seven allowed accents, nonnegative `sort_order` and media size, and JSONB array shape for `results`, `body`, and `tags`. Typed Drizzle defaults for those arrays must be `[]`, preserving every field in `src/lib/admin/content-types.ts` exactly.

- [ ] **Step 4: Write the idempotent SQL migration**

The migration must create all eleven tables, foreign keys, status checks, unique indexes, and `updated_at` triggers. The inquiry checks are:

```sql
alter table inquiries
  add constraint inquiries_status_check
  check (status in ('new', 'in_progress', 'done'));

alter table inquiries
  add constraint inquiries_email_status_check
  check (email_status in ('pending', 'sent', 'failed'));

alter table inquiries
  add constraint inquiries_linear_status_check
  check (linear_status in ('pending', 'created', 'failed'));
```

Use `create table if not exists`, named indexes, and a reusable `set_updated_at()` trigger function so repeated Preview migration runs are safe.

- [ ] **Step 5: Implement migration and protected seed scripts**

`scripts/migrate-neon.mts` reads sorted `.sql` files and records each filename in `schema_migrations`. `scripts/seed-neon.mts` must require `ADMIN_SEED_EMAILS`, normalize each comma-separated email, and insert with `on conflict (email) do update set is_active=true`. It imports public content from `src/lib/site.ts` and upserts stable seed keys so reruns do not duplicate rows.

The email validation gate is:

```ts
const emails = (process.env.ADMIN_SEED_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

if (emails.length === 0) {
  throw new Error("ADMIN_SEED_EMAILS must contain at least one valid email");
}
```

- [ ] **Step 6: Implement pure administrator rules**

```ts
export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function canDeactivateAdmin(activeCount: number, targetActive: boolean): boolean {
  return !targetActive || activeCount > 1;
}
```

- [ ] **Step 7: Run schema checks and tests**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="administrator|database" tests/admin-users.test.mts tests/db-runtime.test.mts`

Expected: PASS.

Run: `npx tsc --noEmit`

Expected: PASS without schema type errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/db/schema.ts src/lib/admin/admin-users.ts database/migrations scripts tests/admin-users.test.mts
git commit -m "feat: define Neon admin schema"
```

---

### Task 3: Replace Supabase repositories with Neon adapters

**Files:**
- Create: `src/lib/admin/neon-data.ts`
- Create: `src/lib/admin/neon-content.ts`
- Create: `src/lib/admin/neon-inquiry-options.ts`
- Modify: `src/lib/admin/runtime-mode.ts`
- Modify: `src/lib/admin/data.ts`
- Modify: `src/lib/admin/content-data.ts`
- Modify: `src/lib/admin/inquiry-options.ts`
- Modify: `src/lib/public-content.ts`
- Modify: `tests/admin-runtime-mode.test.mts`

**Interfaces:**
- Produces: existing `AdminDataSource`, `ContentData`, and `InquiryOptionsData` contracts without screen changes.
- Produces: public readers that return only published or active rows and retain the current `site.ts` fallback.

- [ ] **Step 1: Change the runtime policy test to Neon**

```ts
test("admin data selects Neon only with DATABASE_URL", () => {
  assert.equal(resolveAdminDataMode({ DATABASE_URL: "postgresql://db" }), "neon");
  assert.equal(resolveAdminDataMode({ NODE_ENV: "production" }), "misconfigured");
  assert.equal(resolveAdminDataMode({ NODE_ENV: "development", ADMIN_DEV_BYPASS: "true" }), "mock");
  assert.equal(resolveAdminDataMode({ NODE_ENV: "production", ADMIN_DEV_BYPASS: "true" }), "misconfigured");
});
```

- [ ] **Step 2: Run the runtime test and verify it fails**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="admin data selects Neon" tests/admin-runtime-mode.test.mts`

Expected: FAIL because `resolveAdminDataMode` still returns `supabase`.

- [ ] **Step 3: Implement the fail-closed mode**

```ts
export type RuntimeEnv = Partial<Record<"NODE_ENV" | "ADMIN_DEV_BYPASS" | "DATABASE_URL", string>>;

export function resolveAdminDataMode(env: RuntimeEnv = process.env): "neon" | "mock" | "misconfigured" {
  if (env.DATABASE_URL) return "neon";
  return isAdminDevBypassEnabled(env) ? "mock" : "misconfigured";
}
```

- [ ] **Step 4: Implement inquiry mapping and filtering**

`NeonAdminData` must implement all five existing methods. Map snake-case database columns to the existing camel-case `Inquiry` shape in one `toInquiry()` function. `createInquiry` uses `onConflictDoNothing({ target: inquiries.submissionKey })`, then reads the existing row so a repeated submission returns the same inquiry.

Use `and`, `eq`, `ilike`, `or`, `desc`, `count`, and a local-midnight ISO boundary for statistics. Do not interpolate raw query text into SQL.

- [ ] **Step 5: Implement typed content and inquiry-option repositories**

Each repository must explicitly map its table fields. Deleting an inquiry type relies on the FK cascade for subtypes. Public readers apply `is_published=true` or `is_active=true` in SQL, order by `sort_order`, and return `site.ts` fallback only on empty results or a caught database error.

The accessors become:

```ts
export function getAdminData(): AdminDataSource {
  const mode = resolveAdminDataMode();
  if (mode === "neon") return neonAdminData;
  if (mode === "mock") return mock;
  throw new Error("Admin data source is not configured");
}
```

Apply the same `neon | mock | throw` structure to content and inquiry options.

- [ ] **Step 6: Run repository contract tests**

Run: `npm test`

Expected: all runtime, inquiry, content, and existing UI contract tests pass.

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin src/lib/public-content.ts tests/admin-runtime-mode.test.mts
git commit -m "feat: wire admin repositories to Neon"
```

---

### Task 4: Replace password auth with Google Auth.js and a Neon DAL

**Files:**
- Create: `src/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Modify: `src/lib/admin/auth.ts`
- Modify: `src/lib/admin/auth-actions.ts`
- Modify: `src/proxy.ts`
- Modify: `src/app/admin/login/page.tsx`
- Create: `tests/admin-auth-policy.test.mts`
- Modify: `tests/proxy-runtime-contract.test.mts`

**Interfaces:**
- Produces: `auth`, `handlers`, `signIn`, `signOut` from `src/auth.ts`.
- Produces: `getAdminSession(): Promise<AdminIdentity | null>`.
- Produces: `requireAdmin()` redirect guard and `requireAdminAction()` throwing mutation guard.

- [ ] **Step 1: Write source-level security contracts**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const authSource = readFileSync(join(process.cwd(), "src/lib/admin/auth.ts"), "utf8");
const proxySource = readFileSync(join(process.cwd(), "src/proxy.ts"), "utf8");

test("secure admin checks query the active Neon administrator", () => {
  assert.match(authSource, /adminUsers/);
  assert.match(authSource, /isActive/);
  assert.match(authSource, /eq\(adminUsers\.email/);
});

test("Proxy performs no database query", () => {
  assert.doesNotMatch(proxySource, /getDb|adminUsers|DATABASE_URL/);
  assert.match(proxySource, /auth/);
});
```

- [ ] **Step 2: Verify the auth tests fail**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="secure admin|Proxy performs" tests/admin-auth-policy.test.mts tests/proxy-runtime-contract.test.mts`

Expected: FAIL against the Supabase implementation.

- [ ] **Step 3: Configure Auth.js Google login**

`src/auth.ts` must use `Google` provider and JWT sessions. In `signIn`, reject missing or unverified email, normalize it, and query `admin_users` with `is_active=true`. In `jwt`, store only `adminId`; in `session`, expose `adminId` and the provider-supplied name/image needed by the UI.

```ts
export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login", error: "/admin/login" },
  callbacks: {
    async signIn({ profile }) {
      const email = typeof profile?.email === "string" ? profile.email.trim().toLowerCase() : "";
      const verified = (profile as { email_verified?: unknown } | undefined)?.email_verified === true;
      if (!email || !verified) return false;
      const [admin] = await getDb().select({ id: adminUsers.id }).from(adminUsers)
        .where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true))).limit(1);
      return Boolean(admin);
    },
    async jwt({ token }) {
      if (!token.email) return token;
      const email = token.email.trim().toLowerCase();
      const [admin] = await getDb().select({ id: adminUsers.id }).from(adminUsers)
        .where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true))).limit(1);
      token.adminId = admin?.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.adminId = typeof token.adminId === "string" ? token.adminId : undefined;
      return session;
    },
  },
});
```

- [ ] **Step 4: Implement the secure DAL**

`getAdminSession()` calls `auth()`, extracts the normalized email, and re-queries Neon on every secure boundary so deactivation takes effect without waiting for the JWT to expire. Return `{ id, email, name, avatarUrl }` only.

`requireAdmin()` redirects to `/admin/login`; `requireAdminAction()` throws `Forbidden` before any data source call.

- [ ] **Step 5: Replace login and logout actions**

```ts
"use server";

import { signIn, signOut } from "@/auth";

export async function signInAdmin(): Promise<void> {
  await signIn("google", { redirectTo: "/admin" });
}

export async function signOutAdmin(): Promise<void> {
  await signOut({ redirectTo: "/admin/login" });
}
```

The login page contains one `Google로 로그인` button and no email/password inputs.

- [ ] **Step 6: Make Proxy optimistic only**

Wrap Proxy with Auth.js, allow `/admin/login` and `/api/auth/*`, redirect missing sessions from other `/admin/*` paths, and do not import the DB DAL. Keep `matcher: ["/admin/:path*"]`.

- [ ] **Step 7: Run auth tests and production build**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="admin|Proxy" tests/admin-auth-policy.test.mts tests/proxy-runtime-contract.test.mts tests/admin-actions-auth.test.mts`

Expected: PASS.

Run: `npm run build`

Expected: PASS with missing runtime secrets handled lazily at build time.

- [ ] **Step 8: Commit**

```bash
git add src/auth.ts src/app/api/auth src/lib/admin/auth.ts src/lib/admin/auth-actions.ts src/proxy.ts src/app/admin/login/page.tsx tests
git commit -m "feat: add Google admin authentication"
```

---

### Task 5: Add team management and audit logging

**Files:**
- Modify: `src/lib/admin/admin-users.ts`
- Create: `src/app/admin/(shell)/settings/team-actions.ts`
- Create: `src/components/admin/settings/team-manager.tsx`
- Modify: `src/app/admin/(shell)/settings/page.tsx`
- Modify: `tests/helpers/admin-action-policy.mts`
- Modify: `tests/admin-actions-auth.test.mts`

**Interfaces:**
- Produces: `listAdminUsers`, `addAdminUser`, `setAdminUserActive`, `writeAuditLog`.
- Produces actions: `addTeamMemberAction(formData)`, `setTeamMemberActiveAction(id, active)`.

- [ ] **Step 1: Extend the action guard detector**

Add `addAdminUser(`, `setAdminUserActive(`, and `writeAuditLog(` to `MUTATION_BOUNDARIES`, then add a fixture proving an unguarded team action is rejected.

```ts
test("team mutations require the shared action guard", () => {
  const source = `export async function addMember() { await addAdminUser("a@example.com"); }`;
  assert.deepEqual(findAdminActionGuardViolations(source), ["addMember"]);
});
```

- [ ] **Step 2: Verify the detector test fails**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="team mutations" tests/admin-actions-auth.test.mts`

Expected: FAIL until the new boundaries are registered.

- [ ] **Step 3: Implement team repository operations**

`addAdminUser` normalizes and validates the email, upserts an active row, and writes an audit record in the same database transaction. `setAdminUserActive` locks or counts active rows before deactivation and rejects the final active administrator with `마지막 활성 관리자는 비활성화할 수 없습니다.`.

- [ ] **Step 4: Implement guarded Server Actions**

Each action begins with `const actor = await requireAdminAction()`, validates only the requested email or target ID/boolean, calls the repository, and `revalidatePath("/admin/settings")`.

- [ ] **Step 5: Replace password settings with the team manager**

Render account identity, active member count, add-by-email form, responsive member list, and active toggle. Do not display passwords or OAuth tokens. Disable the current row's deactivation control when it is the only active member.

- [ ] **Step 6: Run tests and mobile source contract**

Run: `npm test`

Expected: all action guard and admin policy tests pass.

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin/admin-users.ts src/app/admin/\(shell\)/settings src/components/admin/settings tests
git commit -m "feat: add administrator team management"
```

---

### Task 6: Make inquiry persistence idempotent and delivery-aware

**Files:**
- Modify: `src/lib/admin/types.ts`
- Modify: `src/lib/admin/data.ts`
- Modify: `src/lib/admin/neon-data.ts`
- Modify: `src/lib/inquiries/validation.ts`
- Modify: `src/lib/inquiry-actions.ts`
- Create: `src/lib/inquiries/delivery.ts`
- Create: `tests/inquiry-delivery.test.mts`
- Modify: `tests/inquiry-validation.test.mts`

**Interfaces:**
- Produces: `DeliveryStatus = "pending" | "sent" | "failed"` and `LinearDeliveryStatus = "pending" | "created" | "failed"`.
- Produces: `DeliveryAttempt = { ok: true; externalId: string; skipped?: boolean; url?: string } | { ok: false; errorCode: string }`.
- Changes: `createInquiry(input: NewInquiry, submissionKey: string): Promise<{ inquiry: Inquiry; created: boolean }>`.
- Produces: `deliverInquiry(inquiryId: string): Promise<void>`.

- [ ] **Step 1: Write failing state-transition tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { deliveryPatch } from "../src/lib/inquiries/delivery.ts";

test("email success stores the provider message id", () => {
  assert.deepEqual(deliveryPatch("email", { ok: true, externalId: "msg_1" }), {
    emailStatus: "sent",
    emailMessageId: "msg_1",
    emailError: null,
  });
});

test("delivery errors are sanitized", () => {
  assert.deepEqual(deliveryPatch("linear", { ok: false, errorCode: "throttled" }), {
    linearStatus: "failed",
    linearError: "throttled",
  });
});
```

- [ ] **Step 2: Verify the delivery tests fail**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="delivery|email success" tests/inquiry-delivery.test.mts`

Expected: FAIL because delivery orchestration does not exist.

- [ ] **Step 3: Add delivery fields and repository methods**

Extend `Inquiry` with submission, email, and Linear fields and define `DeliveryAttempt` exactly as listed under Interfaces. Add repository methods `updateInquiryDelivery(id, patch)` and `findInquiryBySubmissionKey(key)`. Keep public form inputs limited to the existing five user fields plus `honeypot`, `startedAt`, and `submissionKey`.

- [ ] **Step 4: Replace manual validation with a Zod schema**

Use `z.object` with the existing hard limits, require type/subtype/message, and refine contact as email-or-seven-digits. Reject `startedAt` values less than 800 ms before submission. Return the existing Korean public error shape.

- [ ] **Step 5: Persist once, deliver once**

`submitInquiry` validates the UUID submission key, calls the new idempotent create method, and calls `deliverInquiry` only when `created === true`. A repeated submission returns `{ ok: true }` without creating a second row or a second Linear issue.

`deliverInquiry` loads the stored inquiry and runs Cloudflare and Linear attempts with `Promise.allSettled`; each result updates only its own delivery columns.

- [ ] **Step 6: Run inquiry tests**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="inquiry|delivery" tests/inquiry-delivery.test.mts tests/inquiry-validation.test.mts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin src/lib/inquiries src/lib/inquiry-actions.ts tests
git commit -m "feat: persist idempotent inquiry deliveries"
```

---

### Task 7: Replace Resend with Cloudflare Email Service

**Files:**
- Create: `src/lib/integrations/cloudflare-email.ts`
- Modify: `src/lib/inquiries/email-message.ts`
- Create: `tests/cloudflare-email.test.mts`
- Modify: `tests/inquiry-email-message.test.mts`

**Interfaces:**
- Produces: `sendInquiryEmail(inquiry: Inquiry): Promise<DeliveryAttempt>`.
- Produces: `mapCloudflareEmailResponse(response): DeliveryAttempt`.
- Consumes: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `INQUIRY_NOTIFICATION_TO`, `INQUIRY_NOTIFICATION_FROM`.

- [ ] **Step 1: Write Cloudflare mapping tests**

```ts
test("delivered recipients produce a sent result", () => {
  assert.deepEqual(mapCloudflareEmailResponse({
    message_id: "message-1",
    delivered: ["ops@example.com"],
    queued: [],
    permanent_bounces: [],
  }), { ok: true, externalId: "message-1" });
});

test("queued-only responses remain retryable", () => {
  assert.deepEqual(mapCloudflareEmailResponse({
    message_id: "message-2",
    delivered: [],
    queued: ["ops@example.com"],
    permanent_bounces: [],
  }), { ok: false, errorCode: "queued" });
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="Cloudflare|queued-only|delivered recipients" tests/cloudflare-email.test.mts`

Expected: FAIL because the adapter is missing.

- [ ] **Step 3: Build safe HTML and text messages**

Keep the current text body and add escaped HTML. Include inquiry type, subtype, sender, contact, created time, message, and admin detail URL. Set `reply_to` only when contact is a valid email. Do not include secrets or provider errors in either body.

- [ ] **Step 4: Implement the Cloudflare SDK call**

Initialize `new Cloudflare({ apiToken })` inside the send function after validating all server env. Call `client.emailSending.send({ account_id, from, to, subject, html, text, reply_to })`. Map delivered/queued/bounce results and return only the sanitized `DeliveryAttempt`.

- [ ] **Step 5: Run email tests and lint**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="email|Cloudflare|queued" tests/cloudflare-email.test.mts tests/inquiry-email-message.test.mts`

Expected: PASS.

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/integrations/cloudflare-email.ts src/lib/inquiries/email-message.ts tests
git commit -m "feat: send inquiry alerts with Cloudflare"
```

---

### Task 8: Create and retry Linear inquiry issues

**Files:**
- Create: `src/lib/integrations/linear.ts`
- Modify: `src/lib/inquiries/delivery.ts`
- Create: `src/app/admin/(shell)/inquiries/delivery-actions.ts`
- Modify: `src/app/admin/(shell)/inquiries/[id]/page.tsx`
- Create: `tests/linear-integration.test.mts`

**Interfaces:**
- Produces: `buildLinearIssueInput(inquiry, config)`.
- Produces: `createLinearIssue(inquiry): Promise<DeliveryAttempt>`; successful results may include the optional `url` already defined by `DeliveryAttempt`.
- Produces actions: `retryInquiryEmail(id)` and `retryInquiryLinear(id)`.

- [ ] **Step 1: Write payload and idempotency tests**

```ts
test("Linear issue payload contains the inquiry reference", () => {
  const input = buildLinearIssueInput(inquiry, {
    teamId: "team-1",
    projectId: "project-1",
    adminBaseUrl: "https://kpopsoft.com/admin/inquiries",
  });
  assert.equal(input.teamId, "team-1");
  assert.match(input.title, /교육 문의/);
  assert.match(input.description, new RegExp(inquiry.id));
  assert.equal(input.projectId, "project-1");
});

test("an existing Linear issue skips creation", async () => {
  const result = await createLinearIssue({ ...inquiry, linearIssueId: "existing" });
  assert.deepEqual(result, { ok: true, externalId: "existing", skipped: true });
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="Linear issue|existing Linear" tests/linear-integration.test.mts`

Expected: FAIL because the adapter is missing.

- [ ] **Step 3: Implement Linear payload and SDK call**

Return the `skipped` success result before reading environment variables or constructing a client whenever `inquiry.linearIssueId` already exists. Otherwise use `new LinearClient({ apiKey })` and `client.createIssue({ teamId, projectId, title, description })`. Await `payload.issue`; require both `id` and `url`. Do not log the SDK error object because it may include query variables containing inquiry text; return a stable code such as `unauthorized`, `throttled`, or `provider_error`.

- [ ] **Step 4: Add secured retry actions**

Both actions call `requireAdminAction()` first, read the target inquiry from Neon, retry only the requested provider, write an audit record, and revalidate the detail page. Linear retry must return success without calling the provider when `linearIssueId` is already present.

- [ ] **Step 5: Show delivery status in the inquiry detail UI**

Render email and Linear status badges, last sanitized error, retry buttons for failed states, and an external link when `linearIssueUrl` exists. Maintain the mobile DOM order: inquiry content, internal memo, delivery status.

- [ ] **Step 6: Run focused and full tests**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="Linear|delivery|admin" tests/linear-integration.test.mts tests/inquiry-delivery.test.mts tests/admin-actions-auth.test.mts`

Expected: PASS.

Run: `npm test`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/integrations/linear.ts src/lib/inquiries/delivery.ts src/app/admin/\(shell\)/inquiries tests
git commit -m "feat: sync inquiries to Linear"
```

---

### Task 9: Move authenticated media uploads to Vercel Blob

**Files:**
- Create: `src/lib/media/blob.ts`
- Create: `src/app/api/admin/uploads/route.ts`
- Modify: `src/components/admin/content/image-upload.tsx`
- Create: `tests/blob-upload-policy.test.mts`

**Interfaces:**
- Produces: `validateImageUpload({ contentType, size }): { ok: true } | { ok: false; error: string }`.
- Produces: authenticated `POST /api/admin/uploads` using `handleUpload`.

- [ ] **Step 1: Write upload policy tests**

```ts
test("only safe image types under 10 MB are accepted", () => {
  assert.deepEqual(validateImageUpload({ contentType: "image/webp", size: 10 * 1024 * 1024 }), { ok: true });
  assert.equal(validateImageUpload({ contentType: "image/svg+xml", size: 100 }).ok, false);
  assert.equal(validateImageUpload({ contentType: "image/png", size: 10 * 1024 * 1024 + 1 }).ok, false);
});
```

- [ ] **Step 2: Verify the policy test fails**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="safe image types" tests/blob-upload-policy.test.mts`

Expected: FAIL because the Blob policy is missing.

- [ ] **Step 3: Implement shared upload validation**

```ts
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

export function validateImageUpload(input: { contentType: string; size: number }) {
  if (!TYPES.has(input.contentType)) return { ok: false as const, error: "JPG · PNG · WEBP 형식만 올릴 수 있어요." };
  if (input.size > MAX_BYTES) return { ok: false as const, error: "이미지 용량은 10MB 이하여야 해요." };
  return { ok: true as const };
}
```

- [ ] **Step 4: Implement the authenticated token endpoint**

The Route Handler calls `requireAdminAction()` before `handleUpload`. In `onBeforeGenerateToken`, validate pathname prefix (`experts/`, `work/`, or `insights/`), allowed content types, and 10 MB maximum. In `onUploadCompleted`, persist `media_assets` with uploader ID and sanitized metadata.

- [ ] **Step 5: Replace the client uploader**

Use `upload()` from `@vercel/blob/client`, a UUID pathname under the supplied content category, `access: "public"`, and `handleUploadUrl: "/api/admin/uploads"`. Keep the existing preview, hidden `imageUrl`, loading, removal, and Korean error behavior.

- [ ] **Step 6: Run policy, auth, and build checks**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="image|upload|admin" tests/blob-upload-policy.test.mts tests/admin-actions-auth.test.mts`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/media src/app/api/admin/uploads src/components/admin/content/image-upload.tsx tests/blob-upload-policy.test.mts
git commit -m "feat: upload admin media to Vercel Blob"
```

---

### Task 10: Remove Supabase and Resend, verify, document, and preview-deploy

**Files:**
- Remove: Supabase and old email/password files listed in File Structure.
- Modify: `package.json`, `package-lock.json`
- Create: `tests/supabase-removal-contract.test.mts`
- Modify: `docs/개발상태.md`
- Modify: `docs/어드민기획.md`

**Interfaces:**
- Produces: production runtime with zero Supabase/Resend imports or environment-variable requirements.
- Produces: evidence-backed Preview deployment report and explicit Production HOLD list.

- [ ] **Step 1: Write the removal contract**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("production source has no Supabase or Resend runtime dependency", () => {
  const files = execFileSync("rg", ["--files", "src"], { encoding: "utf8" }).trim().split("\n");
  const source = files.map((file) => readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(source, /@supabase|SUPABASE_|RESEND_|from ["']resend["']/);
});
```

- [ ] **Step 2: Verify the contract fails before removal**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="no Supabase" tests/supabase-removal-contract.test.mts`

Expected: FAIL while the old files and packages remain.

- [ ] **Step 3: Remove replaced runtime code and packages**

Run:

```bash
npm uninstall @supabase/ssr @supabase/supabase-js resend
```

Delete only the replaced files listed above. Remove obsolete Supabase and Resend environment names from docs and runtime tests. Preserve SQL history under `supabase/migrations/` as migration provenance unless a later cleanup issue explicitly removes it.

- [ ] **Step 4: Run the complete local verification gate**

Run:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 5: Provision Preview integrations without exposing secrets**

Through the Vercel project dashboard or Marketplace, connect Neon Free and Blob, then configure Preview-only values for:

```text
DATABASE_URL
BLOB_READ_WRITE_TOKEN
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
INQUIRY_NOTIFICATION_TO
INQUIRY_NOTIFICATION_FROM
LINEAR_API_KEY
LINEAR_TEAM_ID
LINEAR_PROJECT_ID
NEXT_PUBLIC_SITE_URL
```

Do not print values to terminal output or commit `.env.local`.

- [ ] **Step 6: Apply Preview migration and protected seed**

Set `ADMIN_SEED_EMAILS` only for the one-time seed command from the reviewed `kpopsoft-hub` member source. Run migration and seed against Preview, then remove the seed variable if it is no longer needed.

Expected: at least one active administrator and all current public content rows exist; no raw team list appears in the repository.

- [ ] **Step 7: Deploy and verify Preview**

Deploy a Preview build, then verify:

```text
GET / => 200
GET /admin => redirect to /admin/login when signed out
registered Google account => /admin
unregistered Google account => blocked
public inquiry => one Neon row
Cloudflare => one message delivered to verified kpopsoft@gmail.com
Linear => one linked issue
forced email failure => inquiry remains and retry appears
forced Linear failure => inquiry remains and retry appears
JPEG/PNG/WebP <= 10 MB => Blob upload succeeds
SVG or >10 MB => upload rejected
390px viewport => no horizontal overflow on public or admin pages
```

- [ ] **Step 8: Update project status docs**

Record exact test commands, Preview URL, verified flows, remaining HOLD items, Cloudflare public-beta risk, Linear 250-issue free cap, Blob/Neon free caps, education template deferral, and Vercel Hobby commercial-use restriction. Do not mark Production ready while Google, Cloudflare, Linear, or Vercel plan prerequisites remain unresolved.

- [ ] **Step 9: Commit the completed migration**

```bash
git add package.json package-lock.json src tests docs
git add -u
git commit -m "feat: complete Vercel admin platform migration"
```

- [ ] **Step 10: Run final branch review**

Run:

```bash
git status --short
git log --oneline --decorate -12
git diff HEAD~10..HEAD --check
```

Expected: clean worktree, ten reviewer-sized commits, and no whitespace errors.

Request an independent code review, address findings, rerun the full gate, and only then choose whether to push the branch or promote the verified Preview deployment.
