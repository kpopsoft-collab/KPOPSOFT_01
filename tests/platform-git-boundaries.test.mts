import assert from "node:assert/strict";
import test from "node:test";

import {
  checkRepositoryBoundary,
  createGitInspector,
  parseDirtyPaths,
  runPlatformBoundaryCli,
  runPlatformBoundaryCliMain,
} from "../scripts/check-platform-git-boundaries.mts";

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

test("parses worktree rename records as both destination and source paths", () => {
  assert.deepEqual(parseDirtyPaths(" R destination\0source\0"), [
    "destination",
    "source",
  ]);
});

test("parses index rename and copy records as both destination and source paths", () => {
  assert.deepEqual(parseDirtyPaths("R  renamed\0original\0C  copied\0template\0"), [
    "renamed",
    "original",
    "copied",
    "template",
  ]);
});

test("rejects a renamed source path that is not allowlisted", async () => {
  const result = await checkRepositoryBoundary({
    name: "homepage",
    cwd: "/tmp/homepage",
    expectedOrigin: homepageOrigin,
    allowedDirtyPaths: ["destination"],
    inspect: inspect({ dirtyPaths: parseDirtyPaths(" R destination\0source\0") }),
  });

  assert.deepEqual(result, {
    ok: false,
    code: "unexpected_dirty_path",
    repository: "homepage",
  });
});

test("forces Git status to report a dirty submodule despite local ignore settings", async () => {
  const calls: string[][] = [];
  const inspectGit = createGitInspector(async (_cwd, args) => {
    calls.push([...args]);
    if (args[0] === "rev-parse") return "/tmp/homepage\n";
    if (args[0] === "remote") return `${homepageOrigin}\n`;
    return args.includes("--ignore-submodules=none") ? " M vendor/hub\0" : "";
  });

  const result = await checkRepositoryBoundary({
    name: "homepage",
    cwd: "/tmp/homepage",
    expectedOrigin: homepageOrigin,
    inspect: () => inspectGit("/tmp/homepage"),
  });

  assert.deepEqual(calls.find((args) => args[0] === "status"), [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "--ignore-submodules=none",
    "-z",
  ]);
  assert.deepEqual(result, {
    ok: false,
    code: "unexpected_dirty_path",
    repository: "homepage",
  });
});

const captureCli = () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    output: {
      log: (line: string) => stdout.push(line),
      error: (line: string) => stderr.push(line),
    },
    stderr,
    stdout,
  };
};

test("reports exact success output from the deterministic CLI runner", async () => {
  const capture = captureCli();
  const exitCode = await runPlatformBoundaryCli({
    check: async (boundary) => ({ ok: true, repository: boundary.name }),
    output: capture.output,
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(capture.stdout, ["homepage: ok", "hub: ok"]);
  assert.deepEqual(capture.stderr, []);
});

for (const code of ["root_mismatch", "origin_mismatch", "unexpected_dirty_path"] as const) {
  test(`returns a non-zero outcome for ${code}`, async () => {
    const capture = captureCli();
    const exitCode = await runPlatformBoundaryCli({
      check: async (boundary) =>
        boundary.name === "homepage"
          ? { ok: false, code, repository: boundary.name }
          : { ok: true, repository: boundary.name },
      output: capture.output,
    });

    assert.equal(exitCode, 1);
    assert.deepEqual(capture.stdout, [`homepage: ${code}`, "hub: ok"]);
    assert.deepEqual(capture.stderr, []);
  });
}

test("returns a non-zero outcome and exact error output for inspection errors", async () => {
  const capture = captureCli();
  const exitCode = await runPlatformBoundaryCli({
    check: async () => {
      throw new Error("Git inspection failed");
    },
    output: capture.output,
  });

  assert.equal(exitCode, 1);
  assert.deepEqual(capture.stdout, []);
  assert.deepEqual(capture.stderr, ["repository boundary check failed"]);
});

test("sets a failing exit code through the direct CLI main", async () => {
  const exit = { exitCode: undefined as number | undefined };

  await runPlatformBoundaryCliMain(
    {
      check: async (boundary) =>
        boundary.name === "homepage"
          ? { ok: false, code: "root_mismatch", repository: boundary.name }
          : { ok: true, repository: boundary.name },
      output: captureCli().output,
    },
    exit,
  );

  assert.equal(exit.exitCode, 1);
});
