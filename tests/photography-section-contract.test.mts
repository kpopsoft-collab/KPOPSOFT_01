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
