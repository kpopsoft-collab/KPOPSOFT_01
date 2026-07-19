# CRM Inquiry and Project Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn public inquiries, including education applications, into an assignable CRM pipeline and idempotently convert won inquiries into linked Hub, Drive, and Linear projects.

**Architecture:** Neon remains the source for inquiries, CRM accounts/contacts, pipeline state, and conversion jobs. Conversion is a resumable saga with one durable idempotency key per inquiry and step; Hub, Drive, and Linear creation calls are independently retryable and every external ID is persisted before the next step begins.

**Tech Stack:** Next.js Server Actions and Route Handlers, Neon/Drizzle, Zod, existing signed integration APIs, Hub Supabase service-role endpoint, Node test runner, Playwright.

## Global Constraints

- Education application remains a subtype of common inquiry and may change later.
- Before Task 1, invoke `superpowers:using-git-worktrees` and create homepage branch `codex/crm-project-conversion` plus Hub branch `codex/hub-crm-conversion` from their reviewed integration baselines.
- Contract version is exactly `2026-07-19.v1`.
- Preserve normalized searchable fields plus versioned validated raw payload.
- Never store passwords, payment secrets, OAuth tokens, or unvalidated arbitrary JSON in raw payload.
- Linear receives only inquiry type, short summary, and admin deep link.
- Conversion never creates duplicate Hub projects, Drive folders, or Linear projects.
- Partial failure resumes from the last persisted successful step.
- Existing homepage inquiry submission must remain available if Hub, Drive, or Linear is down.
- `INQUIRY_CONVERSION_ENABLED=false` until the Preview end-to-end flow passes.

---

### Task 1: Expand the Inquiry Pipeline and Add CRM Storage

**Files (Homepage repository):**
- Create: `database/migrations/0008_crm_project_conversion.sql`
- Modify: `src/lib/db/schema.ts`
- Modify: `src/lib/admin/types.ts`
- Modify: `src/lib/admin/data.ts`
- Modify: `src/lib/admin/neon-data.ts`
- Modify: `src/lib/admin/neon-mappers.ts`
- Create: `tests/crm-migration-contract.test.mts`
- Modify: `tests/neon-adapters.test.mts`

**Interfaces:**
- Produces: ten-state `InquiryStatus`, `crm_accounts`, `crm_contacts`, `inquiry_conversions`, and versioned inquiry payload fields.

- [ ] **Step 1: Write the failing status and migration tests**

```ts
test("supports the complete inquiry pipeline", () => {
  assert.deepEqual(INQUIRY_STATUSES, [
    "new",
    "assigned",
    "contacting",
    "requirements",
    "proposal",
    "won",
    "converted",
    "done",
    "on_hold",
    "lost",
  ]);
});

for (const table of ["crm_accounts", "crm_contacts", "inquiry_conversions"]) {
  assert.match(migration, new RegExp(`create table if not exists ${table}`));
}
assert.match(migration, /form_version text not null/);
assert.match(migration, /raw_payload jsonb not null/);
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- --test-name-pattern="complete inquiry pipeline|CRM migration"`

Expected: FAIL because the current status union has only three values and migration `0008` is absent.

- [ ] **Step 3: Implement exact status types**

```ts
export type InquiryStatus =
  | "new"
  | "assigned"
  | "contacting"
  | "requirements"
  | "proposal"
  | "won"
  | "converted"
  | "done"
  | "on_hold"
  | "lost";
```

Add `assignedAdminId`, `nextContactAt`, `source`, `formVersion`,
`rawPayload`, `crmAccountId`, and `crmContactId` to `Inquiry`. Update both mock
and Neon adapters with the same interface.

- [ ] **Step 4: Add additive CRM tables and conversion uniqueness**

`inquiry_conversions` has unique `inquiry_id` and stores:

```text
status
idempotency_key
last_completed_step
hub_project_id
drive_folder_id
linear_project_id
last_error_code
attempt_count
```

The migration replaces the old three-value inquiry status check with the exact
ten-value check and defaults existing rows without data loss.

- [ ] **Step 5: Run and commit**

```bash
npm test -- --test-name-pattern="inquiry|CRM"
git add database/migrations/0008_crm_project_conversion.sql src/lib/db/schema.ts src/lib/admin tests/crm-migration-contract.test.mts tests/neon-adapters.test.mts
git commit -m "feat: add CRM inquiry pipeline storage"
```

### Task 2: Preserve Versioned Public Submissions and Minimize Linear Data

**Files (Homepage repository):**
- Modify: `src/lib/inquiry-actions.ts`
- Modify: `src/lib/inquiry-validation.ts`
- Modify: `src/lib/integrations/linear.ts`
- Modify: `tests/inquiry-validation.test.mts`
- Modify: `tests/linear-integration.test.mts`

**Interfaces:**
- Consumes: validated public form fields.
- Produces: `NormalizedInquirySubmission` with `formVersion` and allow-listed `rawPayload`.

- [ ] **Step 1: Write the failing payload test**

```ts
test("preserves education fields in a versioned allow-listed payload", () => {
  const result = validateInquirySubmission({
    type: "교육 신청",
    subtype: "바이브 코딩",
    sender: "A기관",
    contact: "staff@example.com",
    message: "8월 교육",
    participantCount: "12",
    preferredDates: ["2026-08-10"],
    unexpectedSecret: "drop-me",
  });
  assert.equal(result.formVersion, "education.v1");
  assert.deepEqual(result.rawPayload, {
    participantCount: 12,
    preferredDates: ["2026-08-10"],
  });
  assert.equal("unexpectedSecret" in result.rawPayload, false);
});
```

- [ ] **Step 2: Run the test**

Run: `npm test -- --test-name-pattern="versioned allow-listed payload|excludes contact"`

Expected: FAIL because versioned normalization is absent and the current Linear payload still contains PII.

- [ ] **Step 3: Implement allow-listed payload schemas**

```ts
const rawPayloadSchemas = {
  "education.v1": z.object({
    participantCount: z.coerce.number().int().min(1).max(1000).optional(),
    preferredDates: z.array(z.string().date()).max(10).default([]),
  }),
  "project.v1": z.object({
    budgetRange: z.string().max(80).optional(),
    desiredLaunchDate: z.string().date().optional(),
  }),
  "general.v1": z.object({}),
} as const;
```

Choose the form version from validated inquiry type, parse only the matching
allow list, and persist the normalized object.

- [ ] **Step 4: Replace the Linear inquiry description**

```ts
description: [
  `문의 ID: ${inquiry.id}`,
  `유형: ${inquiry.type} / ${inquiry.subtype}`,
  `요약: ${summarizeInquiry(inquiry.message, 160)}`,
  `관리자 페이지: ${detailUrl}`,
].join("\n")
```

Do not include sender, contact, or the full message.

- [ ] **Step 5: Run and commit**

```bash
npm test -- --test-name-pattern="inquiry|Linear"
git add src/lib/inquiry-actions.ts src/lib/inquiry-validation.ts src/lib/integrations/linear.ts tests/inquiry-validation.test.mts tests/linear-integration.test.mts
git commit -m "feat: preserve versioned inquiry submissions"
```

### Task 3: Build the CRM Pipeline Admin UI

**Files (Homepage repository):**
- Create: `src/components/admin/inquiries/pipeline-select.tsx`
- Create: `src/components/admin/inquiries/assignment-form.tsx`
- Create: `src/components/admin/inquiries/conversion-panel.tsx`
- Modify: `src/app/admin/(shell)/inquiries/actions.ts`
- Modify: `src/app/admin/(shell)/inquiries/page.tsx`
- Modify: `src/app/admin/(shell)/inquiries/[id]/page.tsx`
- Create: `tests/crm-admin-contract.test.mts`

**Interfaces:**
- Consumes: expanded inquiry fields and active admin list.
- Produces: assign, advance pipeline, schedule next contact, link CRM account/contact, and start conversion controls.

- [ ] **Step 1: Write the failing action-auth contract**

```ts
test("CRM mutation actions require an active admin session", () => {
  const source = readFileSync("src/app/admin/(shell)/inquiries/actions.ts", "utf8");
  for (const action of [
    "assignInquiry",
    "updateInquiryPipeline",
    "scheduleInquiryFollowUp",
    "linkInquiryCustomer",
  ]) {
    assert.match(source, new RegExp(`export async function ${action}`));
  }
  assert.match(source, /requireAdminAction/);
});
```

- [ ] **Step 2: Run the test**

Run: `npm test -- --test-name-pattern="CRM mutation actions"`

Expected: FAIL because the actions are absent.

- [ ] **Step 3: Implement guarded actions**

Each action calls `requireAdminAction()`, validates UUID/date/status input with
Zod, writes through `AdminDataSource`, appends an audit log, and revalidates
list/detail routes.

- [ ] **Step 4: Implement the pipeline UI**

The list has filters for pipeline stage, inquiry type, assignee, next-contact
date, and conversion state. Detail shows the raw payload as labeled,
allow-listed fields rather than JSON. `프로젝트로 전환` is enabled only for
`won` inquiries and opens the conversion panel.

- [ ] **Step 5: Run and commit**

```bash
npm test -- --test-name-pattern="CRM|admin"
npm run lint
npx tsc --noEmit
git add src/components/admin/inquiries 'src/app/admin/(shell)/inquiries/actions.ts' 'src/app/admin/(shell)/inquiries/page.tsx' 'src/app/admin/(shell)/inquiries/[id]/page.tsx' tests/crm-admin-contract.test.mts
git commit -m "feat: add inquiry CRM pipeline UI"
```

### Task 4: Add the Hub Project Provisioning Endpoint

**Files (Hub repository):**
- Create: `supabase/migrations/20260719150000_add_external_project_source.sql`
- Create: `src/lib/integrations/project-provisioning.ts`
- Create: `src/app/api/internal/integrations/projects/route.ts`
- Create: `tests/unit/project-provisioning.test.ts`
- Create: `tests/unit/project-provisioning-schema.test.ts`

**Interfaces:**
- Consumes: signed `ProvisionHubProjectInput`.
- Produces: idempotent `{ projectId, created }` and source-link records.

- [ ] **Step 1: Write the failing idempotency test**

```ts
it("returns the existing project for a repeated external source key", async () => {
  const first = await provisionHubProject(input, dependencies);
  const second = await provisionHubProject(input, dependencies);
  expect(first.projectId).toBe(second.projectId);
  expect(second.created).toBe(false);
  expect(insertProjectCalls).toBe(1);
});
```

- [ ] **Step 2: Run the test**

Run: `pnpm test -- project-provisioning`

Expected: FAIL because provisioning does not exist.

- [ ] **Step 3: Define the provisioning input**

```ts
export type ProvisionHubProjectInput = {
  externalSource: "admin_inquiry";
  externalSourceId: string;
  title: string;
  type: string;
  status: "문의" | "검토중" | "기획중" | "진행중";
  clientName: string | null;
  description: string | null;
  startDate: string | null;
  dueDate: string | null;
  participantMemberIds: string[];
};
```

- [ ] **Step 4: Implement service-role transaction semantics**

Verify HMAC, insert an inbox event, look up unique
`(external_source, external_source_id)`, create the project and participants
only when absent, and return the same project on retries. Record
`created_by_source="integration"`; do not impersonate a human profile.

- [ ] **Step 5: Run and commit**

```bash
pnpm test -- project-provisioning
git add supabase/migrations/20260719150000_add_external_project_source.sql src/lib/integrations/project-provisioning.ts src/app/api/internal/integrations/projects/route.ts tests/unit/project-provisioning.test.ts tests/unit/project-provisioning-schema.test.ts
git commit -m "feat: provision Hub projects from CRM"
```

### Task 5: Implement the Resumable Conversion Saga

**Files (Homepage repository):**
- Create: `src/lib/integrations/conversions/types.ts`
- Create: `src/lib/integrations/conversions/repository.ts`
- Create: `src/lib/integrations/conversions/runner.ts`
- Create: `src/app/api/internal/integrations/conversions/run/route.ts`
- Modify: `src/app/admin/(shell)/inquiries/actions.ts`
- Create: `tests/inquiry-conversion.test.mts`

**Interfaces:**
- Consumes: won inquiry plus `ConversionRequest`.
- Produces: `startInquiryConversion()` and `runInquiryConversion()` with steps `hub_project`, `drive_folder`, `linear_project`, `complete`.

- [ ] **Step 1: Write the failing resume test**

```ts
test("resumes after the saved Drive step without recreating Hub or Drive", async () => {
  const result = await runInquiryConversion(conversionAt("drive_folder"), dependencies);
  assert.equal(dependencies.createHubProject.calls.length, 0);
  assert.equal(dependencies.ensureDriveFolder.calls.length, 0);
  assert.equal(dependencies.ensureLinearProject.calls.length, 1);
  assert.equal(result.status, "succeeded");
});
```

- [ ] **Step 2: Run the test**

Run: `npm test -- --test-name-pattern="resumes after the saved Drive step"`

Expected: FAIL because the runner is absent.

- [ ] **Step 3: Implement the ordered saga**

```ts
const steps = [
  { name: "hub_project", run: ensureHubProject },
  { name: "drive_folder", run: ensureDriveFolder },
  { name: "linear_project", run: ensureLinearProject },
] as const;
```

After each successful external result, persist its ID and
`last_completed_step` in one Neon transaction before starting the next step.
The idempotency keys are:

```text
inquiry:<inquiryId>:hub
inquiry:<inquiryId>:drive
inquiry:<inquiryId>:linear
```

- [ ] **Step 4: Add error classification**

429/5xx/timeouts become `retry_wait`; 401/403 become `needs_attention`; input
validation and link conflicts become `needs_attention` without automatic retry.
The admin UI displays only normalized error codes.

- [ ] **Step 5: Run and commit**

```bash
npm test -- --test-name-pattern="conversion"
git add src/lib/integrations/conversions src/app/api/internal/integrations/conversions/run/route.ts 'src/app/admin/(shell)/inquiries/actions.ts' tests/inquiry-conversion.test.mts
git commit -m "feat: convert won inquiries into projects"
```

### Task 6: Verify the Full Inquiry Conversion Flow

**Files:**
- Create: `e2e/inquiry-conversion.spec.ts`
- Modify: `docs/superpowers/specs/2026-07-19-kpopsoft-platform-orchestration-design.md`
- Modify: `docs/개발상태.md`

**Interfaces:**
- Consumes: Preview admin, Hub, Linear test project, Shared Drive test folder.
- Produces: end-to-end evidence and rollout decision for `INQUIRY_CONVERSION_ENABLED`.

- [ ] **Step 1: Add the browser scenario**

```ts
test("converts a synthetic inquiry without duplicate external records", async ({ page }) => {
  await createSyntheticInquiry(page);
  await advanceInquiryToWon(page);
  await startConversion(page);
  await expect(page.getByText("전환 완료")).toBeVisible();
  await page.getByRole("button", { name: "다시 실행" }).click();
  await expect(page.getByText("기존 연결 사용")).toBeVisible();
});
```

- [ ] **Step 2: Run the scenario with the flag off**

Run: `npx playwright test e2e/inquiry-conversion.spec.ts --project=chromium`

Expected: the conversion control reports disabled, proving fail-closed behavior.

- [ ] **Step 3: Enable Preview-only conversion and run twice**

Set `INQUIRY_CONVERSION_ENABLED=true` only in the isolated Preview. Run the
same synthetic inquiry conversion twice and verify exactly one Hub project,
one Drive folder, and one Linear project.

- [ ] **Step 4: Run all gates**

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
npx playwright test e2e/inquiry-conversion.spec.ts --project=chromium
git diff --check
```

- [ ] **Step 5: Commit and push both repositories**

Homepage:

```bash
git add e2e/inquiry-conversion.spec.ts docs/superpowers/specs/2026-07-19-kpopsoft-platform-orchestration-design.md docs/개발상태.md
git commit -m "test: verify CRM project conversion"
gh auth switch -h github.com -u kpopsoft-collab
git push -u origin codex/crm-project-conversion
```

Hub:

```bash
gh auth switch -h github.com -u h19h29-design
git push -u origin codex/hub-crm-conversion
```
