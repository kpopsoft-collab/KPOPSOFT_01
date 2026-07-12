import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(
  join(process.cwd(), "src/components/ui/editorial-photo.tsx"),
  "utf8",
);

test("editorial photo uses Next Image with responsive sizing", () => {
  assert.match(source, /from "next\/image"/);
  assert.match(source, /sizes=/);
  assert.match(source, /asset\.alt/);
  assert.match(source, /object-cover/);
});
