import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(process.cwd(), "src/app/admin/(shell)");

function actionFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return actionFiles(path);
    return entry.name === "actions.ts" ? [path] : [];
  });
}

test("every admin mutation re-authorizes inside its server action", () => {
  for (const file of actionFiles(root)) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /import \{ requireAdminAction \}/, file);

    const exports = source.split(/export async function /).slice(1);
    assert.ok(exports.length > 0, `${file} has no exported server actions`);
    for (const body of exports) {
      assert.match(body, /await requireAdminAction\(\)/, file);
    }
  }
});
