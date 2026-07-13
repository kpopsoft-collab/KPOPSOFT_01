import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

const accordion = read("src/components/ui/accordion.tsx");
const education = read("src/components/sections/education.tsx");
const software = read("src/components/sections/software.tsx");
const b2bEducation = read("src/components/sections/b2b-education.tsx");
const tag = read("src/components/ui/tag.tsx");

const consultationLabelIndex = education.indexOf("이 교육 상담하기");
const consultationLink = education.slice(
  education.lastIndexOf("<Link", consultationLabelIndex),
  education.indexOf("</Link>", consultationLabelIndex),
);
const triggerMarkup = education.slice(
  education.indexOf("<AccordionTrigger"),
  education.indexOf("</AccordionTrigger>") + "</AccordionTrigger>".length,
);

test("education consultation CTA opts out of accordion prose-link styling", () => {
  assert.match(
    consultationLink,
    /data-accordion-link-style="custom"/,
  );
  assert.match(consultationLink, /\bno-underline\b/);
  assert.match(consultationLink, /\bhover:bg-brand-navy\b/);
  assert.match(consultationLink, /\bhover:text-white\b/);
  assert.match(consultationLink, /\bfocus-visible:ring-3\b/);

  assert.match(
    accordion,
    /\[&_a:not\(\[data-accordion-link-style\]\)\]:underline/,
  );
  assert.match(
    accordion,
    /\[&_a:not\(\[data-accordion-link-style\]\)\]:hover:text-foreground/,
  );
  assert.doesNotMatch(accordion, /\[&_a\]:underline/);
  assert.doesNotMatch(accordion, /\[&_a\]:hover:text-foreground/);
});

test("education accordion trigger contains phrasing Tag spans with stable keys", () => {
  assert.match(education, /import \{ Tag \} from "@\/components\/ui\/tag"/);
  assert.doesNotMatch(triggerMarkup, /\bTagList\b/);
  assert.match(triggerMarkup, /track\.tags\.map\(\(tag\) =>/);
  assert.match(triggerMarkup, /<Tag key=\{tag\}>\{tag\}<\/Tag>/);

  const tagComponent = tag.slice(
    tag.indexOf("export function Tag("),
    tag.indexOf("export function TagList("),
  );
  assert.match(tagComponent, /<span/);
  assert.doesNotMatch(tagComponent, /<(?:ul|ol|li)\b/);
});

test("software uses an 8/4 desktop photo grid with a deliberate nested support grid", () => {
  assert.match(
    software,
    /asset=\{photography\.software\.collaboration\}[\s\S]*?className="aspect-video lg:col-span-8"/,
  );
  assert.match(
    software,
    /className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4"/,
  );
  assert.match(
    software,
    /asset=\{photography\.software\.dashboard\}[\s\S]*?className="aspect-\[4\/3\] sm:col-span-2"/,
  );
  assert.match(
    software,
    /asset=\{photography\.software\.workstation\}[\s\S]*?className="aspect-\[4\/3\]"/,
  );
  assert.match(
    software,
    /asset=\{photography\.software\.sketch\}[\s\S]*?className="aspect-\[4\/3\]"/,
  );
  assert.doesNotMatch(software, /lg:row-span-2|lg:aspect-auto/);
});

test("software preserves photo order and caps responsive image hints", () => {
  const references = [
    "photography.software.collaboration",
    "photography.software.dashboard",
    "photography.software.workstation",
    "photography.software.sketch",
  ];

  for (let index = 1; index < references.length; index += 1) {
    assert.ok(
      software.indexOf(references[index - 1]) <
        software.indexOf(references[index]),
      `${references[index - 1]} must precede ${references[index]}`,
    );
  }

  assert.match(
    software,
    /sizes="\(min-width: 1440px\) 860px, \(min-width: 1024px\) 66vw, 100vw"/,
  );
  assert.match(
    software,
    /sizes="\(min-width: 1440px\) 420px, \(min-width: 1024px\) 33vw, 100vw"/,
  );
  assert.equal(
    software.match(
      /sizes="\(min-width: 1440px\) 205px, \(min-width: 1024px\) 16vw, \(min-width: 640px\) 50vw, 100vw"/g,
    )?.length,
    2,
  );
});

test("education and B2B cap image hints above the editorial container", () => {
  assert.match(
    education,
    /sizes="\(min-width: 1440px\) 860px, \(min-width: 1024px\) 66vw, 100vw"/,
  );
  assert.match(
    education,
    /sizes="\(min-width: 1440px\) 420px, \(min-width: 1024px\) 34vw, 100vw"/,
  );
  assert.equal(
    b2bEducation.match(
      /sizes="\(min-width: 1440px\) 440px, \(min-width: 1024px\) 34vw, 100vw"/g,
    )?.length,
    2,
  );
});

test("status and design documentation reflect the reviewed implementation", () => {
  const status = read("docs/개발상태.md");
  const design = read("docs/디자인.md");

  assert.match(status, /마지막 확인: 2026-07-13/);
  assert.match(status, /`npm test` 통과 \(32개\)/);
  assert.doesNotMatch(design, /Asymmetric colorful program grid\./);
  assert.match(
    design,
    /목적 중심의 6개 트랙을 입문 → 실무 → 프로젝트 흐름으로 보여 주는 커리큘럼 아코디언\./,
  );
});
