import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  isAllowedImagePathname,
  validateImageUpload,
} from "../src/lib/media/blob.ts";

test("only safe image types under 10 MB are accepted", () => {
  assert.deepEqual(
    validateImageUpload({
      contentType: "image/webp",
      size: 10 * 1024 * 1024,
    }),
    { ok: true },
  );
  assert.equal(
    validateImageUpload({ contentType: "image/svg+xml", size: 100 }).ok,
    false,
  );
  assert.equal(
    validateImageUpload({
      contentType: "image/png",
      size: 10 * 1024 * 1024 + 1,
    }).ok,
    false,
  );
});

test("blob pathnames stay inside approved content categories", () => {
  assert.equal(
    isAllowedImagePathname(
      "experts/11111111-2222-4333-8444-555555555555.webp",
    ),
    true,
  );
  assert.equal(isAllowedImagePathname("avatars/photo.webp"), false);
  assert.equal(isAllowedImagePathname("work/../secret.webp"), false);
});

test("the upload token route authenticates issuance and records metadata", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/api/admin/uploads/route.ts"),
    "utf8",
  );
  assert.match(source, /await requireAdminAction\(\)/);
  assert.match(source, /maximumSizeInBytes: MAX_IMAGE_BYTES/);
  assert.match(source, /insert\(mediaAssets\)/);
  assert.match(source, /await head\(blob\.url\)/);
});
