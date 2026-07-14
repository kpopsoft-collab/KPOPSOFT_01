import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const readScript = (name: string) =>
  readFileSync(join(process.cwd(), "scripts", name), "utf8");

test("the migration runner records sorted migration filenames", () => {
  const source = readScript("migrate-neon.mts");
  assert.match(source, /schema_migrations/);
  assert.match(source, /\.sort\(/);
  assert.match(source, /Client/);
  assert.doesNotMatch(source, /console\.log\([^)]*DATABASE_URL/);
});

test("the seed runner requires runtime administrator emails and upserts content", () => {
  const source = readScript("seed-neon.mts");
  assert.match(source, /ADMIN_SEED_EMAILS/);
  assert.match(source, /parseAdminSeedEmails/);
  assert.match(source, /on conflict/);
  for (const collection of [
    "inquiryOptions",
    "selectedWork",
    "insights",
    "testimonials",
    "experts",
    "stats",
  ]) {
    assert.match(source, new RegExp(collection));
  }
  assert.doesNotMatch(source, /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
});
