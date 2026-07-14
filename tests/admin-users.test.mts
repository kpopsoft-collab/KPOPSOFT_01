import assert from "node:assert/strict";
import test from "node:test";

import {
  canDeactivateAdmin,
  normalizeAdminEmail,
  parseAdminSeedEmails,
} from "../src/lib/admin/admin-users.ts";

test("administrator emails are normalized", () => {
  assert.equal(normalizeAdminEmail(" Team@Example.COM "), "team@example.com");
});

test("the final active administrator cannot be deactivated", () => {
  assert.equal(canDeactivateAdmin(1, true), false);
  assert.equal(canDeactivateAdmin(2, true), true);
  assert.equal(canDeactivateAdmin(1, false), true);
});

test("administrator seed emails are validated without exposing a built-in list", () => {
  assert.deepEqual(
    parseAdminSeedEmails(" Team@Example.com,invalid,SECOND@example.com "),
    ["team@example.com", "second@example.com"],
  );
  assert.throws(
    () => parseAdminSeedEmails("invalid"),
    /ADMIN_SEED_EMAILS must contain at least one valid email/,
  );
});
