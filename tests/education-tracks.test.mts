import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  businesses,
  educationTracks,
  inquiryOptions,
} from "../src/lib/site.ts";

test("education exposes six unique ordered tracks", () => {
  assert.deepEqual(
    educationTracks.map(({ index, title }) => [index, title]),
    [
      ["01", "AI 기초교육"],
      ["02", "업무용 AI"],
      ["03", "바이브 코딩"],
      ["04", "AI 자동화"],
      ["05", "콘텐츠·동영상 제작"],
      ["06", "기업 맞춤·프로젝트"],
    ],
  );
  assert.equal(new Set(educationTracks.map((track) => track.id)).size, 6);
});

test("every education track follows the same three-stage curriculum", () => {
  for (const track of educationTracks) {
    assert.deepEqual(
      track.stages.map((stage) => stage.level),
      ["입문", "실무", "프로젝트"],
    );
    assert.ok(track.stages.every((stage) => stage.modules.length > 0));
  }
});

test("every track inquiry subtype exists in the static education options", () => {
  const education = inquiryOptions.find(
    (option) => option.type === "교육 문의",
  );
  assert.ok(education);
  const labels = new Set(
    education.subtypes.map((subtype) => subtype.label),
  );
  for (const track of educationTracks) {
    assert.ok(labels.has(track.inquirySubtype));
  }
});

test("the business overview lists the same six education tracks", () => {
  const education = businesses.find((business) => business.title === "EDUCATION");
  assert.ok(education);
  assert.deepEqual(education.items, educationTracks.map((track) => track.title));
});

test("the B2B education CTA uses the approved custom-project subtype", () => {
  const source = readFileSync(
    join(process.cwd(), "src/components/sections/b2b-education.tsx"),
    "utf8",
  );
  assert.match(source, /기업 맞춤·프로젝트/);
  assert.doesNotMatch(
    source,
    /encodeURIComponent\(\s*"기업 맞춤형 교육"/,
  );
});
