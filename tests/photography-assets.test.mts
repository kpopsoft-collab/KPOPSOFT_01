import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { photography, photographyAssets } from "../src/lib/photography.ts";

const approvedPhotographyPathMap = {
  about: {
    officeCulture: "/images/kpopsoft/about-office-culture.jpg",
  },
  software: {
    collaboration: "/images/kpopsoft/software-collaboration.jpg",
    dashboard: "/images/kpopsoft/software-dashboard.jpg",
    workstation: "/images/kpopsoft/software-workstation.jpg",
    sketch: "/images/kpopsoft/software-sketch.jpg",
  },
  education: {
    classroom: "/images/kpopsoft/education-classroom.jpg",
    workshop: "/images/kpopsoft/education-workshop.jpg",
  },
  b2b: {
    meetingRoom: "/images/kpopsoft/b2b-meeting-room.jpg",
    lounge: "/images/kpopsoft/b2b-lounge.jpg",
  },
} as const;

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

test("photography manifest uses the exact approved key-to-path mapping", () => {
  const photographyPathMap = Object.fromEntries(
    Object.entries(photography).map(([groupName, assets]) => [
      groupName,
      Object.fromEntries(
        Object.entries(assets).map(([assetName, asset]) => [
          assetName,
          asset.src,
        ]),
      ),
    ]),
  );
  assert.deepEqual(photographyPathMap, approvedPhotographyPathMap);
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
