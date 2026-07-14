import assert from "node:assert/strict";
import test from "node:test";

import { mapCloudflareEmailResponse } from "../src/lib/integrations/cloudflare-email.ts";

test("delivered recipients produce a sent result", () => {
  assert.deepEqual(
    mapCloudflareEmailResponse({
      message_id: "message-1",
      delivered: ["ops@example.com"],
      queued: [],
      permanent_bounces: [],
    }),
    { ok: true, externalId: "message-1" },
  );
});

test("queued-only responses remain retryable", () => {
  assert.deepEqual(
    mapCloudflareEmailResponse({
      message_id: "message-2",
      delivered: [],
      queued: ["ops@example.com"],
      permanent_bounces: [],
    }),
    { ok: false, errorCode: "queued" },
  );
});

test("permanent bounces return a sanitized code", () => {
  assert.deepEqual(
    mapCloudflareEmailResponse({
      message_id: "message-3",
      delivered: [],
      queued: [],
      permanent_bounces: ["ops@example.com"],
    }),
    { ok: false, errorCode: "permanent_bounce" },
  );
});
