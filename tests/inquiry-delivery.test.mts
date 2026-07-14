import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { deliveryPatch } from "../src/lib/inquiries/delivery.ts";

test("email success stores the provider message id", () => {
  assert.deepEqual(deliveryPatch("email", { ok: true, externalId: "msg_1" }), {
    emailStatus: "sent",
    emailMessageId: "msg_1",
    emailError: null,
  });
});

test("delivery errors are sanitized", () => {
  assert.deepEqual(
    deliveryPatch("linear", { ok: false, errorCode: "throttled" }),
    {
      linearStatus: "failed",
      linearError: "throttled",
    },
  );
});

test("duplicate submissions do not trigger delivery twice", () => {
  const action = readFileSync(
    join(process.cwd(), "src/lib/inquiry-actions.ts"),
    "utf8",
  );
  const neon = readFileSync(
    join(process.cwd(), "src/lib/admin/neon-data.ts"),
    "utf8",
  );
  assert.match(action, /if \(created\.created\)/);
  assert.match(action, /deliverInquiry\(created\.inquiry\.id\)/);
  assert.match(neon, /onConflictDoNothing/);
  assert.match(neon, /findInquiryBySubmissionKey/);
});
