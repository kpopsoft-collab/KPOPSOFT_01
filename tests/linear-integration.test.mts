import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLinearIssueInput,
  createLinearIssue,
} from "../src/lib/integrations/linear.ts";
import type { Inquiry } from "../src/lib/admin/types.ts";

const inquiry: Inquiry = {
  id: "11111111-2222-4333-8444-555555555555",
  submissionKey: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  type: "교육 문의",
  subtype: "바이브 코딩",
  sender: "KPOPSOFT",
  contact: "hello@example.com",
  message: "교육 일정과 견적을 요청합니다.",
  status: "new",
  memo: "",
  emailStatus: "pending",
  emailMessageId: null,
  emailSentAt: null,
  emailError: null,
  linearStatus: "pending",
  linearIssueId: null,
  linearIssueUrl: null,
  linearError: null,
  createdAt: "2026-07-14T00:00:00.000Z",
  updatedAt: "2026-07-14T00:00:00.000Z",
};

test("Linear issue payload contains the inquiry reference", () => {
  const input = buildLinearIssueInput(inquiry, {
    teamId: "team-1",
    projectId: "project-1",
    adminBaseUrl: "https://kpopsoft.com/admin/inquiries",
  });
  assert.equal(input.teamId, "team-1");
  assert.match(input.title ?? "", /교육 문의/);
  assert.match(input.description ?? "", new RegExp(inquiry.id));
  assert.equal(input.projectId, "project-1");
});

test("an existing Linear issue skips creation", async () => {
  const result = await createLinearIssue({
    ...inquiry,
    linearIssueId: "existing",
  });
  assert.deepEqual(result, {
    ok: true,
    externalId: "existing",
    skipped: true,
  });
});
