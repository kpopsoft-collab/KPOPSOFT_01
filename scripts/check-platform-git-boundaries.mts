import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type RepositoryBoundary = {
  name: "homepage" | "hub";
  cwd: string;
  expectedOrigin: string;
  allowedDirtyPaths?: string[];
  inspect?: () => Promise<GitRepositoryState>;
};

export type BoundaryResult =
  | { ok: true; repository: string }
  | {
      ok: false;
      code: "root_mismatch" | "origin_mismatch" | "unexpected_dirty_path";
      repository: string;
    };

type GitRepositoryState = {
  topLevel: string;
  origin: string;
  dirtyPaths: string[];
};

const platformBoundaries: RepositoryBoundary[] = [
  {
    name: "homepage",
    cwd: "/Users/mac-mini/Documents/kpopsoft-homepage",
    expectedOrigin: "https://github.com/kpopsoft-collab/KPOPSOFT_01.git",
  },
  {
    name: "hub",
    cwd: "/Users/mac-mini/Documents/kpopsoft-hub",
    expectedOrigin: "https://github.com/h19h29-design/kpopsoft-hub.git",
  },
];

function parseDirtyPaths(status: string): string[] {
  const entries = status.split("\0");
  const paths: string[] = [];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry) continue;

    const statusCode = entry.slice(0, 2);
    paths.push(entry.slice(3));

    if (statusCode[0] === "R" || statusCode[0] === "C") {
      const originalPath = entries[index + 1];
      if (originalPath) paths.push(originalPath);
      index += 1;
    }
  }

  return paths;
}

async function inspectGit(cwd: string): Promise<GitRepositoryState> {
  const [topLevel, origin, status] = await Promise.all([
    execFileAsync("git", ["rev-parse", "--show-toplevel"], { cwd }),
    execFileAsync("git", ["remote", "get-url", "origin"], { cwd }),
    execFileAsync(
      "git",
      ["status", "--porcelain=v1", "--untracked-files=all", "-z"],
      { cwd },
    ),
  ]);

  return {
    topLevel: topLevel.stdout.trim(),
    origin: origin.stdout.trim(),
    dirtyPaths: parseDirtyPaths(status.stdout),
  };
}

export async function checkRepositoryBoundary(
  input: RepositoryBoundary,
): Promise<BoundaryResult> {
  const state = await (input.inspect?.() ?? inspectGit(input.cwd));

  if (state.topLevel !== input.cwd) {
    return { ok: false, code: "root_mismatch", repository: input.name };
  }

  if (state.origin !== input.expectedOrigin) {
    return { ok: false, code: "origin_mismatch", repository: input.name };
  }

  const allowedPaths = new Set(input.allowedDirtyPaths ?? []);
  if (state.dirtyPaths.some((path) => !allowedPaths.has(path))) {
    return {
      ok: false,
      code: "unexpected_dirty_path",
      repository: input.name,
    };
  }

  return { ok: true, repository: input.name };
}

async function runCli(): Promise<void> {
  try {
    const results = await Promise.all(platformBoundaries.map(checkRepositoryBoundary));
    for (const result of results) {
      console.log(result.ok ? `${result.repository}: ok` : `${result.repository}: ${result.code}`);
    }
    if (results.some((result) => !result.ok)) process.exitCode = 1;
  } catch {
    console.error("repository boundary check failed");
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath && fileURLToPath(import.meta.url) === resolve(invokedPath)) {
  void runCli();
}
