import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);

export const BILLING_PREVIEW_ADMIN_ORIGIN =
  "https://admin-kpopsoft-billing-preview-neo.vercel.app";
export const BILLING_PREVIEW_BRANCH = "codex/billing-preview-oauth";
export const BILLING_PREVIEW_NEON_PROJECT_ID = "red-smoke-09462401";
export const BILLING_PREVIEW_NEON_BRANCH_ID = "br-lingering-thunder-at6twb35";
export const BILLING_PREVIEW_NEON_PARENT_ID = "br-lingering-salad-atyk2pqm";
export const BILLING_PREVIEW_VERCEL_PROJECT = "kpopsoft-billing-preview-neo";
export const BILLING_PREVIEW_VERCEL_TEAM = "kpopsoft-2075s-projects";

export const requiredBillingPreviewEnvironmentNames = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "DATABASE_URL",
  "BILLING_ENABLED",
  "BILLING_CRON_SECRET",
  "BANK_TRANSFER_ENABLED",
  "TOSS_PAYMENTS_ENABLED",
  "BILLING_WIDGET_ENABLED",
] as const;

export type BillingPreviewConfig = {
  adminOrigin: string;
  branch: string;
  neonBranchId: string;
  neonParentId: string;
  neonProjectId: string;
  projectId?: string;
  projectName: string;
  teamId?: string;
  teamSlug: string;
};

export const billingPreviewConfig: BillingPreviewConfig = {
  adminOrigin: BILLING_PREVIEW_ADMIN_ORIGIN,
  branch: BILLING_PREVIEW_BRANCH,
  neonBranchId: BILLING_PREVIEW_NEON_BRANCH_ID,
  neonParentId: BILLING_PREVIEW_NEON_PARENT_ID,
  neonProjectId: BILLING_PREVIEW_NEON_PROJECT_ID,
  projectName: BILLING_PREVIEW_VERCEL_PROJECT,
  teamSlug: BILLING_PREVIEW_VERCEL_TEAM,
};

export type BillingPreviewSnapshot = {
  vercel: {
    deployment: {
      aliases: string[];
      gitBranch: string;
      target: string;
    };
    environments: Array<{
      gitBranch: string | null;
      key: string;
      target: string;
    }>;
    project: { id: string; name: string; teamId: string };
    team: { id: string; slug: string };
  };
  neon: {
    currentState: string;
    expiresAt: string | null;
    id: string;
    isDefault: boolean;
    isPrimary: boolean;
    parentId: string | null;
    projectId: string;
  };
};

export type BillingPreviewVerificationResult =
  | { ok: true; code: "billing_preview_ready" }
  | {
      ok: false;
      code:
        | "admin_host_mismatch"
        | "deployment_branch_mismatch"
        | "deployment_not_preview"
        | "environment_name_missing"
        | "environment_scope_mismatch"
        | "neon_default_branch"
        | "neon_expired"
        | "neon_id_mismatch"
        | "neon_not_ready"
        | "neon_parent_mismatch"
        | "neon_primary_branch"
        | "neon_project_mismatch"
        | "project_mismatch"
        | "project_team_mismatch"
        | "team_mismatch";
    };

export type CliOutput = {
  error: (line: string) => void;
  log: (line: string) => void;
};

export type CliCommandRunner = (command: string, args: string[]) => Promise<string>;

export type BillingPreviewCliDependencies = {
  config?: BillingPreviewConfig;
  inspect?: () => Promise<BillingPreviewSnapshot>;
  output?: CliOutput;
};

export function buildGoogleCallbackUrl(adminOrigin: string): string {
  let parsed: URL;
  try {
    parsed = new URL(adminOrigin);
  } catch {
    throw new Error("admin_origin_invalid");
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.origin !== BILLING_PREVIEW_ADMIN_ORIGIN ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error("admin_origin_invalid");
  }

  return `${BILLING_PREVIEW_ADMIN_ORIGIN}/api/auth/callback/google`;
}

const failure = (code: Exclude<BillingPreviewVerificationResult, { ok: true }>['code']) =>
  ({ ok: false, code }) as const;

export function verifyBillingPreview(
  config: BillingPreviewConfig,
  snapshot: BillingPreviewSnapshot,
  now = new Date(),
): BillingPreviewVerificationResult {
  try {
    buildGoogleCallbackUrl(config.adminOrigin);
  } catch {
    return failure("admin_host_mismatch");
  }

  if (snapshot.vercel.team.slug !== config.teamSlug) return failure("team_mismatch");
  if (config.teamId && snapshot.vercel.team.id !== config.teamId) return failure("team_mismatch");
  if (
    snapshot.vercel.project.name !== config.projectName ||
    (config.projectId && snapshot.vercel.project.id !== config.projectId)
  ) {
    return failure("project_mismatch");
  }
  if (snapshot.vercel.project.teamId !== snapshot.vercel.team.id) {
    return failure("project_team_mismatch");
  }
  if (snapshot.vercel.deployment.target !== "preview") {
    return failure("deployment_not_preview");
  }
  if (snapshot.vercel.deployment.gitBranch !== config.branch) {
    return failure("deployment_branch_mismatch");
  }
  if (!snapshot.vercel.deployment.aliases.includes(config.adminOrigin)) {
    return failure("admin_host_mismatch");
  }

  for (const key of requiredBillingPreviewEnvironmentNames) {
    const entries = snapshot.vercel.environments.filter((entry) => entry.key === key);
    if (entries.length === 0) return failure("environment_name_missing");
    if (
      !entries.some(
        (entry) =>
          entry.target === "preview" && entry.gitBranch === config.branch,
      )
    ) {
      return failure("environment_scope_mismatch");
    }
  }

  if (snapshot.neon.projectId !== config.neonProjectId) {
    return failure("neon_project_mismatch");
  }
  if (snapshot.neon.id !== config.neonBranchId) return failure("neon_id_mismatch");
  if (snapshot.neon.currentState !== "ready") return failure("neon_not_ready");
  if (snapshot.neon.parentId !== config.neonParentId) {
    return failure("neon_parent_mismatch");
  }
  if (snapshot.neon.isPrimary) return failure("neon_primary_branch");
  if (snapshot.neon.isDefault) return failure("neon_default_branch");

  const expiry = snapshot.neon.expiresAt ? new Date(snapshot.neon.expiresAt) : null;
  if (!expiry || Number.isNaN(expiry.getTime()) || expiry.getTime() <= now.getTime()) {
    return failure("neon_expired");
  }

  return { ok: true, code: "billing_preview_ready" };
}

const runCliCommand: CliCommandRunner = async (command, args) => {
  const result = await execFileAsync(command, args, { encoding: "utf8" });
  return result.stdout;
};

function parseJson(value: string): unknown {
  return JSON.parse(value) as unknown;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("inspection_shape_invalid");
  }
  return value as Record<string, unknown>;
}

function records(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new Error("inspection_shape_invalid");
  return value.map(record);
}

function string(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("inspection_shape_invalid");
  }
  return value;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("inspection_shape_invalid");
  return value;
}

function jsonRecords(value: unknown, key: string): Record<string, unknown>[] {
  if (Array.isArray(value)) return records(value);
  return records(record(value)[key]);
}

function normalizeTarget(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length === 1 && typeof value[0] === "string") {
    return value[0];
  }
  throw new Error("inspection_shape_invalid");
}

function aliases(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    throw new Error("inspection_shape_invalid");
  }
  return value;
}

export function createBillingPreviewCliInspector(
  run: CliCommandRunner = runCliCommand,
  config: BillingPreviewConfig = billingPreviewConfig,
) {
  return async (): Promise<BillingPreviewSnapshot> => {
    const [projectsJson, environmentsJson, deploymentsJson, neonJson] = await Promise.all([
      run("npx", [
        "--yes",
        "vercel@latest",
        "project",
        "ls",
        "--scope",
        config.teamSlug,
        "--format",
        "json",
      ]),
      run("npx", [
        "--yes",
        "vercel@latest",
        "env",
        "list",
        "preview",
        config.branch,
        "--project",
        config.projectName,
        "--scope",
        config.teamSlug,
        "--format",
        "json",
      ]),
      run("npx", [
        "--yes",
        "vercel@latest",
        "list",
        config.projectName,
        "--environment",
        "preview",
        "--meta",
        `gitBranch=${config.branch}`,
        "--scope",
        config.teamSlug,
        "--format",
        "json",
      ]),
      run("npx", [
        "--yes",
        "neonctl@2.35.0",
        "branches",
        "get",
        config.neonBranchId,
        "--project-id",
        config.neonProjectId,
        "--output",
        "json",
      ]),
    ]);

    const projects = jsonRecords(parseJson(projectsJson), "projects");
    const project = projects.find((entry) => entry.name === config.projectName);
    const deployment = jsonRecords(parseJson(deploymentsJson), "deployments")[0];
    const neon = record(parseJson(neonJson));
    if (!project || !deployment) throw new Error("inspection_shape_invalid");

    const projectTeamId = string(project.accountId ?? project.teamId);
    const environmentEntries = jsonRecords(parseJson(environmentsJson), "envs");
    return {
      vercel: {
        deployment: {
          aliases: aliases(deployment.alias ?? deployment.aliases),
          gitBranch: string(deployment.meta && record(deployment.meta).gitBranch),
          target: normalizeTarget(deployment.target),
        },
        environments: environmentEntries.map((entry) => ({
          gitBranch: optionalString(entry.gitBranch ?? entry.git_branch),
          key: string(entry.key),
          target: normalizeTarget(entry.target),
        })),
        project: {
          id: string(project.id),
          name: string(project.name),
          teamId: projectTeamId,
        },
        team: { id: projectTeamId, slug: config.teamSlug },
      },
      neon: {
        currentState: string(neon.current_state),
        expiresAt: optionalString(neon.expires_at),
        id: string(neon.id),
        isDefault: boolean(neon.default),
        isPrimary: boolean(neon.primary),
        parentId: optionalString(neon.parent_id),
        projectId: string(neon.project_id),
      },
    };
  };
}

export async function runBillingPreviewCli(
  dependencies: BillingPreviewCliDependencies = {},
): Promise<number> {
  const config = dependencies.config ?? billingPreviewConfig;
  const inspect = dependencies.inspect ?? createBillingPreviewCliInspector(undefined, config);
  const output = dependencies.output ?? console;
  try {
    const result = verifyBillingPreview(config, await inspect());
    if (result.ok) {
      output.log(result.code);
      return 0;
    }
    output.error(`billing_preview_${result.code}`);
    return 1;
  } catch {
    output.error("billing_preview_inspection_failed");
    return 1;
  }
}

export async function runBillingPreviewCliMain(
  dependencies: BillingPreviewCliDependencies = {},
  exitCodeTarget: Pick<NodeJS.Process, "exitCode"> = process,
): Promise<void> {
  exitCodeTarget.exitCode = await runBillingPreviewCli(dependencies);
}

const invokedPath = process.argv[1];
if (invokedPath && fileURLToPath(import.meta.url) === resolve(invokedPath)) {
  void runBillingPreviewCliMain();
}
