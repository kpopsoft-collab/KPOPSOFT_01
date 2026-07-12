import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { photography, photographyAssets } from "../src/lib/photography.ts";

test("photography manifest exposes all ten approved scenes", () => {
  assert.equal(photographyAssets.length, 10);
  assert.deepEqual(Object.keys(photography), [
    "about",
    "software",
    "education",
    "b2b",
  ]);
});

test("every photography asset exists and has accessible copy", () => {
  for (const asset of photographyAssets) {
    assert.ok(existsSync(join(process.cwd(), "public", asset.src)));
    assert.ok(asset.alt.trim().length >= 10);
  }
});

test("approved high-resolution instructor portraits exist", () => {
  for (const src of ["experts/안영근02.png", "experts/김상혁.png"]) {
    assert.ok(existsSync(join(process.cwd(), "public", src)));
  }
});
