# Education Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat education program list with six responsive curriculum tracks organized as `입문 → 실무 → 프로젝트`, with matching inquiry routing.

**Architecture:** Keep curriculum content in `src/lib/site.ts` as a typed `educationTracks` source and keep the section presentational. Reuse the installed Base UI accordion wrapper for accessible single-open behavior, with a controlled `openTrackId` so the first track starts open and a second click can close it. Update the static inquiry-option seed and B2B CTA in the same slice so every track CTA resolves to a valid education subtype.

**Tech Stack:** Next.js 16.2, React 19.2, TypeScript 5, Tailwind CSS 4, Base UI Accordion, Lucide React, Node.js 22 test runner.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-12-education-curriculum-design.md` exactly.
- Keep the official logo and all homepage sections outside Education unchanged.
- Use six tracks in this order: `AI 기초교육`, `업무용 AI`, `바이브 코딩`, `AI 자동화`, `콘텐츠·동영상 제작`, `기업 맞춤·프로젝트`.
- Every track has exactly three stages in this order: `입문`, `실무`, `프로젝트`.
- Reuse `src/components/ui/accordion.tsx`; do not create a second accordion primitive.
- Do not add generated images, gradients, bento cards, new routes, or education CMS tables.
- Mobile verification target is 390px with at least 20px side spacing and 48px interactive targets.
- Preserve the existing public inquiry flow and update only education subtype labels.

---

### Task 1: Replace flat programs with a typed curriculum contract

**Files:**
- Create: `tests/education-tracks.test.mts`
- Modify: `src/lib/site.ts`

**Interfaces:**
- Produces: `EducationStage`, `EducationTrack`, `educationTracks`
- Consumes: existing `Accent` and `inquiryOptions` contracts from `src/lib/site.ts`

- [ ] **Step 1: Write the failing curriculum contract test**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { educationTracks, inquiryOptions } from "../src/lib/site.ts";

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
    assert.deepEqual(track.stages.map((stage) => stage.level), ["입문", "실무", "프로젝트"]);
    assert.ok(track.stages.every((stage) => stage.modules.length > 0));
  }
});

test("every track inquiry subtype exists in the static education options", () => {
  const education = inquiryOptions.find((option) => option.type === "교육 문의");
  assert.ok(education);
  const labels = new Set(education.subtypes.map((subtype) => subtype.label));
  for (const track of educationTracks) assert.ok(labels.has(track.inquirySubtype));
});
```

- [ ] **Step 2: Run RED**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/education-tracks.test.mts`

Expected: FAIL because `educationTracks` is not exported.

- [ ] **Step 3: Add the typed six-track data source**

Define the two exported types from the approved spec, replace `programs` with `educationTracks`, and include complete title, description, tags, accent, three stages, outcome, and `inquirySubtype` values for all six tracks.

- [ ] **Step 4: Align static education inquiry options**

Replace the education subtype seed with the same six labels plus `기타`. Each label receives a specific placeholder that asks for audience, headcount, goal, and desired schedule.

- [ ] **Step 5: Run GREEN**

Run: `npm test && npm run lint`

Expected: all curriculum and existing security/inquiry tests pass; ESLint exits 0.

---

### Task 2: Build the responsive single-open curriculum accordion

**Files:**
- Modify: `src/components/sections/education.tsx`
- Create: `tests/education-section-contract.test.mts`

**Interfaces:**
- Consumes: `educationTracks`, `accentBg`, `sectionId`
- Produces: accessible single-open accordion with one inquiry CTA per track

- [ ] **Step 1: Write a failing source contract test**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(join(process.cwd(), "src/components/sections/education.tsx"), "utf8");

test("education uses the shared accordion and curriculum track source", () => {
  assert.match(source, /educationTracks/);
  assert.match(source, /AccordionItem/);
  assert.match(source, /default|openTrackId/);
  assert.doesNotMatch(source, /ProgramDetail|SheetContent/);
});

test("education renders the approved stages and consultation CTA", () => {
  assert.match(source, /track\.stages\.map/);
  assert.match(source, /이 교육 상담하기/);
  assert.match(source, /encodeURIComponent\(track\.inquirySubtype\)/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/education-section-contract.test.mts`

Expected: FAIL because the current section imports `programs` and uses `SheetContent`.

- [ ] **Step 3: Replace the Sheet list with the shared Accordion**

Use `useState<string | null>(educationTracks[0].id)`, pass the controlled array value to `Accordion`, keep `multiple={false}`, and render each track as `AccordionItem value={track.id}`. `AccordionTrigger` contains index, title, description, and tags. `AccordionContent` renders a responsive `md:grid-cols-3` stage layout, outcome, and CTA.

- [ ] **Step 4: Preserve responsive and accessibility contracts**

Use full-width hairline rows, `min-h-12` triggers, `px-0` on the existing Section container, `grid-cols-1 md:grid-cols-3` for stages, no fixed widths, and the shared Accordion's native button/ARIA wiring. The CTA URL is:

```ts
`/?ct=${encodeURIComponent("교육 문의")}&cs=${encodeURIComponent(track.inquirySubtype)}#${sectionId.contact}`
```

- [ ] **Step 5: Run GREEN**

Run: `npm test && npm run lint && npm run build`

Expected: all tests pass, lint exits 0, and the Next.js Webpack build succeeds.

---

### Task 3: Align B2B routing and verify desktop/mobile behavior

**Files:**
- Modify: `src/components/sections/b2b-education.tsx`
- Modify: `docs/기획서.md`
- Modify: `docs/개발상태.md`

**Interfaces:**
- Consumes: approved subtype `기업 맞춤·프로젝트`
- Produces: consistent B2B CTA and current project documentation

- [ ] **Step 1: Add the B2B label assertion to the curriculum test**

Read `src/components/sections/b2b-education.tsx` and assert it contains `기업 맞춤·프로젝트` and no longer contains the old query label `기업 맞춤형 교육`.

- [ ] **Step 2: Run RED**

Run: `npm test`

Expected: FAIL because the B2B CTA still uses `기업 맞춤형 교육`.

- [ ] **Step 3: Update B2B routing and docs**

Change only the B2B CTA subtype. Replace the flat education list in `docs/기획서.md` with the six approved tracks and record the curriculum accordion in `docs/개발상태.md`.

- [ ] **Step 4: Run full verification**

Run: `npm test && npm run lint && npm run build && git diff --check`

Expected: 0 test failures, ESLint exit 0, successful production build, and no whitespace errors.

- [ ] **Step 5: Browser verification**

Run the local Next.js server, inspect `/#education` at 1440px, 768px, and 390px, and verify: first track open; opening another closes the first; re-click closes it; all six track titles render; no horizontal overflow; CTA reaches `#contact` with `ct=교육 문의` and the matching `cs` value.
