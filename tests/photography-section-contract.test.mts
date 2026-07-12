import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (name: string) =>
  readFileSync(join(process.cwd(), "src/components/sections", name), "utf8");

test("company introduction uses both approved company images", () => {
  const source = read("company-introduction.tsx");
  assert.match(source, /photography\.about\.brandWall/);
  assert.match(source, /photography\.about\.headquarters/);
});

test("software uses all four approved making-process images", () => {
  const source = read("software.tsx");
  for (const key of ["collaboration", "dashboard", "workstation", "sketch"]) {
    assert.match(source, new RegExp(`photography\\.software\\.${key}`));
  }
});

test("education and B2B use all approved photography", () => {
  const education = read("education.tsx");
  const b2b = read("b2b-education.tsx");
  assert.match(education, /photography\.education\.workshop/);
  assert.match(education, /photography\.education\.classroom/);
  assert.match(b2b, /photography\.b2b\.lounge/);
  assert.match(b2b, /photography\.b2b\.meetingRoom/);
});

test("experts use the approved high-resolution portraits", () => {
  const site = readFileSync(join(process.cwd(), "src/lib/site.ts"), "utf8");
  assert.match(site, /\/experts\/안영근02\.png/);
  assert.match(site, /\/experts\/김상혁\.png/);
});
