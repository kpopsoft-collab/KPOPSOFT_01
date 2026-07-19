import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { checkRepositoryBoundary } from "../scripts/check-platform-git-boundaries.mts";

const homepageOrigin = "https://github.com/kpopsoft-collab/KPOPSOFT_01.git";

const inspect = (overrides: Partial<{
  topLevel: string;
  origin: string;
  dirtyPaths: string[];
}> = {}) => async () => ({
  topLevel: "/tmp/homepage",
  origin: homepageOrigin,
  dirtyPaths: [],
  ...overrides,
});

test("rejects a repository whose origin belongs to the other app", async () => {
  const result = await checkRepositoryBoundary({
    name: "homepage",
    cwd: "/tmp/homepage",
    expectedOrigin: homepageOrigin,
    inspect: inspect({
      origin: "https://github.com/h19h29-design/kpopsoft-hub.git",
    }),
  });

  assert.deepEqual(result, {
    ok: false,
    code: "origin_mismatch",
    repository: "homepage",
  });
});

test("rejects a repository checked from the wrong root", async () => {
  const result = await checkRepositoryBoundary({
    name: "homepage",
    cwd: "/tmp/homepage",
    expectedOrigin: homepageOrigin,
    inspect: inspect({ topLevel: "/tmp/homepage/nested" }),
  });

  assert.deepEqual(result, {
    ok: false,
    code: "root_mismatch",
    repository: "homepage",
  });
});

test("rejects an unexpected dirty path", async () => {
  const result = await checkRepositoryBoundary({
    name: "homepage",
    cwd: "/tmp/homepage",
    expectedOrigin: homepageOrigin,
    inspect: inspect({ dirtyPaths: ["src/unrelated-change.ts"] }),
  });

  assert.deepEqual(result, {
    ok: false,
    code: "unexpected_dirty_path",
    repository: "homepage",
  });
});

test("accepts a repository with the expected root, origin, and no dirty paths", async () => {
  const result = await checkRepositoryBoundary({
    name: "homepage",
    cwd: "/tmp/homepage",
    expectedOrigin: homepageOrigin,
    inspect: inspect(),
  });

  assert.deepEqual(result, { ok: true, repository: "homepage" });
});

test("accepts explicitly allowed dirty paths", async () => {
  const result = await checkRepositoryBoundary({
    name: "homepage",
    cwd: "/tmp/homepage",
    expectedOrigin: homepageOrigin,
    allowedDirtyPaths: ["docs/allowed.md"],
    inspect: inspect({ dirtyPaths: ["docs/allowed.md"] }),
  });

  assert.deepEqual(result, { ok: true, repository: "homepage" });
});

test("inspects the current homepage repository without running the CLI on import", async () => {
  const result = await checkRepositoryBoundary({
    name: "homepage",
    cwd: process.cwd(),
    expectedOrigin: homepageOrigin,
    allowedDirtyPaths: [
      "scripts/check-platform-git-boundaries.mts",
      "tests/platform-git-boundaries.test.mts",
    ],
  });

  assert.deepEqual(result, { ok: true, repository: "homepage" });
});

test("reports real platform boundary results through the CLI", async () => {
  const boundaries = [
    {
      name: "homepage" as const,
      cwd: "/Users/mac-mini/Documents/kpopsoft-homepage",
      expectedOrigin: homepageOrigin,
    },
    {
      name: "hub" as const,
      cwd: "/Users/mac-mini/Documents/kpopsoft-hub",
      expectedOrigin: "https://github.com/h19h29-design/kpopsoft-hub.git",
    },
  ];
  const expected = await Promise.all(boundaries.map(checkRepositoryBoundary));
  const cli = spawnSync("npx", ["tsx", "scripts/check-platform-git-boundaries.mts"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(cli.status, expected.every((result) => result.ok) ? 0 : 1);
  assert.equal(
    cli.stdout.trim(),
    expected
      .map((result) =>
        result.ok ? `${result.repository}: ok` : `${result.repository}: ${result.code}`,
      )
      .join("\n"),
  );
  assert.equal(cli.stderr.trim(), "");
});
