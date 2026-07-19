export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };
const expectedBranch = "codex/billing-preview-oauth";
const expectedEndpointHost = "ep-polished-scene-at1xxh71.c-9.us-east-1.aws.neon.tech";
const deploymentIdHeader = "x-kpopsoft-billing-attestation-deployment-id";
const gitCommitShaHeader = "x-kpopsoft-billing-attestation-git-sha";
const requiredRuntimeEnvironmentNames = [
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

function hasNonemptyValue(name: string): boolean {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
}

function poolerVariant(hostname: string): string {
  const [firstLabel, ...remainingLabels] = hostname.split(".");
  if (!firstLabel || remainingLabels.length === 0) return "";
  return `${firstLabel.endsWith("-pooler") ? firstLabel : `${firstLabel}-pooler`}.${remainingLabels.join(".")}`;
}

function databaseUrlMatchesPreviewEndpoint(): boolean {
  try {
    const hostname = new URL(process.env.DATABASE_URL ?? "").hostname;
    return hostname === expectedEndpointHost || hostname === poolerVariant(expectedEndpointHost);
  } catch {
    return false;
  }
}

function notFound(): Response {
  return new Response(null, { status: 404, headers });
}

export async function GET(request: Request): Promise<Response> {
  const expectedDeploymentId = request.headers.get(deploymentIdHeader);
  const expectedGitCommitSha = request.headers.get(gitCommitShaHeader);
  const deploymentIdMatchesRequest =
    Boolean(expectedDeploymentId) && process.env.VERCEL_DEPLOYMENT_ID === expectedDeploymentId;
  const gitCommitShaMatchesRequest =
    Boolean(expectedGitCommitSha) && process.env.VERCEL_GIT_COMMIT_SHA === expectedGitCommitSha;

  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== expectedBranch ||
    !deploymentIdMatchesRequest ||
    !gitCommitShaMatchesRequest
  ) {
    return notFound();
  }

  return Response.json(
    {
      bankTransferDisabled: process.env.BANK_TRANSFER_ENABLED === "false",
      billingEnabled: process.env.BILLING_ENABLED === "true",
      billingWidgetDisabled: process.env.BILLING_WIDGET_ENABLED === "false",
      databaseUrlMatchesPreviewEndpoint: databaseUrlMatchesPreviewEndpoint(),
      deploymentIdMatchesRequest,
      gitCommitShaMatchesRequest,
      requiredRuntimeEnvironmentPresent: requiredRuntimeEnvironmentNames.every(hasNonemptyValue),
      tossPaymentsDisabled: process.env.TOSS_PAYMENTS_ENABLED === "false",
    },
    { headers },
  );
}
