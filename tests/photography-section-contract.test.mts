import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (name: string) =>
  readFileSync(join(process.cwd(), "src/components/sections", name), "utf8");

const readAllPhotographySections = () =>
  [
    "company-introduction.tsx",
    "software.tsx",
    "education.tsx",
    "b2b-education.tsx",
  ]
    .map(read)
    .join("\n");

const referenceCount = (source: string, reference: string) =>
  source.split(reference).length - 1;

const assertReferencedExactlyOnce = (
  sectionSource: string,
  allSectionsSource: string,
  reference: string,
) => {
  assert.equal(
    referenceCount(sectionSource, reference),
    1,
    `${reference} must be referenced exactly once in its approved section`,
  );
  assert.equal(
    referenceCount(allSectionsSource, reference),
    1,
    `${reference} must be referenced exactly once across photography sections`,
  );
};

test("company introduction uses the approved office culture image once", () => {
  const source = read("company-introduction.tsx");
  const allSectionsSource = readAllPhotographySections();
  assertReferencedExactlyOnce(
    source,
    allSectionsSource,
    "photography.about.officeCulture",
  );
  assert.doesNotMatch(
    allSectionsSource,
    /photography\.about\.(brandWall|headquarters)/,
  );
});

test("software uses all four approved making-process images", () => {
  const source = read("software.tsx");
  const allSectionsSource = readAllPhotographySections();
  for (const key of ["collaboration", "dashboard", "workstation", "sketch"]) {
    assertReferencedExactlyOnce(
      source,
      allSectionsSource,
      `photography.software.${key}`,
    );
  }
});

test("education and B2B use all approved photography", () => {
  const education = read("education.tsx");
  const b2b = read("b2b-education.tsx");
  const allSectionsSource = readAllPhotographySections();
  for (const key of ["classroom", "workshop"]) {
    assertReferencedExactlyOnce(
      education,
      allSectionsSource,
      `photography.education.${key}`,
    );
  }
  for (const key of ["meetingRoom", "lounge"]) {
    assertReferencedExactlyOnce(
      b2b,
      allSectionsSource,
      `photography.b2b.${key}`,
    );
  }
});

test("education and B2B place the approved lead image first", () => {
  const education = read("education.tsx");
  const b2b = read("b2b-education.tsx");

  assert.ok(
    education.indexOf("photography.education.classroom") <
      education.indexOf("photography.education.workshop"),
  );
  assert.ok(
    b2b.indexOf("photography.b2b.meetingRoom") <
      b2b.indexOf("photography.b2b.lounge"),
  );
});

test("experts use the approved high-resolution portraits", () => {
  const site = readFileSync(join(process.cwd(), "src/lib/site.ts"), "utf8");
  assert.match(site, /\/experts\/안영근02\.png/);
  assert.match(site, /\/experts\/김상혁\.png/);
});
