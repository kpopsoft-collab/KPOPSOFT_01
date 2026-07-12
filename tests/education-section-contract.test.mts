import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(
  join(process.cwd(), "src/components/sections/education.tsx"),
  "utf8",
);

test("education renders curriculum tracks through the shared accordion", () => {
  assert.match(source, /educationTracks/);
  assert.match(source, /AccordionItem/);
  assert.match(source, /openTrackId/);
  assert.doesNotMatch(source, /ProgramDetail|SheetContent/);
});

test("education exposes every stage and a track-specific consultation CTA", () => {
  assert.match(source, /track\.stages\.map/);
  assert.match(source, /이 교육 상담하기/);
  assert.match(source, /encodeURIComponent\(track\.inquirySubtype\)/);
});
