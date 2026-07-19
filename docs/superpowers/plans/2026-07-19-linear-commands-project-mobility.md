# Linear Commands and Project Mobility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated Hub members create and edit Linear issues, move work between projects, change project phases, and split a derived project while preserving command and relationship history.

**Architecture:** Hub sends signed, idempotent commands to the homepage integration gateway. The gateway records commands in Neon, performs Linear mutations, and leaves Hub UI in `pending` until a Linear webhook or reconciliation query confirms the provider state; project phase, issue movement, and new-project split remain separate domain operations.

**Tech Stack:** Next.js Server Actions and Route Handlers, Neon/Drizzle, `@linear/sdk`, Supabase, Zod, Vitest, Node test runner, Playwright.

## Global Constraints

- Execute only after the Linear read mirror plan passes in both Preview apps.
- Before Task 1, invoke `superpowers:using-git-worktrees` and create homepage branch `codex/linear-commands-project-mobility` plus Hub branch `codex/hub-linear-commands` from their reviewed integration baselines.
- Contract version is exactly `2026-07-19.v1`.
- Hub never receives `LINEAR_API_KEY`.
- Only title, status, assignee, priority, due date, project, and issue creation are writable.
- A Hub command is not complete until webhook or reconciliation confirms the Linear state.
- Every command has a durable idempotency key and actor identity.
- Project phase change does not create a project.
- Issue movement does not copy or duplicate an issue.
- Project split creates a derived project and preserves the source relationship.
- Deleting or archiving in one system must not cascade hard deletion to the other.

---

### Task 1: Define and Persist Linear Commands

**Files (Homepage repository):**
- Create: `database/migrations/0006_linear_commands.sql`
- Create: `src/lib/integrations/linear/commands.ts`
- Modify: `src/lib/db/schema.ts`
- Create: `tests/linear-command-domain.test.mts`
- Modify: `tests/integration-migration-contract.test.mts`

**Interfaces:**
- Produces: `LinearCommand`, `validateLinearCommand()`, `enqueueLinearCommand()`, and table `integration_commands`.

- [ ] **Step 1: Write the failing command validation tests**

```ts
test("accepts a bounded issue update command", () => {
  assert.deepEqual(
    validateLinearCommand({
      type: "issue.update",
      issueId: "issue-1",
      changes: { title: "새 제목", priority: 2, dueDate: "2026-08-01" },
    }),
    {
      type: "issue.update",
      issueId: "issue-1",
      changes: { title: "새 제목", priority: 2, dueDate: "2026-08-01" },
    },
  );
});

test("rejects unsupported issue fields", () => {
  assert.throws(
    () => validateLinearCommand({ type: "issue.update", issueId: "issue-1", changes: { description: "raw" } }),
    /unsupported_field/,
  );
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- --test-name-pattern="issue update command|unsupported issue fields"`

Expected: FAIL because the command module is missing.

- [ ] **Step 3: Implement the command union**

```ts
export type LinearCommand =
  | {
      type: "issue.create";
      hubProjectId: string;
      title: string;
      assigneeId?: string;
      priority?: 0 | 1 | 2 | 3 | 4;
      dueDate?: string;
    }
  | {
      type: "issue.update";
      issueId: string;
      changes: {
        title?: string;
        statusId?: string;
        assigneeId?: string | null;
        priority?: 0 | 1 | 2 | 3 | 4;
        dueDate?: string | null;
      };
    }
  | { type: "issue.move"; issueId: string; targetLinearProjectId: string }
  | {
      type: "project.phase";
      linearProjectId: string;
      statusId: string;
      statusName: string;
    }
  | {
      type: "project.split";
      sourceHubProjectId: string;
      title: string;
      issueIds: string[];
      startDate?: string;
      targetDate?: string;
    };
```

The migration stores `command_type`, `actor_profile_id`, `idempotency_key`,
validated payload, status, provider mutation ID, expected provider update time,
error code, and timestamps. Unique `idempotency_key` prevents duplicate writes.

- [ ] **Step 4: Run and commit**

```bash
npm test -- --test-name-pattern="Linear command|integration foundation migration"
git add database/migrations/0006_linear_commands.sql src/lib/db/schema.ts src/lib/integrations/linear/commands.ts tests/linear-command-domain.test.mts tests/integration-migration-contract.test.mts
git commit -m "feat: add durable Linear command model"
```

### Task 2: Add the Signed Admin Command API and Processor

**Files (Homepage repository):**
- Create: `src/lib/integrations/linear/command-handler.ts`
- Create: `src/lib/integrations/linear/command-processor.ts`
- Create: `src/app/api/internal/integrations/linear/commands/route.ts`
- Create: `tests/linear-command-route.test.mts`
- Create: `tests/linear-command-processor.test.mts`

**Interfaces:**
- Consumes: signed Hub request and `LinearCommand`.
- Produces: `POST /api/internal/integrations/linear/commands` returning `{ commandId, status: "pending" }`.

- [ ] **Step 1: Write the failing authentication and idempotency tests**

```ts
test("rejects an unsigned Linear command", async () => {
  const response = await handler(new Request("https://admin/api/internal/integrations/linear/commands", {
    method: "POST",
    body: JSON.stringify(validCommand),
  }));
  assert.equal(response.status, 401);
});

test("returns the same command for a repeated idempotency key", async () => {
  const first = await submitSigned("cmd-1");
  const second = await submitSigned("cmd-1");
  assert.equal(first.commandId, second.commandId);
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- --test-name-pattern="unsigned Linear command|repeated idempotency"`

Expected: FAIL because the route and processor are absent.

- [ ] **Step 3: Implement a dependency-injected handler**

```ts
export type LinearCommandHandlerDependencies = {
  verify: (request: Request, body: string) => { idempotencyKey: string };
  actorFromPayload: (payload: unknown) => string;
  enqueue: (input: {
    actorProfileId: string;
    idempotencyKey: string;
    command: LinearCommand;
  }) => Promise<{ id: string; status: string }>;
};
```

The handler reads the body once, verifies the signature against that exact
body, validates the command, persists it, and returns `202`. Validation errors
return `400`, signature errors `401`, and unavailable integration `503`.

- [ ] **Step 4: Implement provider mutations**

The processor maps:

```ts
const operations = {
  "issue.create": (command) => client.createIssue(...),
  "issue.update": (command) => client.updateIssue(command.issueId, command.changes),
  "issue.move": (command) => client.updateIssue(command.issueId, { projectId: command.targetLinearProjectId }),
  "project.phase": (command) => client.updateProject(command.linearProjectId, { statusId: command.statusId }),
};
```

`project.split` creates one Linear project, records a source→derived entity
link, then moves each listed issue using a child idempotency key
`${commandId}:move:${issueId}`. Partial success records `last_completed_step`.

- [ ] **Step 5: Run and commit**

```bash
npm test -- --test-name-pattern="Linear command"
git add src/lib/integrations/linear/command-handler.ts src/lib/integrations/linear/command-processor.ts src/app/api/internal/integrations/linear/commands/route.ts tests/linear-command-route.test.mts tests/linear-command-processor.test.mts
git commit -m "feat: process signed Linear commands"
```

### Task 3: Add Hub Command Client and Pending State

**Files (Hub repository):**
- Create: `supabase/migrations/20260719130000_add_linear_commands.sql`
- Create: `src/lib/integrations/admin-client.ts`
- Create: `src/lib/integrations/linear-command-state.ts`
- Create: `src/app/(app)/projects/[id]/linear-actions.ts`
- Create: `tests/unit/linear-command-actions.test.ts`
- Create: `tests/unit/linear-command-schema.test.ts`

**Interfaces:**
- Consumes: admin command endpoint and HMAC contract.
- Produces: `submitLinearCommand()`, local `linear_command_requests`, and Server Actions for create/update/move/phase/split.

- [ ] **Step 1: Write the failing action test**

```ts
it("records a pending command before calling the admin gateway", async () => {
  await createLinearIssueAction("project-1", formData);
  expect(mockSupabase.from).toHaveBeenCalledWith("linear_command_requests");
  expect(mockAdminClient.submitLinearCommand).toHaveBeenCalledWith(
    expect.objectContaining({ type: "issue.create", hubProjectId: "project-1" }),
    expect.any(String),
  );
});
```

- [ ] **Step 2: Run the test**

Run: `pnpm test -- linear-command-actions`

Expected: FAIL because the action does not exist.

- [ ] **Step 3: Implement the signed client**

```ts
export async function submitLinearCommand(
  command: LinearCommand,
  idempotencyKey: string,
): Promise<{ commandId: string; status: "pending" }> {
  const body = JSON.stringify({
    actorProfileId: (await requireTeamMember()).profileId,
    command,
  });
  return signedAdminFetch("/api/internal/integrations/linear/commands", {
    body,
    idempotencyKey,
  });
}
```

Server Actions validate UUIDs and dates with Zod, insert a local pending row,
submit the command, and revalidate only the current project. They do not mutate
mirror rows optimistically.

- [ ] **Step 4: Add RLS**

Authenticated team members can select command requests and insert commands with
their own `actor_profile_id`. Only the service role can update provider status.

- [ ] **Step 5: Run and commit**

```bash
pnpm test -- linear-command
git add supabase/migrations/20260719130000_add_linear_commands.sql src/lib/integrations/admin-client.ts src/lib/integrations/linear-command-state.ts 'src/app/(app)/projects/[id]/linear-actions.ts' tests/unit/linear-command-actions.test.ts tests/unit/linear-command-schema.test.ts
git commit -m "feat: submit Linear commands from Hub"
```

### Task 4: Build the Linear Work Editor and Mobility UI

**Files (Hub repository):**
- Create: `src/features/projects/linear-issue-editor.tsx`
- Create: `src/features/projects/project-split-dialog.tsx`
- Modify: `src/features/projects/linear-project-panel.tsx`
- Modify: `src/app/(app)/projects/[id]/page.tsx`
- Create: `tests/unit/linear-issue-editor.test.tsx`
- Create: `tests/e2e/linear-command-flow.spec.ts`

**Interfaces:**
- Consumes: mirrored issues, active members, Linear statuses, eligible target projects, pending command state.
- Produces: accessible create/edit/move/phase/split controls with mobile dialogs.

- [ ] **Step 1: Write the failing UI test**

```tsx
it("opens the issue editor and exposes only supported fields", () => {
  render(<LinearIssueEditor issue={issue} statuses={statuses} members={members} projects={projects} />);
  fireEvent.click(screen.getByRole("button", { name: "업무 수정" }));
  expect(screen.getByLabelText("제목")).toBeTruthy();
  expect(screen.getByLabelText("상태")).toBeTruthy();
  expect(screen.getByLabelText("담당자")).toBeTruthy();
  expect(screen.getByLabelText("우선순위")).toBeTruthy();
  expect(screen.getByLabelText("기한")).toBeTruthy();
  expect(screen.queryByLabelText("설명")).toBeNull();
});
```

- [ ] **Step 2: Run the test**

Run: `pnpm test -- linear-issue-editor`

Expected: FAIL because the editor is absent.

- [ ] **Step 3: Implement the controls**

Use icon buttons with Lucide icons and tooltips. The issue menu has:

```text
업무 수정
다른 프로젝트로 이동
Linear에서 열기
```

The project menu has:

```text
단계 변경
새 프로젝트로 분리
Linear에서 열기
```

Pending commands show `처리 중`; confirmed webhook data replaces the pending
label. Failed commands show a sanitized code and `다시 시도`.

- [ ] **Step 4: Verify desktop and mobile**

Run:

```bash
pnpm test -- linear
pnpm test:e2e -- linear-command-flow.spec.ts
```

Expected: commands are usable at 1600×1000 and 390×844 without overlapping,
and no control claims success before mirror confirmation.

- [ ] **Step 5: Commit**

```bash
git add src/features/projects/linear-issue-editor.tsx src/features/projects/project-split-dialog.tsx src/features/projects/linear-project-panel.tsx 'src/app/(app)/projects/[id]/page.tsx' tests/unit/linear-issue-editor.test.tsx tests/e2e/linear-command-flow.spec.ts
git commit -m "feat: add Linear work and project mobility UI"
gh auth switch -h github.com -u h19h29-design
git push -u origin codex/hub-linear-commands
```

### Task 5: Confirm Commands Through Webhooks and Reconciliation

**Files (Homepage repository):**
- Modify: `src/lib/integrations/linear/webhook.ts`
- Create: `src/lib/integrations/linear/reconcile-commands.ts`
- Modify: `src/lib/integrations/jobs.ts`
- Create: `tests/linear-command-confirmation.test.mts`
- Modify: `docs/superpowers/specs/2026-07-19-kpopsoft-platform-orchestration-design.md`

**Interfaces:**
- Consumes: Linear webhook mirrors and pending commands.
- Produces: terminal command states `confirmed|failed|needs_attention` and Hub confirmation events.

- [ ] **Step 1: Write the failing stale-event test**

```ts
test("does not confirm a command from an older provider event", async () => {
  const result = await confirmCommand({
    expectedProviderUpdatedAt: "2026-07-19T04:00:00Z",
    eventUpdatedAt: "2026-07-19T03:59:59Z",
    command,
    mirror,
  });
  assert.equal(result.status, "pending");
});
```

- [ ] **Step 2: Run the test**

Run: `npm test -- --test-name-pattern="older provider event"`

Expected: FAIL because `confirmCommand` is absent.

- [ ] **Step 3: Implement confirmation**

Webhook confirmation compares provider IDs, expected changed fields, and
provider update time. Reconciliation queries commands pending longer than five
minutes. A matching provider state emits `linear.command.confirmed`; 401/403
becomes `needs_attention`; transient errors remain retryable.

- [ ] **Step 4: Run complete gates**

Homepage:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Hub:

```bash
pnpm test
pnpm lint
pnpm build
pnpm test:e2e -- linear-command-flow.spec.ts
```

- [ ] **Step 5: Enable Preview write flag, smoke, commit, and push**

Enable `LINEAR_WRITE_ENABLED=true` only in the isolated Preview. Create one
test issue, update it, move it, and split a test project; then archive the test
objects.

```bash
git add src/lib/integrations/linear/webhook.ts src/lib/integrations/linear/reconcile-commands.ts src/lib/integrations/jobs.ts tests/linear-command-confirmation.test.mts docs/superpowers/specs/2026-07-19-kpopsoft-platform-orchestration-design.md
git commit -m "feat: confirm Linear commands from provider state"
gh auth switch -h github.com -u kpopsoft-collab
git push -u origin codex/linear-commands-project-mobility
```

The Hub branch was pushed in Task 4 only after its complete unit, lint, build,
desktop, and mobile gates passed.
