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
- Create: `scripts/verify-billing-preview.mts`
- Create: `tests/admin-oauth-preview.test.mts`
- Modify: `e2e/billing-admin.spec.ts`
- Modify: `docs/billing/verification-report.md`

**Interfaces:**
- Consumes: callback `https://admin-kpopsoft-billing-preview-neo.vercel.app/api/auth/callback/google` and Vercel branch-scoped Preview env.
- Produces: authenticated Preview evidence for customer → contract draft → activation → invoice draft → approval.

- [ ] **Step 1: Add a failing callback-host contract test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { buildGoogleCallbackUrl } from "../scripts/verify-billing-preview.mts";

test("billing Preview OAuth callback stays on the admin host", () => {
  const callback = buildGoogleCallbackUrl(
    "https://admin-kpopsoft-billing-preview-neo.vercel.app",
  );
  assert.equal(
    callback,
    "https://admin-kpopsoft-billing-preview-neo.vercel.app/api/auth/callback/google",
  );
});
```

- [ ] **Step 2: Run the focused test**

Run:

```bash
npm test -- --test-name-pattern="billing Preview OAuth callback"
```

Expected: FAIL because `scripts/verify-billing-preview.mts` does not exist.

- [ ] **Step 3: Implement the Preview verifier**

```ts
export function buildGoogleCallbackUrl(adminOrigin: string): string {
  const origin = new URL(adminOrigin);
  if (origin.protocol !== "https:") throw new Error("admin_origin_must_use_https");
  if (origin.pathname !== "/") throw new Error("admin_origin_must_not_include_path");
  return new URL("/api/auth/callback/google", origin).href;
}
```

The CLI checks Vercel project/team identity, deployment target `preview`,
required environment-variable names without reading values, callback URL, and
Neon branch ID. It exits non-zero if the target is Production or the Neon
branch is primary/default.

- [ ] **Step 4: Select the Google Cloud project without exposing secrets**

Use the existing company-owned Google Cloud project when its owner is
`kpopsoft@gmail.com`. If more than one eligible project exists, stop this task
and ask the user to select the project name. Register exactly:

```text
https://admin-kpopsoft-billing-preview-neo.vercel.app/api/auth/callback/google
```

Add `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` through the Vercel encrypted
Preview branch UI or `vercel env add`; never pass the secret as a command-line
argument.

- [ ] **Step 5: Redeploy Preview and run the browser flow**

```bash
npx vercel@latest --scope kpopsoft-2075s-projects
BILLING_E2E_DISPOSABLE_PREVIEW=true \
  BILLING_E2E_BASE_URL=https://admin-kpopsoft-billing-preview-neo.vercel.app \
  npx playwright test e2e/billing-admin.spec.ts --project=chromium
```

Expected: login succeeds for the active admin, the synthetic customer workflow passes, and real customer data is not used.

- [ ] **Step 6: Verify fail-closed payment entry points**

Expected browser/API state:

```text
BANK_TRANSFER_ENABLED=false
TOSS_PAYMENTS_ENABLED=false
BILLING_WIDGET_ENABLED=false
unauthenticated /api/internal/billing/reconcile = 401
```

- [ ] **Step 7: Record, commit, and push the Preview evidence**

```bash
git add scripts/verify-billing-preview.mts tests/admin-oauth-preview.test.mts e2e/billing-admin.spec.ts docs/billing/verification-report.md
git commit -m "test: verify billing preview admin workflow"
git push origin codex/billing-preview-oauth
```

Expected: the report marks Preview administrator flow PASS and keeps Production activation HOLD.
