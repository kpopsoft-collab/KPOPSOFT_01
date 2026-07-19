import { execFile } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { generateDueInvoiceForContract } from "../src/lib/billing/invoice-generator.ts";

const execFileAsync = promisify(execFile);

const previewAdminHost = "admin-kpopsoft-billing-preview-neo.vercel.app";
const maxStorageStateAgeMs = 10 * 60 * 1000;
const disposable = process.env.BILLING_E2E_DISPOSABLE_PREVIEW === "true";
const storageStatePath = process.env.BILLING_E2E_STORAGE_STATE_PATH;
const previewUrlInput = process.env.BILLING_E2E_BASE_URL;
const expectedAdminEmail = process.env.BILLING_E2E_EXPECTED_ADMIN_EMAIL?.trim();
const runIdInput = process.env.BILLING_E2E_RUN_ID;

type SyntheticEvidenceCodes = {
  customerCode: string;
  customerName: string;
  siteCode: string;
  siteName: string;
  siteOrigin: string;
};

function previewBaseUrl(input: string | undefined): string | undefined {
  if (!input) return undefined;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("billing_e2e_preview_origin_rejected");
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== previewAdminHost ||
    url.port ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error("billing_e2e_preview_origin_rejected");
  }

  return url.origin;
}

function isFreshAuthStorageState(path: string | undefined): path is string {
  if (!path || !existsSync(path)) return false;

  try {
    const age = Date.now() - statSync(path).mtimeMs;
    if (age < 0 || age > maxStorageStateAgeMs) return false;

    const state = JSON.parse(readFileSync(path, "utf8")) as {
      cookies?: Array<{
        domain?: unknown;
        expires?: unknown;
        name?: unknown;
      }>;
    };
    const nowInSeconds = Date.now() / 1000;
    return Boolean(
      state.cookies?.some(
        (cookie) =>
          cookie.domain === previewAdminHost &&
          typeof cookie.expires === "number" &&
          cookie.expires > nowInSeconds &&
          (cookie.name === "authjs.session-token" ||
            cookie.name === "__Secure-authjs.session-token" ||
            cookie.name === "next-auth.session-token" ||
            cookie.name === "__Secure-next-auth.session-token"),
      ),
    );
  } catch {
    return false;
  }
}

function syntheticEvidenceCodes(runId: string | undefined): SyntheticEvidenceCodes | undefined {
  if (!runId) return undefined;
  if (!/^[a-z0-9](?:[a-z0-9-]{6,23}[a-z0-9])$/.test(runId)) {
    throw new Error("billing_e2e_run_id_invalid");
  }

  const code = runId.toUpperCase();
  return {
    customerCode: `E2E_${code}`,
    customerName: `E2E Preview evidence ${code}`,
    siteCode: `E2ES_${code}`,
    siteName: `E2E Preview site ${code}`,
    siteOrigin: `https://e2e-${runId}.invalid`,
  };
}

function previewPath(path: string): string {
  if (!previewUrl || !path.startsWith("/") || path.startsWith("//")) {
    throw new Error("billing_e2e_fixture_path_rejected");
  }
  const target = new URL(path, previewUrl);
  if (target.origin !== previewUrl) {
    throw new Error("billing_e2e_fixture_path_rejected");
  }
  return target.href;
}

function fixturePath(path: string | undefined): string {
  if (!path) throw new Error("billing_e2e_fixture_path_rejected");
  return previewPath(path);
}

function todayInSeoul(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

async function runBillingPreviewVerifier(): Promise<void> {
  try {
    const result = await execFileAsync(
      process.execPath,
      [
        resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs"),
        "scripts/verify-billing-preview.mts",
      ],
      { encoding: "utf8", env: process.env },
    );
    expect(result.stdout.trim()).toBe("billing_preview_ready");
    expect(result.stderr.trim()).toBe("");
  } catch {
    throw new Error("billing_e2e_preview_verifier_failed");
  }
}

async function assertUnauthenticatedBillingEndpoints(
  request: APIRequestContext,
): Promise<void> {
  for (const path of [
    "/api/internal/billing/generate",
    "/api/internal/billing/reconcile",
  ]) {
    const response = await request.get(previewPath(path));
    expect(response.status()).toBe(401);
  }
}

async function assertActiveExpectedAdmin(page: Page): Promise<void> {
  await page.goto(previewPath("/admin/billing"));
  await expect(page).not.toHaveURL(/\/admin\/login/);
  await expect(page).toHaveURL(new RegExp(`${previewAdminHost}/admin/billing(?:[/?#]|$)`));
  await expect(page.getByText(expectedAdminEmail!, { exact: true })).toBeVisible();
}

const previewUrl = previewBaseUrl(previewUrlInput);
const authenticatedStorageState = isFreshAuthStorageState(storageStatePath);
const syntheticEvidence = syntheticEvidenceCodes(runIdInput);
const canRunDisposableWorkflow =
  disposable &&
  Boolean(previewUrl) &&
  Boolean(expectedAdminEmail) &&
  Boolean(syntheticEvidence) &&
  authenticatedStorageState;
const specializedFixtures =
  canRunDisposableWorkflow && process.env.BILLING_E2E_SPECIALIZED_FIXTURES === "true";

if (authenticatedStorageState) {
  test.use({ storageState: storageStatePath });
}

async function prepareAttestedAdmin(page: Page, request: APIRequestContext): Promise<void> {
  await runBillingPreviewVerifier();
  await assertUnauthenticatedBillingEndpoints(request);
  await assertActiveExpectedAdmin(page);
}

test.describe("disposable Preview billing workflow", () => {
  test.skip(
    !canRunDisposableWorkflow,
    "BILLING_E2E_DISPOSABLE_PREVIEW=true, canonical Preview URL, fresh Auth.js storage state, expected admin email, and a valid run ID are required.",
  );

  test.beforeEach(async ({ page, request }) => {
    await prepareAttestedAdmin(page, request);
  });

  test("admin creates, activates, generates, and approves recoverable disposable Preview evidence", async ({ page }) => {
    const evidence = syntheticEvidence!;
    const today = todayInSeoul();

    await page.goto(previewPath("/admin/billing/customers/new"));
    await page.getByLabel("고객사 코드").fill(evidence.customerCode);
    await page.getByLabel("상호").fill(evidence.customerName);
    await page.getByLabel("대표자").fill("E2E");
    await page.getByLabel("사이트 코드").fill(evidence.siteCode);
    await page.getByLabel("사이트명").fill(evidence.siteName);
    await page.getByLabel("HTTPS Origin").fill(evidence.siteOrigin);
    await page.getByRole("button", { name: "고객사 저장" }).click();
    await page.waitForURL(/\/admin\/billing\/customers\/[^/]+$/);
    await expect(page.getByText("등록된 담당자가 없습니다.")).toBeVisible();

    await page.getByRole("link", { name: "계약 초안 만들기" }).click();
    await expect(page.getByRole("heading", { name: "계약" })).toBeVisible();
    await page.getByLabel("청구 주기").selectOption("MONTHLY");
    await page.getByLabel("시작일").fill(today);
    await page.getByLabel("다음 청구일").fill(today);
    await page.getByLabel("단가").fill("10000");
    await page.getByLabel("부가세").fill("1000");
    await page.getByRole("button", { name: "초안 계약 만들기" }).click();
    await page.waitForURL(/\/admin\/billing\/contracts\/[^/]+$/);
    await page.getByRole("button", { name: "ACTIVE", exact: true }).click();
    await expect(page.getByText(/ACTIVE · MONTHLY/)).toBeVisible();

    const contractMatch = new URL(page.url()).pathname.match(
      /^\/admin\/billing\/contracts\/([^/]+)$/,
    );
    expect(contractMatch?.[1]).toBeTruthy();
    const generation = await generateDueInvoiceForContract(
      today,
      decodeURIComponent(contractMatch![1]!),
    );
    expect(generation.targetCount).toBe(1);
    expect(generation.createdCount).toBe(1);
    expect(generation.failed).toEqual([]);

    await page.goto(
      previewPath(
        `/admin/billing/invoices?query=${encodeURIComponent(evidence.customerCode)}&status=DRAFT`,
      ),
    );
    const draftRow = page.locator("tr").filter({ hasText: evidence.customerCode });
    await expect(draftRow).toHaveCount(1);
    await draftRow.getByRole("link").click();
    await expect(page.getByText("등록된 청구 수신자가 없습니다.")).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "승인 및 이메일 발송" }).click();
    await expect(page.getByText("청구서를 승인했습니다.")).toBeVisible();
    await expect(page.getByText(/OPEN/)).toBeVisible();
  });
});

test.describe("specialized disposable Preview fixtures", () => {
  test.skip(
    !specializedFixtures,
    "BILLING_E2E_SPECIALIZED_FIXTURES=true and separate synthetic fixture paths are required.",
  );

  test.beforeEach(async ({ page, request }) => {
    await prepareAttestedAdmin(page, request);
  });

  test("bank confirmation and payment queue retain explicit confirmation", async ({ page }) => {
    const draftInvoiceId = process.env.BILLING_E2E_DRAFT_INVOICE_ID;
    test.skip(!draftInvoiceId, "A synthetic draft invoice ID is required.");
    await page.goto(fixturePath(`/admin/billing/invoices/${encodeURIComponent(draftInvoiceId!)}`));
    await expect(page.getByRole("button", { name: /입금 확인/ })).toBeVisible();
    await page.goto(previewPath("/admin/billing/payments"));
    await expect(page.getByRole("heading", { name: /결제 운영/ })).toBeVisible();
  });

  test("refund requires a confirmation and never runs against Production", async ({ page }) => {
    const paidInvoiceId = process.env.BILLING_E2E_PAID_INVOICE_ID;
    test.skip(!paidInvoiceId, "A synthetic paid invoice ID is required.");
    await page.goto(fixturePath(`/admin/billing/payments/${encodeURIComponent(paidInvoiceId!)}`));
    await expect(page.getByRole("button", { name: /환불/ })).toBeVisible();
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: /환불/ }).click();
  });

  test("payment session scopes invoices and hides unconfigured bank details", async ({ page }) => {
    const sessionPath = process.env.BILLING_E2E_PAYMENT_SESSION_PATH;
    test.skip(!sessionPath, "A synthetic payment session path is required.");
    await page.goto(fixturePath(sessionPath));
    await expect(page.getByRole("main")).not.toContainText(/다른 고객사|계좌번호 없음/);
  });

  test("Toss success cancel and fail use test fixtures only", async ({ page }) => {
    const tossFixturePath = process.env.BILLING_E2E_TOSS_FIXTURE_PATH;
    test.skip(!tossFixturePath, "A Toss test fixture path is required.");
    await page.goto(fixturePath(tossFixturePath));
    await expect(page.getByText(/성공|취소|실패/)).toBeVisible();
  });
});
