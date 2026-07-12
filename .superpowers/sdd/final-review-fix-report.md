# Final Review Fix Report

Date: 2026-07-12

Branch: `codex/kpopsoft-maxonomy-concept-wind`

Status: `DONE_WITH_CONCERNS` — the branch-local findings are fixed and verified; production abuse control, Supabase policy application, and remote content synchronization remain explicit external HOLDs.

## Finding evaluation and changes

### 1. CMS and inquiry-option repositories silently used mock storage

Evaluation: confirmed. `getContentData()` and `getInquiryOptionsData()` checked environment variables independently and returned process-local mocks whenever either Supabase variable was absent.

Change: both accessors now use `resolveAdminDataMode()`, matching `getAdminData()`. Supabase mode uses the existing adapters, explicit non-production `ADMIN_DEV_BYPASS=true` uses mock data, and all other missing/partial configurations throw `Admin data source is not configured`. The configuration matrix covers development mock opt-in, production bypass rejection, missing/partial configuration, and production Supabase precedence.

### 2. Proxy constructed Supabase before checking development bypass

Evaluation: confirmed. `createServerClient()` and `auth.getUser()` ran before the bypass decision, so the documented Supabase-free local workflow could not work without Supabase variables.

Change: `proxy()` returns `NextResponse.next({ request })` immediately when the shared explicit bypass policy is enabled. The check is before `createServerClient()`. `isAdminDevBypassEnabled()` still returns false in production even when the flag is set, so production remains fail-closed and continues through Supabase authentication.

### 3. Public inquiry abuse boundary and external RLS

Evaluation: confirmed. The application has validation and a honeypot, but no challenge provider or durable/shared quota dependency. The checked-in migration still creates `inquiries_insert_anon` for `anon, authenticated`. A process-local limiter would reset on deploy and would not coordinate concurrent/serverless instances, so none was added.

Change: `docs/개발상태.md` and the inquiry operations plan now define the exact production HOLD: provision and server-verify a challenge before storage/email, provision one atomic shared quota boundary, remove direct anon/authenticated INSERT through an authenticated Supabase migration, restrict function grants, and pass the concurrency/provider-outage and RLS role matrices. No remote schema or provider state was changed locally.

### 4. Reduced-motion accordion behavior

Evaluation: confirmed. The shared accordion panel always applied open/close keyframe animation.

Change: the panel now applies `motion-reduce:animate-none`, preserving the existing default animation while making open/close immediate for reduced-motion users.

### 5. Branch-range whitespace

Evaluation: confirmed at the curriculum design date line and EOF.

Change: removed the trailing spaces and extra EOF blank line.

### 6. Admin authorization test only checked guard presence

Evaluation: confirmed. A guard placed after a data mutation would have passed the prior regular expression.

Change: the test policy detector now locates every exported admin action and fails when `requireAdminAction()` is missing or appears after the first recognized data-source/Supabase boundary. A synthetic mutation-before-guard case proves the detector rejects the unsafe ordering; all current actions pass.

### 7. Production expert/subtype synchronization

Evaluation: external deployment state. Public readers prefer non-empty Supabase rows over static seeds, so stale remote experts or inquiry subtypes can override the approved branch content.

Change: `docs/개발상태.md` now requires a pre-deploy comparison of expert fields and an exact sync of the six education subtypes plus `기타`, including placeholders, order, active state, and production CTA checks.

## RED/GREEN evidence

RED command:

```text
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/admin-runtime-mode.test.mts tests/proxy-runtime-contract.test.mts tests/accordion-motion-contract.test.mts tests/admin-actions-auth.test.mts
```

Observed exit: `1`. Expected failures were observed for missing reduced-motion handling, CMS fail-closed policy, bypass-before-client ordering, and the not-yet-created guard-order policy helper.

GREEN command: the same focused command after implementation.

Observed exit: `0`; `8/8` focused tests passed.

## Full verification

```text
npm test && npm run lint && npm run build
```

Observed exit: `0`.

- `npm test`: `30/30` passed, `0` failed.
- `npm run lint`: exit `0`.
- `npm run build`: Next.js `16.2.10` Webpack production build compiled, typechecked, generated `23/23` static pages, and completed route output.

Branch-range check:

```text
git diff --check $(git merge-base main HEAD)..HEAD
```

The exact post-commit command is required to exit `0` before handoff.

## Commit

This report is part of the single fix-wave commit, so its cryptographic SHA cannot self-reference without changing itself. The exact commit SHA is recorded in the task handoff after commit creation. The branch remains unmerged and unpushed.

## Remaining HOLDs

- Challenge provider provisioning and fail-closed server verification.
- Atomic shared rate/quota storage plus approved identity, retention, window, allowance, and retry policy.
- Authenticated Supabase migration removing direct anon/authenticated inquiry INSERT and tightening grants, followed by advisors and the role matrix.
- Production expert and education inquiry-subtype synchronization/CTA verification.

## Self-review

- No process-local rate limit or unverifiable security claim was introduced.
- No secrets, raw challenge tokens, contact values, messages, or service-role values were added to tests, logs, or documentation.
- Photography assets and placements were untouched.
- Curriculum data, track state, CTA routing, and visible UI structure were untouched; only the shared accordion's reduced-motion variant changed.
- Proxy retains the required uninterrupted `createServerClient()` to `getUser()` session-refresh sequence outside explicit development bypass.
- Changes are limited to the validated findings, focused tests, and required operational documentation.
