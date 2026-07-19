import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import * as billingPreview from "../scripts/verify-billing-preview.mts";

import type {
  BillingPreviewConfig,
  BillingPreviewSnapshot,
} from "../scripts/verify-billing-preview.mts";

const config: BillingPreviewConfig = {
  adminOrigin: "https://admin-kpopsoft-billing-preview-neo.vercel.app",
  branch: "codex/billing-preview-oauth",
  neonBranchId: "br-lingering-thunder-at6twb35",
  neonParentId: "br-lingering-salad-atyk2pqm",
  neonProjectId: "red-smoke-09462401",
  projectId: "prj_Xb6z5eGIOLTmrpWczO8zU9UYE9x0",
  projectName: "kpopsoft-02",
  teamId: "team_JyJcVEVDcq6Jg1DDgDTW99Su",
  teamSlug: "kpopsoft-2075s-projects",
};

const localHead = "a".repeat(40);
const endpointHost = "ep-polished-scene-at1xxh71.c-9.us-east-1.aws.neon.tech";

const runtimeEnvironment: NodeJS.ProcessEnv = {
  AUTH_GOOGLE_ID: "test-google-id",
  AUTH_GOOGLE_SECRET: "test-google-secret",
  AUTH_SECRET: "test-auth-secret",
  BANK_TRANSFER_ENABLED: "false",
  BILLING_CRON_SECRET: "test-billing-cron-secret",
  BILLING_ENABLED: "true",
  BILLING_WIDGET_ENABLED: "false",
  DATABASE_URL: `postgresql://user:password@${endpointHost}/preview`,
  NODE_ENV: "test",
  TOSS_PAYMENTS_ENABLED: "false",
};

const requiredEnvironmentNames = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "DATABASE_URL",
  "BILLING_ENABLED",
  "BILLING_CRON_SECRET",
  "BANK_TRANSFER_ENABLED",
  "TOSS_PAYMENTS_ENABLED",
  "BILLING_WIDGET_ENABLED",
];

function snapshot(): BillingPreviewSnapshot {
  return {
    localHead,
    vercel: {
      adminAlias: {
        alias: "admin-kpopsoft-billing-preview-neo.vercel.app",
        deploymentId: "dpl_exact_preview",
        url: "kpopsoft-02-exact-preview.vercel.app",
      },
      deployment: {
        gitCommitRef: config.branch,
        gitCommitSha: localHead,
        id: "dpl_exact_preview",
        inspectedId: "dpl_exact_preview",
        inspectedStatus: "READY",
        inspectedTarget: "preview",
        inspectedUrl: "kpopsoft-02-exact-preview.vercel.app",
        listTarget: null,
        status: "READY",
        url: "kpopsoft-02-exact-preview.vercel.app",
      },
      environments: requiredEnvironmentNames.map((key) => ({
        gitBranch: config.branch,
        key,
        targets: ["preview"],
      })),
      project: { id: config.projectId, name: config.projectName },
      team: { id: config.teamId, slug: config.teamSlug },
    },
    neon: {
      currentState: "ready",
      endpointHost,
      endpointCount: 1,
      expiresAt: "2026-08-02T08:00:00Z",
      id: config.neonBranchId,
      isDefault: false,
      isPrimary: false,
      parentId: config.neonParentId,
      projectId: config.neonProjectId,
    },
    runtimeAttestation: {
      bankTransferDisabled: true,
      billingEnabled: true,
      billingWidgetDisabled: true,
      databaseUrlMatchesPreviewEndpoint: true,
      requiredRuntimeEnvironmentPresent: true,
      tossPaymentsDisabled: true,
    },
    childEnvironmentMatchesDeployment: true,
  } as unknown as BillingPreviewSnapshot;
}

function verify(state = snapshot()) {
  return billingPreview.verifyBillingPreview(
    config,
    state,
    { now: new Date("2026-07-19T00:00:00Z") },
  );
}

function capture() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    output: {
      error: (line: string) => stderr.push(line),
      log: (line: string) => stdout.push(line),
    },
    stderr,
    stdout,
  };
}

test("billing Preview OAuth callback stays on the admin host", () => {
  assert.equal(
    billingPreview.buildGoogleCallbackUrl(config.adminOrigin),
    "https://admin-kpopsoft-billing-preview-neo.vercel.app/api/auth/callback/google",
  );
});

for (const origin of [
  "http://admin-kpopsoft-billing-preview-neo.vercel.app",
  "https://kpopsoft-02.vercel.app",
  "https://admin-kpopsoft-billing-preview-neo.vercel.app:8443",
  "https://admin-kpopsoft-billing-preview-neo.vercel.app/admin",
  "https://admin-kpopsoft-billing-preview-neo.vercel.app?next=/admin",
  "https://user@admin-kpopsoft-billing-preview-neo.vercel.app",
]) {
  test(`rejects a non-canonical OAuth callback origin: ${origin}`, () => {
    assert.throws(
      () => billingPreview.buildGoogleCallbackUrl(origin),
      /admin_origin_invalid/,
    );
  });
}

test("pins the live Vercel project and team identities", () => {
  assert.equal(billingPreview.billingPreviewConfig.projectName, config.projectName);
  assert.equal(billingPreview.billingPreviewConfig.projectId, config.projectId);
  assert.equal(billingPreview.billingPreviewConfig.teamId, config.teamId);
});

test("accepts only the exact local HEAD Preview deployment and alias", () => {
  assert.deepEqual(verify(), {
    ok: true,
    code: "billing_preview_ready",
  });
});

test("rejects stale aliases even when the canonical hostname exists", () => {
  const state = snapshot() as unknown as {
    vercel: { adminAlias: { deploymentId: string } };
  } & BillingPreviewSnapshot;
  state.vercel.adminAlias.deploymentId = "dpl_old_preview";

  assert.deepEqual(verify(state), {
    ok: false,
    code: "admin_alias_mismatch",
  });
});

test("rejects a READY deployment from the branch with a different local HEAD", () => {
  const state = snapshot() as unknown as {
    vercel: { deployment: { gitCommitSha: string } };
  } & BillingPreviewSnapshot;
  state.vercel.deployment.gitCommitSha = "b".repeat(40);

  assert.deepEqual(verify(state), {
    ok: false,
    code: "deployment_head_mismatch",
  });
});

test("rejects an inspected deployment that is not Preview", () => {
  const state = snapshot() as unknown as {
    vercel: { deployment: { inspectedTarget: string } };
  } & BillingPreviewSnapshot;
  state.vercel.deployment.inspectedTarget = "production";

  assert.deepEqual(verify(state), {
    ok: false,
    code: "deployment_not_preview",
  });
});

test("rejects missing branch-scoped environment names before alias freshness", () => {
  const state = snapshot() as unknown as {
    vercel: {
      adminAlias: { deploymentId: string };
      environments: unknown[];
    };
  } & BillingPreviewSnapshot;
  state.vercel.environments = [];
  state.vercel.adminAlias.deploymentId = "dpl_old_preview";

  assert.deepEqual(verify(state), {
    ok: false,
    code: "environment_name_missing",
  });
});

test("requires preview in Vercel's target array and the explicit branch", () => {
  const state = snapshot() as unknown as {
    vercel: {
      environments: Array<{ gitBranch: string; key: string; targets: string[] }>;
    };
  } & BillingPreviewSnapshot;
  state.vercel.environments[0]!.targets = ["production"];

  assert.deepEqual(verify(state), {
    ok: false,
    code: "environment_scope_mismatch",
  });
});

test("attests exact deployment runtime values only as booleans and accepts the endpoint pooler host", () => {
  const attestation = billingPreview.attestBillingPreviewRuntime(
    {
      ...runtimeEnvironment,
      DATABASE_URL: `postgresql://user:password@${endpointHost.replace(
        "ep-polished-scene-at1xxh71",
        "ep-polished-scene-at1xxh71-pooler",
      )}/preview`,
    },
    endpointHost,
  );

  assert.deepEqual(attestation, {
    bankTransferDisabled: true,
    billingEnabled: true,
    billingWidgetDisabled: true,
    databaseUrlMatchesPreviewEndpoint: true,
    requiredRuntimeEnvironmentPresent: true,
    tossPaymentsDisabled: true,
  });
  assert.doesNotMatch(JSON.stringify(attestation), /password|postgresql|secret/i);
});

test("fails closed when a required runtime value is empty or the database host is wrong", () => {
  const attestation = billingPreview.attestBillingPreviewRuntime(
    {
      ...runtimeEnvironment,
      AUTH_GOOGLE_SECRET: "",
      DATABASE_URL: "postgresql://user:password@ep-production.example.test/app",
    },
    endpointHost,
  );

  assert.equal(attestation.requiredRuntimeEnvironmentPresent, false);
  assert.equal(attestation.databaseUrlMatchesPreviewEndpoint, false);
  const state = snapshot() as unknown as {
    runtimeAttestation: billingPreview.BillingPreviewRuntimeAttestation;
  } & BillingPreviewSnapshot;
  state.runtimeAttestation = attestation;
  assert.deepEqual(verify(state), {
    ok: false,
    code: "runtime_attestation_failed",
  });
});

test("rejects duplicate or conflicting required Preview environment metadata", () => {
  const state = snapshot() as unknown as {
    vercel: {
      environments: Array<{ gitBranch: string; key: string; targets: string[] }>;
    };
  } & BillingPreviewSnapshot;
  state.vercel.environments.push({
    gitBranch: config.branch,
    key: "DATABASE_URL",
    targets: ["preview"],
  });

  assert.deepEqual(verify(state), {
    ok: false,
    code: "environment_metadata_ambiguous",
  });
});

test("rejects multiple active Preview Neon endpoints", () => {
  const state = snapshot() as unknown as {
    neon: { endpointHost: string; endpointCount: number };
  } & BillingPreviewSnapshot;
  state.neon.endpointCount = 2;

  assert.deepEqual(verify(state), {
    ok: false,
    code: "neon_endpoint_ambiguous",
  });
});

test("does not use caller process runtime values when deployment runtime evidence is absent", () => {
  const state = snapshot() as unknown as {
    runtimeAttestation?: billingPreview.BillingPreviewRuntimeAttestation;
  } & BillingPreviewSnapshot;
  Reflect.deleteProperty(state, "runtimeAttestation");

  assert.deepEqual(
    verify(state),
    { ok: false, code: "runtime_attestation_failed" },
  );
});

test("rejects a child environment that differs from the exact deployment runtime", () => {
  const state = snapshot() as unknown as {
    childEnvironmentMatchesDeployment: boolean;
  } & BillingPreviewSnapshot;
  state.childEnvironmentMatchesDeployment = false;

  assert.deepEqual(verify(state), {
    ok: false,
    code: "runtime_attestation_failed",
  });
});

test("reads exact deployment runtime values from a mode-600 temporary env file and removes it", () => {
  const directory = mkdtempSync(join(tmpdir(), "billing-preview-runtime-"));
  const path = join(directory, "deployment.env");
  writeFileSync(path, [
    "AUTH_SECRET=test-auth-secret",
    "AUTH_GOOGLE_ID=test-google-id",
    "AUTH_GOOGLE_SECRET=test-google-secret",
    `DATABASE_URL=postgresql://user:password@${endpointHost}/preview`,
    "BILLING_ENABLED=true",
    "BILLING_CRON_SECRET=test-billing-cron-secret",
    "BANK_TRANSFER_ENABLED=false",
    "TOSS_PAYMENTS_ENABLED=false",
    "BILLING_WIDGET_ENABLED=false",
  ].join("\n"), { mode: 0o600 });

  try {
    const attestation = billingPreview.readBillingPreviewRuntimeAttestation(path, endpointHost);
    assert.equal(attestation.databaseUrlMatchesPreviewEndpoint, true);
    assert.equal(attestation.requiredRuntimeEnvironmentPresent, true);
    assert.doesNotMatch(JSON.stringify(attestation), /password|postgresql|secret/i);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});

test("inspector pins the audited Vercel CLI and exact scoped deployment commands", async () => {
  const calls: Array<{ command: string; args: string[] }> = [];
  let runtimeEnvironmentPath: string | undefined;
  let runtimeEnvironmentMode: number | undefined;
  const inspector = billingPreview.createBillingPreviewCliInspector(
    async (command, args) => {
      calls.push({ command, args });
      if (command === "git") return `${localHead}\n`;
      if (args.includes("teams")) {
        return JSON.stringify({ teams: [{ id: config.teamId, slug: config.teamSlug }] });
      }
      if (args.includes("project")) {
        return JSON.stringify({
          projects: [{ id: config.projectId, name: config.projectName }],
        });
      }
      if (args.includes("env") && args.includes("pull")) {
        runtimeEnvironmentPath = args[args.indexOf("pull") + 1];
        runtimeEnvironmentMode = statSync(runtimeEnvironmentPath!).mode & 0o777;
        writeFileSync(runtimeEnvironmentPath!, [
          "AUTH_SECRET=test-auth-secret",
          "AUTH_GOOGLE_ID=test-google-id",
          "AUTH_GOOGLE_SECRET=test-google-secret",
          `DATABASE_URL=postgresql://user:password@${endpointHost}/preview`,
          "BILLING_ENABLED=true",
          "BILLING_CRON_SECRET=test-billing-cron-secret",
          "BANK_TRANSFER_ENABLED=false",
          "TOSS_PAYMENTS_ENABLED=false",
          "BILLING_WIDGET_ENABLED=false",
        ].join("\n"), { mode: 0o600 });
        return "";
      }
      if (args.includes("env") && args.includes("ls")) {
        return JSON.stringify({
          envs: requiredEnvironmentNames.map((key) => ({
            gitBranch: config.branch,
            key,
            target: ["preview"],
          })),
        });
      }
      if (args.includes("inspect") && args.includes(new URL(config.adminOrigin).hostname)) {
        return JSON.stringify({
          id: "dpl_exact_preview",
          readyState: "READY",
          target: "preview",
          url: "kpopsoft-02-exact-preview.vercel.app",
        });
      }
      if (args.includes("inspect")) {
        return JSON.stringify({
          id: "dpl_exact_preview",
          readyState: "READY",
          target: "preview",
          url: "kpopsoft-02-exact-preview.vercel.app",
        });
      }
      if (args.includes("list")) {
        return JSON.stringify({
          deployments: [{
            meta: {
              githubCommitRef: config.branch,
              githubCommitSha: localHead,
            },
            state: "READY",
            target: null,
            uid: "dpl_exact_preview",
            url: "kpopsoft-02-exact-preview.vercel.app",
          }],
          pagination: { count: 1, next: null, prev: null },
        });
      }
      if (args.includes("branches")) {
        return JSON.stringify({
          current_state: "ready",
          default: false,
          expires_at: "2026-08-02T08:00:00Z",
          id: config.neonBranchId,
          parent_id: config.neonParentId,
          primary: false,
          project_id: config.neonProjectId,
        });
      }
      if (args.includes("api")) {
        return JSON.stringify({
          endpoints: [{
            branch_id: config.neonBranchId,
            host: endpointHost,
            id: "ep_preview",
            project_id: config.neonProjectId,
            type: "read_write",
          }],
        });
      }
      throw new Error("unexpected command");
    },
    config,
    runtimeEnvironment,
  );

  const inspected = await inspector();
  assert.deepEqual(inspected, snapshot());
  assert.equal(calls.some(({ command }) => command === "git"), true);
  for (const command of ["teams", "project", "list", "inspect", "env", "branches", "api"]) {
    assert.equal(calls.some(({ args }) => args.includes(command)), true, command);
  }
  for (const { args } of calls.filter(({ command }) => command === "npx")) {
    if (args.includes("vercel@56.3.2")) continue;
    assert.equal(args.includes("neonctl@2.35.0"), true, args.join(" "));
  }
  const deploymentList = calls.find(({ args }) => args.includes("list"));
  assert.deepEqual(deploymentList?.args.slice(0, 6), [
    "--yes",
    "vercel@56.3.2",
    "list",
    config.projectName,
    "--scope",
    config.teamSlug,
  ]);
  assert.equal(deploymentList?.args.includes("--limit"), true);
  assert.equal(deploymentList?.args.includes("100"), true);
  assert.equal(deploymentList?.args.includes("--status"), true);
  assert.equal(deploymentList?.args.includes("githubCommitRef=codex/billing-preview-oauth"), true);
  assert.equal(deploymentList?.args.includes(`githubCommitSha=${localHead}`), true);
  assert.equal(
    calls.some(({ args }) => args.includes("inspect") && args.includes(new URL(config.adminOrigin).hostname)),
    true,
  );
  const environmentPull = calls.find(({ args }) => args.includes("env") && args.includes("pull"));
  assert.equal(environmentPull?.args.includes("--id"), true);
  assert.equal(environmentPull?.args.includes("dpl_exact_preview"), true);
  assert.equal(runtimeEnvironmentMode, 0o600);
  assert.equal(existsSync(runtimeEnvironmentPath!), false);
});

test("CLI emits a specific safe environment failure and never prints values", async () => {
  const captured = capture();
  const state = snapshot() as unknown as {
    vercel: { environments: unknown[] };
  } & BillingPreviewSnapshot;
  state.vercel.environments = [];
  const exitCode = await billingPreview.runBillingPreviewCli({
    config,
    inspect: async () => state,
    output: captured.output,
  });

  assert.equal(exitCode, 1);
  assert.deepEqual(captured.stdout, []);
  assert.deepEqual(captured.stderr, ["billing_preview_environment_name_missing"]);
  assert.doesNotMatch(captured.stderr.join("\n"), /password|postgresql|secret/i);
});

test("CLI main sets a non-zero exit code without importing or exiting eagerly", async () => {
  const exit = { exitCode: undefined as number | undefined };
  await billingPreview.runBillingPreviewCliMain(
    {
      config,
      inspect: async () => {
        throw new Error("postgresql://account:secret@example.test/db");
      },
      output: capture().output,
    },
    exit,
  );
  assert.equal(exit.exitCode, 1);
});

test("Preview E2E requires attested identity and executes one targeted generator in a react-server child boundary", () => {
  const source = readFileSync(
    join(process.cwd(), "e2e/billing-admin.spec.ts"),
    "utf8",
  );

  for (const requirement of [
    "BILLING_E2E_EXPECTED_ADMIN_EMAIL",
    "BILLING_E2E_RUN_ID",
    "generateDueInvoiceForContract",
    "isFreshAuthStorageState",
    "runBillingPreviewVerifier",
  ]) {
    assert.match(source, new RegExp(requirement), requirement);
  }
  assert.match(source, /api\/internal\/billing\/generate/);
  assert.match(source, /api\/internal\/billing\/reconcile/);
  assert.doesNotMatch(source, /BILLING_E2E_PREVIEW_CRON_SECRET|randomUUID/);
  assert.doesNotMatch(
    source,
    /^import\s+\{\s*generateDueInvoiceForContract\s*\}\s+from\s+["'][^"']+["'];$/m,
  );
  assert.match(source, /"--conditions",\s*"react-server"/);
  assert.match(source, /"--import",\s*resolve\(process\.cwd\(\), "node_modules\/tsx\/dist\/loader\.mjs"\)/);
  assert.match(source, /runBillingPreviewVerifier\(\);\s*\n\s*const generation = await runTargetedInvoiceGenerator/);
  assert.match(source, /process\.execPath,[\s\S]*runDate,[\s\S]*contractId/);
  assert.match(source, /targetCount: number;\s*createdCount: number;\s*failed: Array<\{ code: string \}>/);
});
