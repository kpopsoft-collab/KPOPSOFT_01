import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const BILLING_PREVIEW_ADMIN_ORIGIN =
  "https://admin-kpopsoft-billing-preview-neo.vercel.app";
export const BILLING_PREVIEW_BRANCH = "codex/billing-preview-oauth";
export const BILLING_PREVIEW_NEON_PROJECT_ID = "red-smoke-09462401";
export const BILLING_PREVIEW_NEON_BRANCH_ID = "br-lingering-thunder-at6twb35";
export const BILLING_PREVIEW_NEON_PARENT_ID = "br-lingering-salad-atyk2pqm";
export const BILLING_PREVIEW_VERCEL_PROJECT = "kpopsoft-02";
export const BILLING_PREVIEW_VERCEL_PROJECT_ID = "prj_Xb6z5eGIOLTmrpWczO8zU9UYE9x0";
export const BILLING_PREVIEW_VERCEL_TEAM = "kpopsoft-2075s-projects";
export const BILLING_PREVIEW_VERCEL_TEAM_ID = "team_JyJcVEVDcq6Jg1DDgDTW99Su";
export const BILLING_PREVIEW_ATTESTATION_PATH = "/api/internal/billing/attestation";

const billingPreviewAttestationDeploymentHeader =
  "x-kpopsoft-billing-attestation-deployment-id";
const billingPreviewAttestationGitShaHeader =
  "x-kpopsoft-billing-attestation-git-sha";

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
  projectId: string;
  projectName: string;
  teamId: string;
  teamSlug: string;
};

export const billingPreviewConfig: BillingPreviewConfig = {
  adminOrigin: BILLING_PREVIEW_ADMIN_ORIGIN,
  branch: BILLING_PREVIEW_BRANCH,
  neonBranchId: BILLING_PREVIEW_NEON_BRANCH_ID,
  neonParentId: BILLING_PREVIEW_NEON_PARENT_ID,
  neonProjectId: BILLING_PREVIEW_NEON_PROJECT_ID,
  projectId: BILLING_PREVIEW_VERCEL_PROJECT_ID,
  projectName: BILLING_PREVIEW_VERCEL_PROJECT,
  teamId: BILLING_PREVIEW_VERCEL_TEAM_ID,
  teamSlug: BILLING_PREVIEW_VERCEL_TEAM,
};

export type BillingPreviewSnapshot = {
  localHead: string;
  vercel: {
    adminAlias: {
      alias: string;
      deploymentId: string;
      url: string;
    };
    deployment: {
      createdAt: number;
      gitCommitRef: string;
      gitCommitSha: string;
      id: string;
      inspectedId: string;
      inspectedStatus: string;
      inspectedTarget: string;
      inspectedUrl: string;
      listTarget: null;
      status: string;
      url: string;
    };
    environments: Array<{
      gitBranch: string | null;
      key: string;
      targets: string[];
      updatedAt: number;
    }>;
    project: { id: string; name: string };
    team: { id: string; slug: string };
  };
  neon: {
    currentState: string;
    endpointCount: number;
    endpointHost: string;
    expiresAt: string | null;
    id: string;
    isDefault: boolean;
    isPrimary: boolean;
    parentId: string | null;
    projectId: string;
  };
  runtimeAttestation: BillingPreviewRuntimeAttestation;
};

export type BillingPreviewRuntimeAttestation = {
  bankTransferDisabled: boolean;
  billingEnabled: boolean;
  billingWidgetDisabled: boolean;
  databaseUrlMatchesPreviewEndpoint: boolean;
  deploymentIdMatchesRequest: boolean;
  gitCommitShaMatchesRequest: boolean;
  requiredRuntimeEnvironmentPresent: boolean;
  tossPaymentsDisabled: boolean;
};

type BillingPreviewFailureCode =
  | "admin_alias_mismatch"
  | "admin_host_mismatch"
  | "deployment_branch_mismatch"
  | "deployment_head_mismatch"
  | "deployment_inspection_mismatch"
  | "deployment_list_target_mismatch"
  | "deployment_not_preview"
  | "deployment_not_ready"
  | "environment_metadata_after_deployment"
  | "environment_metadata_ambiguous"
  | "environment_name_missing"
  | "environment_scope_mismatch"
  | "neon_default_branch"
  | "neon_endpoint_ambiguous"
  | "neon_endpoint_mismatch"
  | "neon_expired"
  | "neon_id_mismatch"
  | "neon_not_ready"
  | "neon_parent_mismatch"
  | "neon_primary_branch"
  | "neon_project_mismatch"
  | "project_mismatch"
  | "runtime_attestation_failed"
  | "team_mismatch";

export type BillingPreviewVerificationResult =
  | { ok: true; code: "billing_preview_ready" }
  | { ok: false; code: BillingPreviewFailureCode };

export type CliOutput = {
  error: (line: string) => void;
  log: (line: string) => void;
};

export type CliCommandRunner = (command: string, args: string[]) => Promise<string>;

export type BillingPreviewCliDependencies = {
  config?: BillingPreviewConfig;
  inspect?: () => Promise<BillingPreviewSnapshot>;
  now?: Date;
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

function runtimeAttestationPasses(
  attestation: BillingPreviewRuntimeAttestation,
): boolean {
  return Object.values(attestation).every(Boolean);
}

const failure = (code: BillingPreviewFailureCode): BillingPreviewVerificationResult => ({
  ok: false,
  code,
});

export function verifyBillingPreview(
  config: BillingPreviewConfig,
  snapshot: BillingPreviewSnapshot,
  options: { now?: Date } = {},
): BillingPreviewVerificationResult {
  try {
    buildGoogleCallbackUrl(config.adminOrigin);
  } catch {
    return failure("admin_host_mismatch");
  }

  if (
    snapshot.vercel.team.slug !== config.teamSlug ||
    snapshot.vercel.team.id !== config.teamId
  ) {
    return failure("team_mismatch");
  }
  if (
    snapshot.vercel.project.name !== config.projectName ||
    snapshot.vercel.project.id !== config.projectId
  ) {
    return failure("project_mismatch");
  }
  const { deployment } = snapshot.vercel;
  if (deployment.status !== "READY" || deployment.inspectedStatus !== "READY") {
    return failure("deployment_not_ready");
  }
  if (deployment.listTarget !== null) return failure("deployment_list_target_mismatch");
  if (deployment.gitCommitRef !== config.branch) {
    return failure("deployment_branch_mismatch");
  }
  if (deployment.gitCommitSha !== snapshot.localHead) {
    return failure("deployment_head_mismatch");
  }
  if (
    deployment.id !== deployment.inspectedId ||
    deployment.url !== deployment.inspectedUrl
  ) {
    return failure("deployment_inspection_mismatch");
  }
  if (deployment.inspectedTarget !== "preview") {
    return failure("deployment_not_preview");
  }

  for (const key of requiredBillingPreviewEnvironmentNames) {
    const entries = snapshot.vercel.environments.filter((entry) => entry.key === key);
    if (entries.length === 0) return failure("environment_name_missing");
    if (entries.length !== 1) return failure("environment_metadata_ambiguous");
    const [entry] = entries;
    if (
      entry?.gitBranch !== config.branch ||
      entry.targets.length !== 1 ||
      entry.targets[0] !== "preview"
    ) {
      return failure("environment_scope_mismatch");
    }
    if (
      !Number.isSafeInteger(entry.updatedAt) ||
      entry.updatedAt > deployment.createdAt
    ) {
      return failure("environment_metadata_after_deployment");
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
  if (snapshot.neon.endpointCount !== 1) return failure("neon_endpoint_ambiguous");
  if (!snapshot.neon.endpointHost) return failure("neon_endpoint_mismatch");

  const now = options.now ?? new Date();
  const expiry = snapshot.neon.expiresAt ? new Date(snapshot.neon.expiresAt) : null;
  if (!expiry || Number.isNaN(expiry.getTime()) || expiry.getTime() <= now.getTime()) {
    return failure("neon_expired");
  }

  if (
    !snapshot.runtimeAttestation ||
    !runtimeAttestationPasses(snapshot.runtimeAttestation)
  ) {
    return failure("runtime_attestation_failed");
  }

  const expectedAlias = new URL(config.adminOrigin).hostname;
  if (
    snapshot.vercel.adminAlias.alias !== expectedAlias ||
    snapshot.vercel.adminAlias.deploymentId !== deployment.id ||
    snapshot.vercel.adminAlias.url !== deployment.url
  ) {
    return failure("admin_alias_mismatch");
  }

  return { ok: true, code: "billing_preview_ready" };
}

const runCliCommand: CliCommandRunner = async (command, args) => {
  const result = await execFileAsync(command, args, { encoding: "utf8" });
  return result.stdout;
};

type JsonRecord = Record<string, unknown>;

class BillingPreviewInspectionError extends Error {
  readonly code: "deployment_ambiguous" | "deployment_not_found" | "neon_endpoint_missing";

  constructor(code: "deployment_ambiguous" | "deployment_not_found" | "neon_endpoint_missing") {
    super(code);
    this.code = code;
  }
}

function parseJson(value: string): unknown {
  return JSON.parse(value) as unknown;
}

function record(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("inspection_shape_invalid");
  }
  return value as JsonRecord;
}

function records(value: unknown): JsonRecord[] {
  if (!Array.isArray(value)) throw new Error("inspection_shape_invalid");
  return value.map(record);
}

function recordsAt(value: unknown, key: string): JsonRecord[] {
  return records(record(value)[key]);
}

function string(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("inspection_shape_invalid");
  }
  return value;
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return string(value);
}

function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("inspection_shape_invalid");
  return value;
}

function timestamp(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("inspection_shape_invalid");
  }
  return value;
}

const billingPreviewRuntimeAttestationKeys = [
  "bankTransferDisabled",
  "billingEnabled",
  "billingWidgetDisabled",
  "databaseUrlMatchesPreviewEndpoint",
  "deploymentIdMatchesRequest",
  "gitCommitShaMatchesRequest",
  "requiredRuntimeEnvironmentPresent",
  "tossPaymentsDisabled",
] as const;

export function parseBillingPreviewRuntimeAttestation(
  value: string,
): BillingPreviewRuntimeAttestation {
  let parsed: JsonRecord;
  try {
    parsed = record(parseJson(value));
  } catch {
    throw new Error("inspection_shape_invalid");
  }

  if (
    Object.keys(parsed).sort().join(",") !==
    [...billingPreviewRuntimeAttestationKeys].sort().join(",")
  ) {
    throw new Error("inspection_shape_invalid");
  }

  return {
    bankTransferDisabled: boolean(parsed.bankTransferDisabled),
    billingEnabled: boolean(parsed.billingEnabled),
    billingWidgetDisabled: boolean(parsed.billingWidgetDisabled),
    databaseUrlMatchesPreviewEndpoint: boolean(parsed.databaseUrlMatchesPreviewEndpoint),
    deploymentIdMatchesRequest: boolean(parsed.deploymentIdMatchesRequest),
    gitCommitShaMatchesRequest: boolean(parsed.gitCommitShaMatchesRequest),
    requiredRuntimeEnvironmentPresent: boolean(parsed.requiredRuntimeEnvironmentPresent),
    tossPaymentsDisabled: boolean(parsed.tossPaymentsDisabled),
  };
}

function targetArray(value: unknown): string[] {
  const targets = value;
  if (
    !Array.isArray(targets) ||
    targets.length === 0 ||
    !targets.every((target) => typeof target === "string" && target.length > 0)
  ) {
    throw new Error("inspection_shape_invalid");
  }
  return [...targets] as string[];
}

function parseGitHead(value: string): string {
  const head = value.trim();
  if (!/^[0-9a-f]{40}$/i.test(head)) throw new Error("inspection_shape_invalid");
  return head;
}

function deploymentMeta(value: unknown): { gitCommitRef: string; gitCommitSha: string } {
  const meta = record(value);
  return {
    gitCommitRef: string(meta.githubCommitRef),
    gitCommitSha: string(meta.githubCommitSha),
  };
}

function paginatedResultHasNextPage(value: unknown): boolean {
  const pagination = record(record(value).pagination);
  return pagination.next !== null;
}

function deploymentUrl(url: string): string {
  return url.startsWith("https://") ? url : `https://${url}`;
}

async function fetchDeploymentRuntimeAttestation(
  run: CliCommandRunner,
  config: BillingPreviewConfig,
  deploymentUrlValue: string,
  deploymentId: string,
  gitCommitSha: string,
): Promise<BillingPreviewRuntimeAttestation> {
  const response = await run("npx", [
    "--yes",
    "vercel@56.3.2",
    "curl",
    BILLING_PREVIEW_ATTESTATION_PATH,
    "--deployment",
    deploymentUrl(deploymentUrlValue),
    "--scope",
    config.teamSlug,
    "--non-interactive",
    "--",
    "--header",
    `${billingPreviewAttestationDeploymentHeader}: ${deploymentId}`,
    "--header",
    `${billingPreviewAttestationGitShaHeader}: ${gitCommitSha}`,
  ]);
  return parseBillingPreviewRuntimeAttestation(response);
}

export function createBillingPreviewCliInspector(
  run: CliCommandRunner = runCliCommand,
  config: BillingPreviewConfig = billingPreviewConfig,
) {
  return async (): Promise<BillingPreviewSnapshot> => {
    const [teamsJson, projectsJson, head] = await Promise.all([
      run("npx", ["--yes", "vercel@56.3.2", "teams", "ls", "--format=json"]),
      run("npx", [
        "--yes",
        "vercel@56.3.2",
        "project",
        "ls",
        "--scope",
        config.teamSlug,
        "--format=json",
      ]),
      run("git", ["rev-parse", "HEAD"]),
    ]);
    const localHead = parseGitHead(head);
    const aliasHost = new URL(config.adminOrigin).hostname;
    const [deploymentsJson, environmentsJson, aliasInspectionJson, neonBranchJson, neonEndpointsJson] =
      await Promise.all([
        run("npx", [
          "--yes",
          "vercel@56.3.2",
          "list",
          config.projectName,
          "--scope",
          config.teamSlug,
          "--status",
          "READY",
          "--meta",
          `githubCommitRef=${config.branch}`,
          "--meta",
          `githubCommitSha=${localHead}`,
          "--limit",
          "100",
          "--format=json",
        ]),
        run("npx", [
          "--yes",
          "vercel@56.3.2",
          "env",
          "ls",
          "preview",
          config.branch,
          "--project",
          config.projectName,
          "--scope",
          config.teamSlug,
          "--format=json",
        ]),
        run("npx", [
          "--yes",
          "vercel@56.3.2",
          "inspect",
          aliasHost,
          "--scope",
          config.teamSlug,
          "--format=json",
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
        run("npx", [
          "--yes",
          "neonctl@2.35.0",
          "api",
          `/projects/${config.neonProjectId}/endpoints`,
          "--output",
          "json",
        ]),
      ]);

    const team = recordsAt(parseJson(teamsJson), "teams").find(
      (candidate) => candidate.slug === config.teamSlug,
    );
    const project = recordsAt(parseJson(projectsJson), "projects").find(
      (candidate) => candidate.name === config.projectName,
    );
    if (!team || !project) throw new Error("inspection_shape_invalid");

    const deployments = parseJson(deploymentsJson);
    if (paginatedResultHasNextPage(deployments)) {
      throw new BillingPreviewInspectionError("deployment_ambiguous");
    }
    const matchingDeployments = recordsAt(deployments, "deployments").filter(
      (candidate) => {
        const meta = candidate.meta;
        if (!meta || typeof meta !== "object" || Array.isArray(meta)) return false;
        const candidateMeta = meta as JsonRecord;
        return (
          candidate.state === "READY" &&
          candidateMeta.githubCommitRef === config.branch &&
          candidateMeta.githubCommitSha === localHead
        );
      },
    );
    if (matchingDeployments.length === 0) {
      throw new BillingPreviewInspectionError("deployment_not_found");
    }
    if (matchingDeployments.length !== 1) {
      throw new BillingPreviewInspectionError("deployment_ambiguous");
    }
    const selectedDeployment = matchingDeployments[0]!;
    const selectedDeploymentId = string(selectedDeployment.uid);
    const selectedMeta = deploymentMeta(selectedDeployment.meta);
    const selectedUrl = string(selectedDeployment.url);
    const selectedCreatedAt = timestamp(selectedDeployment.createdAt);
    if (selectedDeployment.target !== null) throw new Error("inspection_shape_invalid");

    const inspectedDeployment = record(
      parseJson(
        await run("npx", [
          "--yes",
          "vercel@56.3.2",
          "inspect",
          selectedUrl,
          "--scope",
          config.teamSlug,
          "--format=json",
        ]),
      ),
    );

    const inspectedAlias = record(parseJson(aliasInspectionJson));

    const neon = record(parseJson(neonBranchJson));
    const previewEndpoints = recordsAt(parseJson(neonEndpointsJson), "endpoints")
      .filter(
        (endpoint) =>
          endpoint.project_id === config.neonProjectId &&
          endpoint.branch_id === config.neonBranchId &&
          endpoint.type === "read_write" &&
          endpoint.disabled !== true,
      );
    if (previewEndpoints.length === 0) {
      throw new BillingPreviewInspectionError("neon_endpoint_missing");
    }
    const previewEndpoint = previewEndpoints.length === 1 ? previewEndpoints[0] : undefined;
    const endpointHost = previewEndpoint ? string(previewEndpoint.host) : "";
    const inspectedDeploymentId = string(inspectedDeployment.id);
    const runtimeAttestation = await fetchDeploymentRuntimeAttestation(
      run,
      config,
      selectedUrl,
      selectedDeploymentId,
      selectedMeta.gitCommitSha,
    );

    return {
      localHead,
      vercel: {
        adminAlias: {
          alias: aliasHost,
          deploymentId: string(inspectedAlias.id),
          url: string(inspectedAlias.url),
        },
        deployment: {
          createdAt: selectedCreatedAt,
          gitCommitRef: selectedMeta.gitCommitRef,
          gitCommitSha: selectedMeta.gitCommitSha,
          id: selectedDeploymentId,
          inspectedId: inspectedDeploymentId,
          inspectedStatus: string(inspectedDeployment.readyState),
          inspectedTarget: string(inspectedDeployment.target),
          inspectedUrl: string(inspectedDeployment.url),
          listTarget: null,
          status: string(selectedDeployment.state),
          url: selectedUrl,
        },
        environments: recordsAt(parseJson(environmentsJson), "envs").map(
          (entry) => ({
            gitBranch: nullableString(entry.gitBranch),
            key: string(entry.key),
            targets: targetArray(entry.target),
            updatedAt: timestamp(entry.updatedAt),
          }),
        ),
        project: {
          id: string(project.id),
          name: string(project.name),
        },
        team: { id: string(team.id), slug: string(team.slug) },
      },
      neon: {
        currentState: string(neon.current_state),
        endpointCount: previewEndpoints.length,
        endpointHost,
        expiresAt: nullableString(neon.expires_at),
        id: string(neon.id),
        isDefault: boolean(neon.default),
        isPrimary: boolean(neon.primary),
        parentId: nullableString(neon.parent_id),
        projectId: string(neon.project_id),
      },
      runtimeAttestation,
    };
  };
}

export async function inspectAndVerifyBillingPreview(
  dependencies: BillingPreviewCliDependencies = {},
): Promise<BillingPreviewVerificationResult> {
  const config = dependencies.config ?? billingPreviewConfig;
  const inspect = dependencies.inspect ?? createBillingPreviewCliInspector(undefined, config);
  return verifyBillingPreview(config, await inspect(), {
    now: dependencies.now,
  });
}

export async function runBillingPreviewCli(
  dependencies: BillingPreviewCliDependencies = {},
): Promise<number> {
  const output = dependencies.output ?? console;
  try {
    const result = await inspectAndVerifyBillingPreview(dependencies);
    if (result.ok) {
      output.log(result.code);
      return 0;
    }
    output.error(`billing_preview_${result.code}`);
    return 1;
  } catch (error) {
    if (error instanceof BillingPreviewInspectionError) {
      output.error(`billing_preview_${error.code}`);
    } else {
      output.error("billing_preview_inspection_failed");
    }
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
