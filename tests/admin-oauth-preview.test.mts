import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGoogleCallbackUrl,
  runBillingPreviewCli,
  runBillingPreviewCliMain,
  verifyBillingPreview,
  type BillingPreviewConfig,
  type BillingPreviewSnapshot,
} from "../scripts/verify-billing-preview.mts";

const config: BillingPreviewConfig = {
  adminOrigin: "https://admin-kpopsoft-billing-preview-neo.vercel.app",
  branch: "codex/billing-preview-oauth",
  neonBranchId: "br-lingering-thunder-at6twb35",
  neonParentId: "br-lingering-salad-atyk2pqm",
  neonProjectId: "red-smoke-09462401",
  projectId: "prj_billing_preview",
  projectName: "kpopsoft-billing-preview-neo",
  teamId: "team_kpopsoft",
  teamSlug: "kpopsoft-2075s-projects",
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

const snapshot = (
  overrides: Partial<BillingPreviewSnapshot> = {},
): BillingPreviewSnapshot => ({
  vercel: {
    deployment: {
      aliases: [config.adminOrigin],
      gitBranch: config.branch,
      target: "preview",
    },
    environments: requiredEnvironmentNames.map((key) => ({
      gitBranch: config.branch,
      key,
      target: "preview",
    })),
    project: {
      id: config.projectId!,
      name: config.projectName,
      teamId: config.teamId!,
    },
    team: { id: config.teamId!, slug: config.teamSlug },
  },
  neon: {
    currentState: "ready",
    expiresAt: "2026-08-02T08:00:00Z",
    id: config.neonBranchId,
    isDefault: false,
    isPrimary: false,
    parentId: config.neonParentId,
    projectId: config.neonProjectId,
  },
  ...overrides,
});

test("billing Preview OAuth callback stays on the admin host", () => {
  assert.equal(
    buildGoogleCallbackUrl(config.adminOrigin),
    "https://admin-kpopsoft-billing-preview-neo.vercel.app/api/auth/callback/google",
  );
});

for (const origin of [
  "http://admin-kpopsoft-billing-preview-neo.vercel.app",
  "https://kpopsoft-billing-preview-neo.vercel.app",
  "https://admin-kpopsoft-billing-preview-neo.vercel.app:8443",
  "https://admin-kpopsoft-billing-preview-neo.vercel.app/admin",
  "https://admin-kpopsoft-billing-preview-neo.vercel.app?next=/admin",
  "https://user@admin-kpopsoft-billing-preview-neo.vercel.app",
]) {
  test(`rejects a non-canonical OAuth callback origin: ${origin}`, () => {
    assert.throws(() => buildGoogleCallbackUrl(origin), /admin_origin_invalid/);
  });
}

test("accepts the exact Preview project, team, deployment, branch, and environment names", () => {
  assert.deepEqual(verifyBillingPreview(config, snapshot()), {
    ok: true,
    code: "billing_preview_ready",
  });
});

test("rejects a deployment that is not Preview", () => {
  const state = snapshot();
  state.vercel.deployment.target = "production";
  assert.deepEqual(verifyBillingPreview(config, state), {
    ok: false,
    code: "deployment_not_preview",
  });
});

test("rejects a Preview deployment from another branch", () => {
  const state = snapshot();
  state.vercel.deployment.gitBranch = "main";
  assert.deepEqual(verifyBillingPreview(config, state), {
    ok: false,
    code: "deployment_branch_mismatch",
  });
});

test("rejects a project or team identity mismatch", () => {
  const state = snapshot();
  state.vercel.project.teamId = "team_other";
  assert.deepEqual(verifyBillingPreview(config, state), {
    ok: false,
    code: "project_team_mismatch",
  });
});

test("rejects a linked Vercel project with the wrong identity", () => {
  const state = snapshot();
  state.vercel.project.name = "another-project";
  assert.deepEqual(verifyBillingPreview(config, state), {
    ok: false,
    code: "project_mismatch",
  });
});

test("rejects a linked Vercel team with the wrong identity", () => {
  const state = snapshot();
  state.vercel.team.slug = "another-team";
  assert.deepEqual(verifyBillingPreview(config, state), {
    ok: false,
    code: "team_mismatch",
  });
});

test("rejects an unexpected admin Preview host", () => {
  const state = snapshot();
  state.vercel.deployment.aliases = ["https://admin-other-preview.vercel.app"];
  assert.deepEqual(verifyBillingPreview(config, state), {
    ok: false,
    code: "admin_host_mismatch",
  });
});

test("rejects missing required Preview environment names", () => {
  const state = snapshot();
  state.vercel.environments = state.vercel.environments.filter(
    (environment) => environment.key !== "AUTH_GOOGLE_SECRET",
  );
  assert.deepEqual(verifyBillingPreview(config, state), {
    ok: false,
    code: "environment_name_missing",
  });
});

test("rejects a required environment name scoped to another branch", () => {
  const state = snapshot();
  state.vercel.environments[0]!.gitBranch = "codex/older-billing-branch";
  assert.deepEqual(verifyBillingPreview(config, state), {
    ok: false,
    code: "environment_scope_mismatch",
  });
});

test("rejects a required environment name scoped to Production", () => {
  const state = snapshot();
  state.vercel.environments[0]!.target = "production";
  assert.deepEqual(verifyBillingPreview(config, state), {
    ok: false,
    code: "environment_scope_mismatch",
  });
});

for (const [label, mutate, code] of [
  [
    "wrong Neon project",
    (state: BillingPreviewSnapshot) => {
      state.neon.projectId = "red-other";
    },
    "neon_project_mismatch",
  ],
  [
    "wrong Neon branch ID",
    (state: BillingPreviewSnapshot) => {
      state.neon.id = "br-other";
    },
    "neon_id_mismatch",
  ],
  [
    "wrong Neon parent",
    (state: BillingPreviewSnapshot) => {
      state.neon.parentId = "br-other";
    },
    "neon_parent_mismatch",
  ],
  [
    "primary Neon branch",
    (state: BillingPreviewSnapshot) => {
      state.neon.isPrimary = true;
    },
    "neon_primary_branch",
  ],
  [
    "default Neon branch",
    (state: BillingPreviewSnapshot) => {
      state.neon.isDefault = true;
    },
    "neon_default_branch",
  ],
  [
    "expired Neon branch",
    (state: BillingPreviewSnapshot) => {
      state.neon.expiresAt = "2026-07-18T08:00:00Z";
    },
    "neon_expired",
  ],
  [
    "unready Neon branch",
    (state: BillingPreviewSnapshot) => {
      state.neon.currentState = "init";
    },
    "neon_not_ready",
  ],
] as const) {
  test(`rejects a ${label}`, () => {
    const state = snapshot();
    mutate(state);
    assert.deepEqual(verifyBillingPreview(config, state), { ok: false, code });
  });
}

const capture = () => {
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
};

test("CLI emits only a safe success code", async () => {
  const captured = capture();
  const exitCode = await runBillingPreviewCli({
    config,
    inspect: async () => snapshot(),
    output: captured.output,
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(captured.stdout, ["billing_preview_ready"]);
  assert.deepEqual(captured.stderr, []);
});

test("CLI is non-zero and error-safe when inspection fails", async () => {
  const captured = capture();
  const exitCode = await runBillingPreviewCli({
    config,
    inspect: async () => {
      throw new Error("postgres://account:secret@example.test/db");
    },
    output: captured.output,
  });

  assert.equal(exitCode, 1);
  assert.deepEqual(captured.stdout, []);
  assert.deepEqual(captured.stderr, ["billing_preview_inspection_failed"]);
});

test("CLI main sets a non-zero exit code without importing or exiting eagerly", async () => {
  const exit = { exitCode: undefined as number | undefined };
  await runBillingPreviewCliMain(
    {
      config,
      inspect: async () => {
        throw new Error("not printed");
      },
      output: capture().output,
    },
    exit,
  );
  assert.equal(exit.exitCode, 1);
});
