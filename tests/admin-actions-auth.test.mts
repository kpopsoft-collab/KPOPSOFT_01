import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { findAdminActionGuardViolations } from "./helpers/admin-action-policy.mts";

const root = join(process.cwd(), "src/app/admin/(shell)");

function actionFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return actionFiles(path);
    return entry.name === "actions.ts" ? [path] : [];
  });
}

test("the policy detector rejects a guard placed after a mutation", () => {
  const source = `
    export async function unsafeAction() {
      await getAdminData().updateInquiry("id", {});
      await requireAdminAction();
    }
  `;

  assert.deepEqual(findAdminActionGuardViolations(source), ["unsafeAction"]);
});

test("every admin mutation re-authorizes before touching its data source", () => {
  for (const file of actionFiles(root)) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /import \{ requireAdminAction \}/, file);
    assert.deepEqual(findAdminActionGuardViolations(source), [], file);
  }
});
