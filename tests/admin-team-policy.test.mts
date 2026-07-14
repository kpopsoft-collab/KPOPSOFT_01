import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const readSource = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), "utf8");

test("team changes and audit writes share Neon HTTP transactions", () => {
  const source = readSource("src/lib/admin/admin-users.ts");
  assert.match(source, /\.batch\(/);
  assert.match(source, /auditLogs/);
  assert.match(source, /pg_advisory_xact_lock/);
  assert.match(source, /마지막 활성 관리자는 비활성화할 수 없습니다/);
});

test("settings are team-based and contain no password controls", () => {
  const page = readSource("src/app/admin/(shell)/settings/page.tsx");
  assert.match(page, /TeamManager/);
  assert.doesNotMatch(page, /PasswordForm|비밀번호/);
});

test("team actions validate target identifiers and hide database errors", () => {
  const actions = readSource(
    "src/app/admin/(shell)/settings/team-actions.ts",
  );
  assert.match(actions, /ADMIN_ID_PATTERN\.test\(id\)/);
  assert.match(actions, /typeof active !== "boolean"/);
  assert.match(actions, /SAFE_TEAM_ERRORS/);
});
