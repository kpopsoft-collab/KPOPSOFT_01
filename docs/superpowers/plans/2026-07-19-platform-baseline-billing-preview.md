# Platform Baseline and Billing Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freeze clean Git baselines for both repositories, preserve the existing Billing Preview evidence, connect Preview-only Google OAuth, and verify the synthetic administrator workflow without changing Production.

**Architecture:** The homepage and Hub remain separate repositories with account-specific GitHub authentication and feature worktrees. The existing Billing Preview branch and Vercel deployment are reused only while they are healthy; Preview OAuth unlocks synthetic admin tests while bank transfer, Toss, widget, Production DB, DNS, and Production cron remain disabled.

**Tech Stack:** Git worktrees, GitHub CLI, Next.js 16.2.10, Auth.js, Neon CLI 2.35.0, Vercel CLI 56+, Node test runner, Playwright.

## Global Constraints

- Homepage workdir: `/Users/mac-mini/Documents/kpopsoft-homepage`.
- Hub workdir: `/Users/mac-mini/Documents/kpopsoft-hub`.
- Never copy project files into `/Users/mac-mini/Documents/ai협업`.
- Read relevant `node_modules/next/dist/docs/` guides before changing Next.js code.
- Preserve the four pre-existing homepage modifications until Task 1 commits exactly those files.
- Use GitHub account `kpopsoft-collab` for `kpopsoft-collab/KPOPSOFT_01`.
- Use GitHub account `h19h29-design` for `h19h29-design/kpopsoft-hub`.
- Never print OAuth secrets, database URLs, HMAC keys, Toss keys, payment keys, or full bank-account values.
- Do not change Production DB, Production billing flags, Production cron, DNS, bank-transfer visibility, Toss, or widget activation.
- `BILLING_ENABLED=true`, `BANK_TRANSFER_ENABLED=false`, `TOSS_PAYMENTS_ENABLED=false`, and `BILLING_WIDGET_ENABLED=false` remain the Preview entry state.

---

### Task 1: Verify and Commit the Existing Billing Preview Evidence

**Files:**
- Modify: `docs/billing/verification-report.md`
- Modify: `docs/개발상태.md`
- Modify: `tests/billing-cron-route.test.mts`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: current homepage HEAD `bf5272d` and the four pre-existing working-tree changes.
- Produces: one baseline commit containing only the Preview evidence and 10-minute reconciliation cron declaration.

- [ ] **Step 1: Verify the exact dirty-file boundary**

Run:

```bash
cd /Users/mac-mini/Documents/kpopsoft-homepage
git status --porcelain=v1 | sed 's/^...//' | sort
```

Expected:

```text
docs/billing/verification-report.md
docs/개발상태.md
tests/billing-cron-route.test.mts
vercel.json
```

- [ ] **Step 2: Run the focused contract test**

Run:

```bash
npm test -- --test-name-pattern="route and Vercel schedule preserve the protected Node contract"
```

Expected: PASS and the test asserts both `/api/internal/billing/generate` and `/api/internal/billing/reconcile`.

- [ ] **Step 3: Run the complete local gate**

Run:

```bash
npm test
npm run test:e2e:billing
npm run lint
npx tsc --noEmit
npm run build
npm audit --omit=dev
git diff --check
```

Expected: every command exits `0`; Preview-only browser scenarios may remain explicit `HOLD` skips until OAuth is connected.

- [ ] **Step 4: Commit only the four reviewed files**

```bash
git add docs/billing/verification-report.md docs/개발상태.md tests/billing-cron-route.test.mts vercel.json
git diff --cached --check
git commit -m "chore: record billing preview readiness"
```

Expected: the commit lists exactly four files.

- [ ] **Step 5: Push with the homepage GitHub identity**

```bash
gh auth switch -h github.com -u kpopsoft-collab
gh repo view kpopsoft-collab/KPOPSOFT_01 --json viewerPermission
git push origin codex/kpopsoft-maxonomy-concept-wind
```

Expected: `viewerPermission` is `ADMIN` or `WRITE`, and the push succeeds.

### Task 2: Add a Repeatable Repository Boundary Check

**Files:**
- Create: `scripts/check-platform-git-boundaries.mts`
- Create: `tests/platform-git-boundaries.test.mts`

**Interfaces:**
- Consumes: absolute homepage and Hub paths plus expected remote URLs.
- Produces: `checkRepositoryBoundary(input: RepositoryBoundary): Promise<BoundaryResult>` and a CLI that exits non-zero on a wrong repository, remote, or dirty-path policy.

- [ ] **Step 1: Write the failing boundary test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { checkRepositoryBoundary } from "../scripts/check-platform-git-boundaries.mts";

test("rejects a repository whose origin belongs to the other app", async () => {
  const result = await checkRepositoryBoundary({
    name: "homepage",
    cwd: "/tmp/homepage",
    expectedOrigin: "https://github.com/kpopsoft-collab/KPOPSOFT_01.git",
    inspect: async () => ({
      topLevel: "/tmp/homepage",
      origin: "https://github.com/h19h29-design/kpopsoft-hub.git",
      dirtyPaths: [],
    }),
  });
  assert.deepEqual(result, {
    ok: false,
    code: "origin_mismatch",
    repository: "homepage",
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- --test-name-pattern="rejects a repository whose origin belongs to the other app"
```

Expected: FAIL because `scripts/check-platform-git-boundaries.mts` does not exist.

- [ ] **Step 3: Implement the boundary checker**

```ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type RepositoryBoundary = {
  name: "homepage" | "hub";
  cwd: string;
  expectedOrigin: string;
  allowedDirtyPaths?: string[];
  inspect?: () => Promise<{
    topLevel: string;
    origin: string;
    dirtyPaths: string[];
  }>;
};

export type BoundaryResult =
  | { ok: true; repository: string }
  | { ok: false; code: "root_mismatch" | "origin_mismatch" | "unexpected_dirty_path"; repository: string };

async function inspectGit(cwd: string) {
  const [top, origin, status] = await Promise.all([
    execFileAsync("git", ["rev-parse", "--show-toplevel"], { cwd }),
    execFileAsync("git", ["remote", "get-url", "origin"], { cwd }),
    execFileAsync("git", ["status", "--porcelain=v1"], { cwd }),
  ]);
  return {
    topLevel: top.stdout.trim(),
    origin: origin.stdout.trim(),
    dirtyPaths: status.stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.slice(3)),
  };
}

export async function checkRepositoryBoundary(input: RepositoryBoundary): Promise<BoundaryResult> {
  const state = await (input.inspect?.() ?? inspectGit(input.cwd));
  if (state.topLevel !== input.cwd) return { ok: false, code: "root_mismatch", repository: input.name };
  if (state.origin !== input.expectedOrigin) return { ok: false, code: "origin_mismatch", repository: input.name };
  const allowed = new Set(input.allowedDirtyPaths ?? []);
  if (state.dirtyPaths.some((path) => !allowed.has(path))) {
    return { ok: false, code: "unexpected_dirty_path", repository: input.name };
  }
  return { ok: true, repository: input.name };
}
```

- [ ] **Step 4: Add the real repository checks and run the test**

The CLI calls:

```ts
const boundaries: RepositoryBoundary[] = [
  {
    name: "homepage",
    cwd: "/Users/mac-mini/Documents/kpopsoft-homepage",
    expectedOrigin: "https://github.com/kpopsoft-collab/KPOPSOFT_01.git",
  },
  {
    name: "hub",
    cwd: "/Users/mac-mini/Documents/kpopsoft-hub",
    expectedOrigin: "https://github.com/h19h29-design/kpopsoft-hub.git",
  },
];
```

Run:

```bash
npm test -- --test-name-pattern="repository"
npx tsx scripts/check-platform-git-boundaries.mts
```

Expected: tests PASS and both repositories report `ok`.

- [ ] **Step 5: Commit and push**

```bash
git add scripts/check-platform-git-boundaries.mts tests/platform-git-boundaries.test.mts
git commit -m "chore: guard platform repository boundaries"
git push origin codex/kpopsoft-maxonomy-concept-wind
```

### Task 3: Create Isolated Worktrees

**Files:**
- No tracked files.

**Interfaces:**
- Consumes: clean, pushed baseline SHAs from Tasks 1-2.
- Produces: separate homepage and Hub worktrees with no shared uncommitted files.

- [ ] **Step 1: Invoke the required worktree skill**

Read and follow:

```text
/Users/mac-mini/.codex/plugins/cache/openai-curated-remote/superpowers/6.1.1/skills/using-git-worktrees/SKILL.md
```

- [ ] **Step 2: Create the first homepage worktree**

```bash
cd /Users/mac-mini/Documents/kpopsoft-homepage
git worktree add ../kpopsoft-homepage-billing-oauth -b codex/billing-preview-oauth HEAD
```

Expected: `../kpopsoft-homepage-billing-oauth` is on `codex/billing-preview-oauth`.

- [ ] **Step 3: Create the first Hub worktree**

```bash
gh auth switch -h github.com -u h19h29-design
cd /Users/mac-mini/Documents/kpopsoft-hub
git fetch origin
git worktree add ../kpopsoft-hub-linear-mirror -b codex/hub-linear-mirror HEAD
```

Expected: `../kpopsoft-hub-linear-mirror` is on `codex/hub-linear-mirror`.

- [ ] **Step 4: Verify isolation**

```bash
git -C /Users/mac-mini/Documents/kpopsoft-homepage worktree list
git -C /Users/mac-mini/Documents/kpopsoft-hub worktree list
git -C /Users/mac-mini/Documents/kpopsoft-homepage-billing-oauth status --short
git -C /Users/mac-mini/Documents/kpopsoft-hub-linear-mirror status --short
```

Expected: both new worktrees are clean and point to their intended repositories.

### Task 4: Preserve or Extend the Neon Preview Safely

**Files:**
- Modify: `docs/billing/verification-report.md`

**Interfaces:**
- Consumes: Neon project `red-smoke-09462401`, Preview branch `br-lingering-thunder-at6twb35`.
- Produces: a healthy non-primary Preview branch with an expiry at least seven days after the OAuth smoke window.

- [ ] **Step 1: Read the branch metadata**

```bash
npx --yes neonctl@2.35.0 branches get br-lingering-thunder-at6twb35 \
  --project-id red-smoke-09462401 --output json
```

Expected: name `billing-preview-20260716`, `current_state=ready`, `primary=false`, `default=false`.

- [ ] **Step 2: Extend only the Preview branch when fewer than 48 hours remain or the current expiry does not cover the required seven-day OAuth validation window**

Preview-only extension is allowed when either the remaining expiry is under 48 hours or the current expiry does not cover the required seven-day OAuth validation window. Do not extend Production or the main branch.

```bash
npx --yes neonctl@2.35.0 branches set-expiration br-lingering-thunder-at6twb35 \
  --project-id red-smoke-09462401 \
  --expires-at 2026-08-02T08:00:00Z \
  --output json
```

Expected: `expires_at=2026-08-02T08:00:00Z`; the Production/main branch ID is unchanged.

- [ ] **Step 3: Record only non-secret branch evidence**

Add to `docs/billing/verification-report.md`:

```markdown
| Preview branch 재확인 | `br-lingering-thunder-at6twb35`, ready, non-primary, 만료 `2026-08-02T08:00:00Z` |
```

- [ ] **Step 4: Commit and push the evidence**

```bash
git add docs/billing/verification-report.md
git commit -m "docs: extend billing preview verification window"
gh auth switch -h github.com -u kpopsoft-collab
git push -u origin codex/billing-preview-oauth
```

### Task 5: Connect Preview Google OAuth and Run the Synthetic Admin Smoke

**Files:**
- `scripts/verify-billing-preview.mts`
- `tests/admin-oauth-preview.test.mts`
- `e2e/billing-admin.spec.ts`
- `src/lib/billing/invoice-generator.ts`
- `tests/billing-generator.test.mts`
- `docs/billing/verification-report.md`

**Boundary:** No readiness claim is valid until the current local HEAD resolves to one `READY` deployment on `codex/billing-preview-oauth`, its exact inspect reports `target=preview`, and the canonical admin alias resolves to that exact deployment ID and URL. The verifier uses `vercel@56.3.2`, exact branch/SHA metadata filters, and a fail-closed pagination check; it verifies the team ID plus project ID through scoped commands without inventing a project-team field. Vercel env metadata remains value-free and unique per required name/scope; runtime values are reduced to booleans only after an exact-deployment `env pull --id` into a mode-600 temporary file that is immediately deleted, and the child-inherited required environment must exactly match that deployment. Production, Vercel aliases, Neon, Google, and payment providers are not mutated by this task.

- [ ] **Step 1: Drive exact-control-plane and one-contract behavior with tests**

Add RED tests for Vercel team `team_JyJcVEVDcq6Jg1DDgDTW99Su`, scoped project `kpopsoft-02` / `prj_Xb6z5eGIOLTmrpWczO8zU9UYE9x0`, local HEAD match, direct inspect/alias linkage, duplicate env metadata rejection, single active Neon endpoint, exact-deployment runtime attestation, and child-server-runtime single-contract invoice generation. Record the observed failures before implementing the boundary.

- [ ] **Step 2: Implement the read-only Preview verifier**

Use `vercel@56.3.2` to query the exact team, scoped project, branch/SHA-filtered `READY` deployment list, selected deployment inspect, direct canonical alias inspect, and branch env metadata; also query local `git rev-parse HEAD`, Neon branch, and `/projects/red-smoke-09462401/endpoints`. Reject a non-empty deployment next page, duplicate/conflicting required env metadata, and any active Preview Neon endpoint count other than one. Require list `target: null`, selected inspect `target: preview`, and direct canonical alias inspect mapping to the same deployment ID and URL. Pull the selected deployment environment with `env pull --id` only into a mode-600 temporary file, reduce it to boolean attestation, and remove it in `finally`. Return only stable safe codes.

- [ ] **Step 3: Prepare the parent-owned secure inputs**

Register only this callback in the selected company-owned Google OAuth client:

```text
https://admin-kpopsoft-billing-preview-neo.vercel.app/api/auth/callback/google
```

Pull the encrypted branch Preview env to an ignored, mode-600 local file. Create a fresh Auth.js storage state for the canonical admin host, set `BILLING_E2E_EXPECTED_ADMIN_EMAIL`, and choose a unique 8-25 character lowercase `BILLING_E2E_RUN_ID`. Do not pass or create a cron secret for the E2E.

- [ ] **Step 4: Run the guarded Preview browser flow**

```bash
umask 077
npx --yes vercel@56.3.2 env pull .env.billing-preview-e2e.local \
  --environment=preview \
  --git-branch=codex/billing-preview-oauth \
  --project=kpopsoft-02 \
  --scope=kpopsoft-2075s-projects

BILLING_E2E_DISPOSABLE_PREVIEW=true \
BILLING_E2E_BASE_URL=https://admin-kpopsoft-billing-preview-neo.vercel.app \
BILLING_E2E_STORAGE_STATE_PATH="$BILLING_E2E_STORAGE_STATE_PATH" \
BILLING_E2E_EXPECTED_ADMIN_EMAIL="$BILLING_E2E_EXPECTED_ADMIN_EMAIL" \
BILLING_E2E_RUN_ID="$BILLING_E2E_RUN_ID" \
./node_modules/.bin/dotenv -e .env.billing-preview-e2e.local -- \
  npx playwright test e2e/billing-admin.spec.ts --project=billing-chromium
```

The E2E first runs the live verifier and exact-deployment runtime attestation, requires a fresh unexpired Auth.js session cookie scoped to the canonical host, checks the expected email after opening `/admin/billing`, and verifies unauthenticated bulk generate/reconcile return `401`. Immediately before mutation it re-runs the verifier, then starts a `react-server` child Node process using the repository TypeScript loader with only `runDate` and the UUID contract ID as positional arguments. The child invokes only the targeted generator and returns only strict sanitized counts/failure codes; the test requires `targetCount=1` and `createdCount=1` and retains recoverable disposable Preview evidence.

- [ ] **Step 5: Record only observed evidence**

Keep the live OAuth smoke `HOLD` until all boundaries and the browser flow pass. Never mark Preview administrator readiness from skipped tests, stale aliases, old deployments, missing env metadata, or absent runtime attestation.
