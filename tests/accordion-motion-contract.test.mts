import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(
  join(process.cwd(), "src/components/ui/accordion.tsx"),
  "utf8",
);

test("accordion open and close animation respects reduced-motion preferences", () => {
  const content = source.slice(source.indexOf("function AccordionContent"));

  assert.match(content, /motion-reduce:animate-none/);
});
