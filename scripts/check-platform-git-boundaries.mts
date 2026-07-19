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

export type GitCommandRunner = (cwd: string, args: string[]) => Promise<string>;

export type CliOutput = {
  log: (line: string) => void;
  error: (line: string) => void;
};

export type CliDependencies = {
  check?: (boundary: RepositoryBoundary) => Promise<BoundaryResult>;
  output?: CliOutput;
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

export function parseDirtyPaths(status: string): string[] {
  const entries = status.split("\0");
  const paths: string[] = [];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry) continue;

    const statusCode = entry.slice(0, 2);
    paths.push(entry.slice(3));

    if (statusCode.includes("R") || statusCode.includes("C")) {
      const originalPath = entries[index + 1];
      if (originalPath) paths.push(originalPath);
      index += 1;
    }
  }

  return paths;
}

const runGitCommand: GitCommandRunner = async (cwd, args) => {
  const result = await execFileAsync("git", args, { cwd });
  return result.stdout;
};

export function createGitInspector(runGit: GitCommandRunner = runGitCommand) {
  return async (cwd: string): Promise<GitRepositoryState> => {
    const [topLevel, origin, status] = await Promise.all([
      runGit(cwd, ["rev-parse", "--show-toplevel"]),
      runGit(cwd, ["remote", "get-url", "origin"]),
      runGit(cwd, [
        "status",
        "--porcelain=v1",
        "--untracked-files=all",
        "--ignore-submodules=none",
        "-z",
      ]),
    ]);

    return {
      topLevel: topLevel.trim(),
      origin: origin.trim(),
      dirtyPaths: parseDirtyPaths(status),
    };
  };
}

const inspectGit = createGitInspector();

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

export async function runPlatformBoundaryCli(
  { check = checkRepositoryBoundary, output = console }: CliDependencies = {},
): Promise<number> {
  try {
    const results = await Promise.all(platformBoundaries.map(check));
    for (const result of results) {
      output.log(result.ok ? `${result.repository}: ok` : `${result.repository}: ${result.code}`);
    }
    return results.some((result) => !result.ok) ? 1 : 0;
  } catch {
    output.error("repository boundary check failed");
    return 1;
  }
}

export async function runPlatformBoundaryCliMain(
  dependencies: CliDependencies = {},
  exitCodeTarget: Pick<NodeJS.Process, "exitCode"> = process,
): Promise<void> {
  exitCodeTarget.exitCode = await runPlatformBoundaryCli(dependencies);
}

const invokedPath = process.argv[1];
if (invokedPath && fileURLToPath(import.meta.url) === resolve(invokedPath)) {
  void runPlatformBoundaryCliMain();
}
