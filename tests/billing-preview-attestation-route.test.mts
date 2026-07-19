import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const routePath = "../src/app/api/internal/billing/attestation/route.ts";
const routeFilePath = new URL(routePath, import.meta.url);

const endpointHost = "ep-polished-scene-at1xxh71.c-9.us-east-1.aws.neon.tech";
const deploymentId = "dpl_exact_preview";
const gitCommitSha = "a".repeat(40);
const headerDeploymentId = "x-kpopsoft-billing-attestation-deployment-id";
const headerGitCommitSha = "x-kpopsoft-billing-attestation-git-sha";

const runtimeEnvironment: Record<string, string> = {
  AUTH_GOOGLE_ID: "test-google-id",
  AUTH_GOOGLE_SECRET: "test-google-secret",
  AUTH_SECRET: "test-auth-secret",
  BANK_TRANSFER_ENABLED: "false",
  BILLING_CRON_SECRET: "test-billing-cron-secret",
  BILLING_ENABLED: "true",
  BILLING_WIDGET_ENABLED: "false",
  DATABASE_URL: `postgresql://user:password@${endpointHost}/preview`,
  TOSS_PAYMENTS_ENABLED: "false",
  VERCEL_DEPLOYMENT_ID: deploymentId,
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_REF: "codex/billing-preview-oauth",
  VERCEL_GIT_COMMIT_SHA: gitCommitSha,
};

const runtimeKeys = Object.keys(runtimeEnvironment);

async function withRuntimeEnvironment(
  overrides: Partial<Record<string, string | undefined>>,
  callback: () => Promise<void>,
): Promise<void> {
  const original = new Map(runtimeKeys.map((key) => [key, process.env[key]]));
  try {
    for (const key of runtimeKeys) {
      const value = overrides[key] ?? runtimeEnvironment[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await callback();
  } finally {
    for (const key of runtimeKeys) {
      const value = original.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function request(
  headers: Record<string, string> = {
    [headerDeploymentId]: deploymentId,
    [headerGitCommitSha]: gitCommitSha,
  },
): Request {
  return new Request("https://example.test/api/internal/billing/attestation", { headers });
}

async function getRoute() {
  assert.equal(existsSync(routeFilePath), true, "attestation route must exist");
  return import(routePath);
}

test("attestation route returns 404 outside the exact Preview deployment identity", async () => {
  const route = await getRoute();

  for (const [overrides, headers] of [
    [{ VERCEL_ENV: "production" }, undefined],
    [{ VERCEL_GIT_COMMIT_REF: "main" }, undefined],
    [{}, {}],
    [{}, { [headerDeploymentId]: "dpl_other", [headerGitCommitSha]: gitCommitSha }],
    [{}, { [headerDeploymentId]: deploymentId, [headerGitCommitSha]: "b".repeat(40) }],
    [{ VERCEL_DEPLOYMENT_ID: "dpl_other" }, undefined],
    [{ VERCEL_GIT_COMMIT_SHA: "b".repeat(40) }, undefined],
  ] as const) {
    await withRuntimeEnvironment(overrides, async () => {
      const response = await route.GET(request(headers));
      assert.equal(response.status, 404);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(await response.text(), "");
    });
  }
});

test("attestation route emits only the fixed boolean contract with no-store", async () => {
  const route = await getRoute();

  await withRuntimeEnvironment({}, async () => {
    const response = await route.GET(request());
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(Object.keys(body).sort(), [
      "bankTransferDisabled",
      "billingEnabled",
      "billingWidgetDisabled",
      "databaseUrlMatchesPreviewEndpoint",
      "deploymentIdMatchesRequest",
      "gitCommitShaMatchesRequest",
      "requiredRuntimeEnvironmentPresent",
      "tossPaymentsDisabled",
    ]);
    assert.equal(Object.values(body).every((value) => typeof value === "boolean"), true);
    assert.equal(Object.values(body).every(Boolean), true);
    assert.doesNotMatch(JSON.stringify(body), /AUTH_|DATABASE_URL|postgresql|password|secret/i);
  });
});

test("attestation route fails closed for missing values, flags, and a wrong database host", async () => {
  const route = await getRoute();

  for (const [overrides, field] of [
    [{ AUTH_GOOGLE_SECRET: "" }, "requiredRuntimeEnvironmentPresent"],
    [{ BILLING_ENABLED: "false" }, "billingEnabled"],
    [{ BANK_TRANSFER_ENABLED: "true" }, "bankTransferDisabled"],
    [{ TOSS_PAYMENTS_ENABLED: "true" }, "tossPaymentsDisabled"],
    [{ BILLING_WIDGET_ENABLED: "true" }, "billingWidgetDisabled"],
    [{ DATABASE_URL: "postgresql://user:password@ep-production.example.test/app" }, "databaseUrlMatchesPreviewEndpoint"],
  ] as const) {
    await withRuntimeEnvironment(overrides, async () => {
      const response = await route.GET(request());
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body[field], false, field);
    });
  }
});
