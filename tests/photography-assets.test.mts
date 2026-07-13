import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { photography, photographyAssets } from "../src/lib/photography.ts";

const approvedPhotographyPaths = [
  "/images/kpopsoft/about-office-culture.jpg",
  "/images/kpopsoft/software-collaboration.jpg",
  "/images/kpopsoft/software-dashboard.jpg",
  "/images/kpopsoft/software-workstation.jpg",
  "/images/kpopsoft/software-sketch.jpg",
  "/images/kpopsoft/education-classroom.jpg",
  "/images/kpopsoft/education-workshop.jpg",
  "/images/kpopsoft/b2b-meeting-room.jpg",
  "/images/kpopsoft/b2b-lounge.jpg",
] as const;

test("photography manifest exposes nine unique approved scenes", () => {
  assert.equal(photographyAssets.length, 9);
  assert.equal(new Set(photographyAssets.map((asset) => asset.src)).size, 9);
  assert.deepEqual(Object.keys(photography), [
    "about",
    "software",
    "education",
    "b2b",
  ]);
  assert.deepEqual(Object.keys(photography.about), ["officeCulture"]);
});

test("photography manifest uses the exact nine approved paths", () => {
  assert.deepEqual(
    new Set(photographyAssets.map((asset) => asset.src)),
    new Set(approvedPhotographyPaths),
  );
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
