# Integration Foundation and Linear Mirror Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the signed admin↔Hub integration foundation and mirror Linear projects and issues into Hub without enabling Hub-originated Linear writes.

**Architecture:** Homepage/Neon owns webhook receipts, work jobs, cursors, entity links, and Linear API credentials. It emits versioned HMAC-signed events to a server-only Hub endpoint, where a Supabase service-role client idempotently upserts external mirrors; authenticated Hub users only read those mirrors through RLS-protected queries.

**Tech Stack:** Next.js 16.2.10 Route Handlers, Node crypto, Drizzle/Neon, `@linear/sdk`, Supabase JS, Vitest, Node test runner, Playwright.

## Global Constraints

- Execute after `2026-07-19-platform-baseline-billing-preview.md` establishes clean worktrees.
- Before Task 1, invoke `superpowers:using-git-worktrees` and create homepage branch `codex/integration-foundation-linear-mirror` from the pushed baseline.
- Hub tasks run only in branch `codex/hub-linear-mirror`; never stage Hub files from the homepage worktree.
- Contract version is exactly `2026-07-19.v1`.
- Direction-specific HMAC keys are server-only and never logged.
- Store nonce and event IDs in durable databases; do not use process memory for replay protection.
- Linear remains one `Kpopsoft` team and every mirror row includes `linear_team_id`.
- Linear is the source of truth for issue title, status, assignee, priority, and due date.
- Hub project CRUD must continue working when Linear or admin integration is unavailable.
- `LINEAR_WRITE_ENABLED=false` throughout this plan.
- Do not send inquiry contact details or full messages to Linear.

---

### Task 1: Add the Versioned HMAC Contract

**Files:**
- Create: `src/lib/integrations/contract.ts`
- Create: `src/lib/integrations/hmac.ts`
- Create: `tests/integration-hmac.test.mts`

**Interfaces:**
- Produces: `IntegrationEventEnvelope<T>`, `canonicalRequest()`, `signInternalRequest()`, and `verifyInternalRequest()`.

- [ ] **Step 1: Write the failing signature and replay-window tests**

```ts
test("signs and verifies the canonical request", () => {
  const signed = signInternalRequest({
    method: "POST",
    path: "/api/internal/integrations/events",
    body: '{"eventId":"evt-1"}',
    timestamp: "2026-07-19T03:00:00.000Z",
    nonce: "nonce-1",
    idempotencyKey: "evt-1",
    keyId: "v1",
    secret: Buffer.alloc(32, 7).toString("base64"),
  });
  assert.equal(
    verifyInternalRequest({
      ...signed,
      method: "POST",
      path: "/api/internal/integrations/events",
      body: '{"eventId":"evt-1"}',
      now: new Date("2026-07-19T03:02:00.000Z"),
      keys: { v1: Buffer.alloc(32, 7).toString("base64") },
    }).idempotencyKey,
    "evt-1",
  );
});

test("rejects timestamps older than five minutes", () => {
  assert.throws(() => verifyInternalRequest(staleRequest), /stale_request/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --test-name-pattern="canonical request|five minutes"`

Expected: FAIL because the contract modules do not exist.

- [ ] **Step 3: Implement the exact contract**

```ts
export type IntegrationEventEnvelope<T> = {
  contractVersion: "2026-07-19.v1";
  eventId: string;
  eventType: string;
  occurredAt: string;
  source: "linear" | "drive" | "admin" | "billing";
  aggregateId: string;
  payload: T;
};

export function canonicalRequest(input: {
  method: string;
  path: string;
  timestamp: string;
  nonce: string;
  body: string;
}): string {
  const digest = createHash("sha256").update(input.body).digest("hex");
  return [input.method.toUpperCase(), input.path, input.timestamp, input.nonce, digest].join("\n");
}
```

`signInternalRequest` returns the six `x-kpopsoft-*` header values.
`verifyInternalRequest` requires contract `2026-07-19.v1`, a known key ID,
constant-time signature equality, and timestamp distance at most 300 seconds.

- [ ] **Step 4: Run the focused tests**

Run: `npm test -- --test-name-pattern="canonical request|five minutes"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/integrations/contract.ts src/lib/integrations/hmac.ts tests/integration-hmac.test.mts
git commit -m "feat: add signed integration contract"
```

### Task 2: Add Durable Integration Storage in Neon

**Files:**
- Create: `database/migrations/0005_integration_foundation.sql`
- Modify: `src/lib/db/schema.ts`
- Create: `src/lib/integrations/jobs.ts`
- Create: `tests/integration-migration-contract.test.mts`

**Interfaces:**
- Consumes: `IntegrationEventEnvelope<T>`.
- Produces: `enqueueIntegrationJob()`, `claimIntegrationJobs()`, `completeIntegrationJob()`, and tables `integration_webhook_receipts`, `integration_jobs`, `integration_cursors`, `integration_entity_links`.

- [ ] **Step 1: Write the failing migration contract**

```ts
for (const table of [
  "integration_webhook_receipts",
  "integration_jobs",
  "integration_cursors",
  "integration_entity_links",
]) {
  assert.match(migration, new RegExp(`create table if not exists ${table}`));
}
assert.match(migration, /integration_jobs_idempotency_key_uidx/);
assert.match(migration, /integration_webhook_receipts_provider_event_uidx/);
```

- [ ] **Step 2: Run the test**

Run: `npm test -- --test-name-pattern="integration foundation migration"`

Expected: FAIL because migration `0005` is absent.

- [ ] **Step 3: Create the additive schema**

The migration creates:

```sql
create table if not exists integration_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  idempotency_key text not null,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending','running','succeeded','retry_wait','needs_attention','canceled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error_code text,
  last_completed_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists integration_jobs_idempotency_key_uidx
  on integration_jobs(idempotency_key);
```

Receipts have unique `(provider, provider_event_id)`. Cursors have unique
`(provider, cursor_name)`. Entity links have unique
`(source_system, source_type, source_id, target_system, target_type)`.

- [ ] **Step 4: Implement atomic job claiming**

```ts
export async function claimIntegrationJobs(limit = 20) {
  return getDb().execute(sql`
    with candidates as (
      select id from integration_jobs
      where status in ('pending','retry_wait') and next_attempt_at <= now()
      order by created_at
      for update skip locked
      limit ${limit}
    )
    update integration_jobs job
    set status = 'running', attempt_count = attempt_count + 1, updated_at = now()
    from candidates
    where job.id = candidates.id
    returning job.*
  `);
}
```

- [ ] **Step 5: Run and commit**

```bash
npm test -- --test-name-pattern="integration foundation migration"
git add database/migrations/0005_integration_foundation.sql src/lib/db/schema.ts src/lib/integrations/jobs.ts tests/integration-migration-contract.test.mts
git commit -m "feat: add durable integration work queue"
```

### Task 3: Receive Linear Webhooks and Backfill Read Models

**Files:**
- Create: `src/lib/integrations/linear/webhook.ts`
- Create: `src/lib/integrations/linear/sync.ts`
- Create: `src/app/api/webhooks/linear/route.ts`
- Create: `src/app/api/internal/integrations/linear/backfill/route.ts`
- Modify: `src/lib/integrations/linear.ts`
- Modify: `tests/linear-integration.test.mts`
- Create: `tests/linear-webhook.test.mts`

**Interfaces:**
- Produces: `verifyLinearWebhook()`, `mapLinearProject()`, `mapLinearIssue()`, and `enqueueLinearBackfill()`.

- [ ] **Step 1: Write failing privacy and webhook tests**

```ts
test("inquiry issue payload excludes contact and full message", () => {
  const input = buildLinearIssueInput(inquiry, config);
  assert.doesNotMatch(input.description, /hello@example\.com/);
  assert.doesNotMatch(input.description, /교육 일정과 견적을 요청합니다/);
  assert.match(input.description, /관리자 페이지/);
});

test("rejects a Linear webhook with an invalid signature", async () => {
  const result = verifyLinearWebhook({
    body: "{}",
    signature: "invalid",
    secret: "webhook-secret",
  });
  assert.equal(result.ok, false);
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- --test-name-pattern="excludes contact|invalid signature"`

Expected: privacy test FAIL against the current payload and webhook module missing.

- [ ] **Step 3: Implement minimal Linear mappings**

```ts
export type LinearProjectMirrorPayload = {
  linearTeamId: string;
  linearProjectId: string;
  name: string;
  state: string | null;
  targetDate: string | null;
  url: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type LinearIssueMirrorPayload = {
  linearTeamId: string;
  linearIssueId: string;
  linearProjectId: string | null;
  identifier: string;
  title: string;
  statusId: string | null;
  statusName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  priority: number;
  dueDate: string | null;
  url: string;
  updatedAt: string;
  archivedAt: string | null;
};
```

The webhook route verifies the provider signature, inserts a receipt first,
enqueues one idempotent job, and returns `200` without doing provider I/O.
Backfill uses cursor pagination and enqueues the same payload shapes.

- [ ] **Step 4: Run and commit**

```bash
npm test -- --test-name-pattern="Linear"
git add src/lib/integrations/linear.ts src/lib/integrations/linear src/app/api/webhooks/linear src/app/api/internal/integrations/linear tests/linear-integration.test.mts tests/linear-webhook.test.mts
git commit -m "feat: ingest Linear project and issue changes"
```

### Task 4: Add the Hub Internal Event Inbox

**Files (Hub repository):**
- Create: `supabase/migrations/20260719120000_add_integration_mirrors.sql`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/integrations/contract.ts`
- Create: `src/lib/integrations/verify-request.ts`
- Create: `src/app/api/internal/integrations/events/route.ts`
- Create: `tests/unit/integration-event-route.test.ts`
- Create: `tests/unit/integration-mirror-schema.test.ts`

**Interfaces:**
- Consumes: homepage `IntegrationEventEnvelope<T>` and HMAC headers.
- Produces: service-role-only idempotent upserts into `integration_inbox_events`, `linear_project_mirrors`, `linear_issue_mirrors`, and `external_project_links`.

- [ ] **Step 1: Write the failing route test**

```ts
it("rejects an unsigned integration event", async () => {
  const response = await POST(new Request("http://hub/api/internal/integrations/events", {
    method: "POST",
    body: JSON.stringify({ eventId: "evt-1" }),
  }));
  expect(response.status).toBe(401);
});
```

- [ ] **Step 2: Run the test**

Run: `pnpm test -- integration-event-route`

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Add the server-only admin client**

```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Supabase admin client is not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] **Step 4: Add the inbox transaction contract**

The migration creates unique `event_id` and `(key_id, nonce)` constraints.
The route validates HMAC before JSON parsing, inserts the inbox row, and
upserts mirror data only when `payload.updatedAt` is newer than the stored
provider timestamp. Duplicate `event_id` returns `200 { ok: true, duplicate: true }`.

- [ ] **Step 5: Run and commit in the Hub repository**

```bash
pnpm test -- integration
git add supabase/migrations/20260719120000_add_integration_mirrors.sql src/lib/supabase/admin.ts src/lib/integrations src/app/api/internal/integrations/events tests/unit/integration-event-route.test.ts tests/unit/integration-mirror-schema.test.ts
git commit -m "feat: add signed integration mirror inbox"
gh auth switch -h github.com -u h19h29-design
git push -u origin codex/hub-linear-mirror
```

### Task 5: Show Linear Mirrors and Link Projects in Hub

**Files (Hub repository):**
- Modify: `src/lib/data/types.ts`
- Modify: `src/lib/data/projects.ts`
- Create: `src/lib/data/linear-mirrors.ts`
- Create: `src/features/projects/linear-project-panel.tsx`
- Modify: `src/app/(app)/projects/page.tsx`
- Modify: `src/app/(app)/projects/[id]/page.tsx`
- Create: `tests/unit/linear-project-panel.test.tsx`
- Create: `tests/e2e/linear-mirror.spec.ts`

**Interfaces:**
- Consumes: `linear_project_mirrors`, `linear_issue_mirrors`, `external_project_links`.
- Produces: `getUnlinkedLinearProjects()`, `getLinearIssuesForHubProject()`, source filter `all|hub|linear`, and read-only `Linear 업무` tab.

- [ ] **Step 1: Write the failing panel test**

```tsx
it("shows mirrored issues and the Linear source link", () => {
  render(<LinearProjectPanel project={projectMirror} issues={[issueMirror]} />);
  expect(screen.getByText("KPO-62")).toBeTruthy();
  expect(screen.getByText("구독료 관리시스템")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Linear에서 열기" })).toHaveAttribute("href", issueMirror.url);
});
```

- [ ] **Step 2: Run the test**

Run: `pnpm test -- linear-project-panel`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Add exact Hub mirror types**

```ts
export type HubLinearIssue = {
  linearIssueId: string;
  identifier: string;
  title: string;
  statusName: string | null;
  assigneeName: string | null;
  priority: number;
  dueDate: string | null;
  url: string;
  providerUpdatedAt: string;
};
```

Add `{ key: "linear", label: "Linear 업무", content: linearSection }` to
`ProjectDetailTabs`. An unlinked list offers `기존 프로젝트 연결` and
`Hub 프로젝트로 가져오기`; these actions only create Hub/link records and do
not modify Linear.

- [ ] **Step 4: Run Hub gates**

```bash
pnpm test
pnpm lint
pnpm build
pnpm test:e2e -- linear-mirror.spec.ts
```

Expected: all pass at desktop and 390px mobile viewports.

- [ ] **Step 5: Commit and push**

```bash
git add src/lib/data src/features/projects/linear-project-panel.tsx 'src/app/(app)/projects/page.tsx' 'src/app/(app)/projects/[id]/page.tsx' tests/unit/linear-project-panel.test.tsx tests/e2e/linear-mirror.spec.ts
git commit -m "feat: show Linear project mirrors in Hub"
git push origin codex/hub-linear-mirror
```

### Task 6: Deliver Events, Backfill, and Verify Read-Only Rollout

**Files (Homepage repository):**
- Create: `src/lib/integrations/hub-client.ts`
- Create: `src/app/api/internal/integrations/run/route.ts`
- Create: `tests/integration-hub-client.test.mts`
- Modify: `vercel.json`
- Modify: `docs/superpowers/specs/2026-07-19-kpopsoft-platform-orchestration-design.md`

**Interfaces:**
- Consumes: claimed integration jobs and Hub inbox endpoint.
- Produces: signed delivery, retry classification, dry-run/backfill report, and Preview rollout evidence.

- [ ] **Step 1: Write the failing delivery test**

```ts
test("retries 429 and 5xx without logging the response body", async () => {
  const result = await deliverHubEvent(event, {
    fetch: async () => new Response("secret provider text", { status: 503 }),
    now: () => new Date("2026-07-19T03:00:00Z"),
  });
  assert.deepEqual(result, { ok: false, retryable: true, errorCode: "hub_unavailable" });
});
```

- [ ] **Step 2: Run the test**

Run: `npm test -- --test-name-pattern="retries 429"`

Expected: FAIL because the client is missing.

- [ ] **Step 3: Implement fail-closed delivery**

`deliverHubEvent` signs the exact serialized body, sets
`Cache-Control: no-store`, uses a 10-second abort timeout, maps 429/5xx to
`retry_wait`, maps 401/403 to `needs_attention`, and never stores response
bodies.

- [ ] **Step 4: Add the protected runner cron**

Add only:

```json
{
  "path": "/api/internal/integrations/run",
  "schedule": "*/10 * * * *"
}
```

The route requires `INTEGRATIONS_ENABLED=true` and the existing protected cron
secret. It claims at most 20 jobs per run.

- [ ] **Step 5: Run dry-run and Preview smoke**

Run the Linear backfill in dry-run mode and record counts for projects,
issues, existing links, and conflicts. Then enable only:

```text
INTEGRATIONS_ENABLED=true
LINEAR_MIRROR_ENABLED=true
LINEAR_WRITE_ENABLED=false
```

Expected: Linear changes appear in Hub, duplicate webhook delivery creates no
duplicate rows, and Hub project CRUD works while Linear API is deliberately
unavailable.

- [ ] **Step 6: Run all gates, commit, and push**

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
git diff --check
git add src/lib/integrations/hub-client.ts src/app/api/internal/integrations/run/route.ts tests/integration-hub-client.test.mts vercel.json docs/superpowers/specs/2026-07-19-kpopsoft-platform-orchestration-design.md
git commit -m "feat: deliver Linear mirrors to Hub"
gh auth switch -h github.com -u kpopsoft-collab
git push -u origin codex/integration-foundation-linear-mirror
```
