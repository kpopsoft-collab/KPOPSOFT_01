# Google Drive Project Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and link project folders in the company Shared Drive and mirror file metadata into Hub without copying file contents or widening Drive permissions.

**Architecture:** Homepage owns Google OAuth refresh credentials, Shared Drive configuration, change cursors, notification channels, and folder creation. Drive notifications enqueue cursor-based change reads; normalized metadata is delivered through the existing signed event contract and upserted into Supabase for a read-only Hub tab.

**Tech Stack:** Google Drive REST API v3 via server-side `fetch`, Neon/Drizzle, Vercel Functions/Cron, Supabase, Next.js, Node test runner, Vitest, Playwright.

## Global Constraints

- Google Drive is a Shared Drive, not a personal My Drive folder.
- Before Task 1, invoke `superpowers:using-git-worktrees` and create homepage branch `codex/google-drive-project-sync` plus Hub branch `codex/hub-drive-project-data` from their reviewed integration baselines.
- Contract version is exactly `2026-07-19.v1`.
- Use a dedicated company-controlled integration account with the narrowest workable scope.
- Store refresh credentials only in homepage Vercel server env.
- Never copy Drive file bodies into Neon or Supabase.
- Store Drive `fileId` as the stable identity; names and paths are mutable metadata.
- Hub links never grant access beyond the permissions already enforced by Drive.
- Change channels expire and must be renewed before expiration.
- `DRIVE_SYNC_ENABLED` starts false and is enabled only after dry-run review.

---

### Task 1: Add Drive Configuration and REST Adapter

**Files (Homepage repository):**
- Create: `src/lib/integrations/drive/config.ts`
- Create: `src/lib/integrations/drive/client.ts`
- Create: `tests/drive-client.test.mts`

**Interfaces:**
- Produces: `getDriveConfig()`, `getDriveAccessToken()`, `listDriveChanges()`, `createProjectFolder()`, and `getDriveFileMetadata()`.

- [ ] **Step 1: Write failing configuration tests**

```ts
test("fails closed without Shared Drive configuration", () => {
  assert.throws(
    () => getDriveConfig({ DRIVE_SYNC_ENABLED: "true" }),
    /Drive integration is not configured/,
  );
});

test("uses supportsAllDrives for Shared Drive requests", async () => {
  await getDriveFileMetadata("file-1", dependencies);
  assert.match(fetchCalls[0].url, /supportsAllDrives=true/);
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- --test-name-pattern="Shared Drive configuration|supportsAllDrives"`

Expected: FAIL because the Drive modules are absent.

- [ ] **Step 3: Implement exact environment ownership**

```ts
export type DriveRuntimeEnv = {
  DRIVE_SYNC_ENABLED?: string;
  GOOGLE_DRIVE_CLIENT_ID?: string;
  GOOGLE_DRIVE_CLIENT_SECRET?: string;
  GOOGLE_DRIVE_REFRESH_TOKEN?: string;
  GOOGLE_SHARED_DRIVE_ID?: string;
  GOOGLE_SHARED_DRIVE_ROOT_FOLDER_ID?: string;
  GOOGLE_DRIVE_WEBHOOK_BASE_URL?: string;
  GOOGLE_DRIVE_WEBHOOK_TOKEN?: string;
};
```

The adapter refreshes an access token using
`https://oauth2.googleapis.com/token`, sets a 10-second timeout, uses
`supportsAllDrives=true`, and requests only needed fields.

- [ ] **Step 4: Implement normalized metadata**

```ts
export type DriveFileMirrorPayload = {
  driveId: string;
  fileId: string;
  parentFileIds: string[];
  name: string;
  mimeType: string;
  webViewLink: string | null;
  modifiedTime: string;
  trashed: boolean;
};
```

- [ ] **Step 5: Run and commit**

```bash
npm test -- --test-name-pattern="Drive"
git add src/lib/integrations/drive tests/drive-client.test.mts
git commit -m "feat: add Shared Drive REST adapter"
```

### Task 2: Persist Drive Links, Cursors, and Channels

**Files (Homepage repository):**
- Create: `database/migrations/0007_drive_sync.sql`
- Modify: `src/lib/db/schema.ts`
- Create: `src/lib/integrations/drive/repository.ts`
- Create: `tests/drive-migration-contract.test.mts`

**Interfaces:**
- Produces: tables `drive_project_folders`, `drive_file_mirrors`, `drive_sync_channels`, and repository methods keyed by Drive file ID.

- [ ] **Step 1: Write the failing migration test**

```ts
for (const table of [
  "drive_project_folders",
  "drive_file_mirrors",
  "drive_sync_channels",
]) {
  assert.match(migration, new RegExp(`create table if not exists ${table}`));
}
assert.match(migration, /drive_file_mirrors_drive_file_uidx/);
assert.match(migration, /drive_sync_channels_channel_id_uidx/);
```

- [ ] **Step 2: Run the test**

Run: `npm test -- --test-name-pattern="Drive sync migration"`

Expected: FAIL because migration `0007` does not exist.

- [ ] **Step 3: Add the additive tables**

`drive_project_folders` links one Hub project to a root Drive folder.
`drive_file_mirrors` stores normalized metadata and `provider_updated_at`.
`drive_sync_channels` stores channel ID, resource ID, page-token cursor,
expiration time, status, and last notification time. Raw OAuth tokens and
notification headers are not stored.

- [ ] **Step 4: Implement newer-wins upsert**

```ts
export async function upsertDriveFile(payload: DriveFileMirrorPayload) {
  return getDb().execute(sql`
    insert into drive_file_mirrors (...)
    values (...)
    on conflict (drive_id, file_id) do update set ...
    where drive_file_mirrors.provider_updated_at < excluded.provider_updated_at
  `);
}
```

- [ ] **Step 5: Run and commit**

```bash
npm test -- --test-name-pattern="Drive sync migration"
git add database/migrations/0007_drive_sync.sql src/lib/db/schema.ts src/lib/integrations/drive/repository.ts tests/drive-migration-contract.test.mts
git commit -m "feat: persist Shared Drive sync state"
```

### Task 3: Receive Notifications and Process the Changes Cursor

**Files (Homepage repository):**
- Create: `src/lib/integrations/drive/notifications.ts`
- Create: `src/lib/integrations/drive/sync.ts`
- Create: `src/app/api/webhooks/google-drive/route.ts`
- Create: `src/app/api/internal/integrations/drive/renew/route.ts`
- Create: `tests/drive-notification.test.mts`
- Create: `tests/drive-sync.test.mts`

**Interfaces:**
- Produces: verified notification receipt, `syncDriveChanges(channelId)`, and `renewDriveChangeChannel()`.

- [ ] **Step 1: Write failing notification tests**

```ts
test("rejects a notification with the wrong channel token", async () => {
  const response = await handleDriveNotification(requestWith({
    "x-goog-channel-token": "wrong",
  }));
  assert.equal(response.status, 401);
});

test("advances the cursor only after all changes are persisted", async () => {
  await assert.rejects(() => syncDriveChanges(dependenciesWithSecondWriteFailure));
  assert.equal(savedCursor, "old-page-token");
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- --test-name-pattern="channel token|advances the cursor"`

Expected: FAIL because notification and sync modules are absent.

- [ ] **Step 3: Implement notification receipt**

The route validates `x-goog-channel-id`, `x-goog-resource-id`, and the configured
channel token, updates only notification metadata, enqueues
`drive.changes.sync:<channelId>:<messageNumber>`, and returns `200` quickly.

- [ ] **Step 4: Implement cursor processing**

Call `changes.list` with:

```text
supportsAllDrives=true
includeItemsFromAllDrives=true
driveId=<shared-drive-id>
restrictToMyDrive=false
spaces=drive
```

Persist every change, emit `drive.file.upserted` or `drive.file.archived`, then
save `newStartPageToken`. Retry 429/5xx with backoff; move 401/403 to
`needs_attention`.

- [ ] **Step 5: Renew channels**

The protected daily route creates the replacement channel before stopping the
old channel and renews when less than 48 hours remain. It records channel IDs
and expirations but not authorization tokens.

- [ ] **Step 6: Run and commit**

```bash
npm test -- --test-name-pattern="Drive"
git add src/lib/integrations/drive src/app/api/webhooks/google-drive src/app/api/internal/integrations/drive tests/drive-notification.test.mts tests/drive-sync.test.mts
git commit -m "feat: sync Shared Drive changes"
```

### Task 4: Add Drive Mirrors to Hub

**Files (Hub repository):**
- Create: `supabase/migrations/20260719140000_add_drive_mirrors.sql`
- Modify: `src/app/api/internal/integrations/events/route.ts`
- Modify: `src/lib/data/types.ts`
- Create: `src/lib/data/drive-files.ts`
- Create: `src/features/projects/drive-files-panel.tsx`
- Modify: `src/app/(app)/projects/[id]/page.tsx`
- Create: `tests/unit/drive-files-panel.test.tsx`
- Create: `tests/e2e/drive-files.spec.ts`

**Interfaces:**
- Consumes: `drive.file.upserted`, `drive.file.archived`, `drive.folder.linked`.
- Produces: RLS-readable `drive_file_mirrors`, `drive_project_folders`, and `Drive 자료` tab.

- [ ] **Step 1: Write the failing panel test**

```tsx
it("shows file metadata and opens the Drive-owned URL", () => {
  render(<DriveFilesPanel files={[file]} folderUrl="https://drive.google.com/drive/folders/root" />);
  expect(screen.getByText("제안서.pdf")).toBeTruthy();
  expect(screen.getByText("PDF")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Drive에서 열기" })).toHaveAttribute("href", file.webViewLink);
});
```

- [ ] **Step 2: Run the test**

Run: `pnpm test -- drive-files-panel`

Expected: FAIL because the panel is missing.

- [ ] **Step 3: Add mirror ingestion and RLS**

Only the service role inserts/updates Drive mirrors. Authenticated team members
may select files linked to active Hub projects. Trashed files remain as archived
metadata and are excluded by default.

- [ ] **Step 4: Implement the responsive tab**

Add `{ key: "drive", label: "Drive 자료", content: driveSection }`.
Show name, type, modified time, folder path label, external link, and copy-link
button. Do not show a download proxy or permission editor.

- [ ] **Step 5: Run and commit**

```bash
pnpm test
pnpm lint
pnpm build
pnpm test:e2e -- drive-files.spec.ts
git add supabase/migrations/20260719140000_add_drive_mirrors.sql src/app/api/internal/integrations/events/route.ts src/lib/data/types.ts src/lib/data/drive-files.ts src/features/projects/drive-files-panel.tsx 'src/app/(app)/projects/[id]/page.tsx' tests/unit/drive-files-panel.test.tsx tests/e2e/drive-files.spec.ts
git commit -m "feat: show Shared Drive files in Hub"
gh auth switch -h github.com -u h19h29-design
git push -u origin codex/hub-drive-project-data
```

### Task 5: Create and Link Project Folders

**Files (Homepage repository):**
- Create: `src/lib/integrations/drive/project-folders.ts`
- Create: `src/app/api/internal/integrations/drive/project-folders/route.ts`
- Create: `tests/drive-project-folders.test.mts`
- Modify: `docs/superpowers/specs/2026-07-19-kpopsoft-platform-orchestration-design.md`

**Interfaces:**
- Consumes: signed `{ hubProjectId, projectCode, projectTitle }`.
- Produces: idempotent folder creation result `{ fileId, webViewLink, created }`.

- [ ] **Step 1: Write the failing idempotency test**

```ts
test("reuses the linked Drive folder on retry", async () => {
  const first = await ensureProjectFolder(input, dependencies);
  const second = await ensureProjectFolder(input, dependencies);
  assert.equal(first.fileId, second.fileId);
  assert.equal(second.created, false);
  assert.equal(createFolderCalls, 1);
});
```

- [ ] **Step 2: Run the test**

Run: `npm test -- --test-name-pattern="reuses the linked Drive folder"`

Expected: FAIL because `ensureProjectFolder` does not exist.

- [ ] **Step 3: Implement folder naming and linkage**

Folder name:

```ts
const folderName = `${sanitize(projectCode ?? "NO-CODE")} ${sanitize(projectTitle)}`.slice(0, 120);
```

Check `drive_project_folders` before creating. Create under
`GOOGLE_SHARED_DRIVE_ROOT_FOLDER_ID`, persist the returned file ID, emit
`drive.folder.linked`, and return the existing link on every retry.

- [ ] **Step 4: Preview dry-run and smoke**

Dry-run reports planned folders and conflicts without writes. After review,
enable `DRIVE_SYNC_ENABLED=true` in Preview, create one test project folder,
add/rename/trash one test file, and verify Hub metadata after each change.

- [ ] **Step 5: Run gates, commit, and push**

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
git add src/lib/integrations/drive/project-folders.ts src/app/api/internal/integrations/drive/project-folders/route.ts tests/drive-project-folders.test.mts docs/superpowers/specs/2026-07-19-kpopsoft-platform-orchestration-design.md
git commit -m "feat: link Hub projects to Shared Drive folders"
gh auth switch -h github.com -u kpopsoft-collab
git push -u origin codex/google-drive-project-sync
```

The Hub Drive branch was pushed in Task 4 only after its full gates passed.
