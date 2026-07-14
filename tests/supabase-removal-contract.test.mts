import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

test("production source has no Supabase or Resend runtime dependency", () => {
  const files = execFileSync("rg", ["--files", "src"], {
    encoding: "utf8",
  })
    .trim()
    .split("\n");
  const source = files.map((file) => readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(
    source,
    /@supabase|SUPABASE_|RESEND_|from ["']resend["']/,
  );
});
