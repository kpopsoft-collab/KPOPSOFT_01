import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

const previewAdminHost = "admin-kpopsoft-billing-preview-neo.vercel.app";
const disposable = process.env.BILLING_E2E_DISPOSABLE_PREVIEW === "true";
const cronSecret = process.env.BILLING_E2E_PREVIEW_CRON_SECRET;
const storageStatePath = process.env.BILLING_E2E_STORAGE_STATE_PATH;
const legacyPreviewUrl = process.env.BILLING_E2E_PREVIEW_URL;
const previewUrlInput = process.env.BILLING_E2E_BASE_URL ?? legacyPreviewUrl;

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

function hasAuthenticatedStorageState(path: string | undefined): path is string {
  if (!path || !existsSync(path)) return false;
  try {
    const state = JSON.parse(readFileSync(path, "utf8")) as {
      cookies?: unknown[];
      origins?: unknown[];
    };
    return (state.cookies?.length ?? 0) > 0 || (state.origins?.length ?? 0) > 0;
  } catch {
    return false;
  }
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

const previewUrl = previewBaseUrl(previewUrlInput);
const authenticatedStorageState = hasAuthenticatedStorageState(storageStatePath);
const canRunDisposableWorkflow =
  disposable && Boolean(previewUrl) && Boolean(cronSecret) && authenticatedStorageState;
const specializedFixtures =
  canRunDisposableWorkflow && process.env.BILLING_E2E_SPECIALIZED_FIXTURES === "true";

if (authenticatedStorageState) {
  test.use({ storageState: storageStatePath });
}

test.describe("disposable Preview billing workflow", () => {
  test.skip(
    !canRunDisposableWorkflow,
    "BILLING_E2E_DISPOSABLE_PREVIEW=true, 승인된 Preview URL, 인증된 ephemeral storage state, Preview cron secret이 필요합니다.",
  );

  test("admin creates, activates, generates, and approves an isolated synthetic invoice", async ({ page }) => {
    const suffix = randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
    const customerCode = `E2E${suffix}`;
    const customerName = `E2E Synthetic ${suffix}`;
    const siteCode = `E2E_SITE_${suffix}`;
    const siteOrigin = `https://${suffix.toLowerCase()}.invalid`;
    const today = todayInSeoul();

    await page.goto(new URL("/admin/billing/customers/new", previewUrl).href);
    await expect(page).not.toHaveURL(/\/admin\/login/);
    await page.getByLabel("고객사 코드").fill(customerCode);
    await page.getByLabel("상호").fill(customerName);
    await page.getByLabel("대표자").fill("E2E");
    await page.getByLabel("사이트 코드").fill(siteCode);
    await page.getByLabel("사이트명").fill(`E2E Site ${suffix}`);
    await page.getByLabel("HTTPS Origin").fill(siteOrigin);
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

    const generation = await page.request.get(
      new URL("/api/internal/billing/generate", previewUrl).href,
      { headers: { authorization: `Bearer ${cronSecret}` } },
    );
    expect(generation.status()).toBe(200);
    await expect(generation).toBeOK();
    await expect(await generation.json()).toMatchObject({ ok: true });

    await page.goto(
      new URL(`/admin/billing/invoices?query=${encodeURIComponent(customerCode)}&status=DRAFT`, previewUrl).href,
    );
    const draftRow = page.locator("tr").filter({ hasText: customerCode });
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
    "BILLING_E2E_SPECIALIZED_FIXTURES=true와 별도 합성 fixture가 필요합니다.",
  );

  test("bank confirmation and payment queue retain explicit confirmation", async ({ page }) => {
    const draftInvoiceId = process.env.BILLING_E2E_DRAFT_INVOICE_ID;
    test.skip(!draftInvoiceId, "합성 draft invoice ID가 필요합니다.");
    await page.goto(new URL(`/admin/billing/invoices/${draftInvoiceId}`, previewUrl).href);
    await expect(page.getByRole("button", { name: /입금 확인/ })).toBeVisible();
    await page.goto(new URL("/admin/billing/payments", previewUrl).href);
    await expect(page.getByRole("heading", { name: /결제 운영/ })).toBeVisible();
  });

  test("refund requires a confirmation and never runs against Production", async ({ page }) => {
    const paidInvoiceId = process.env.BILLING_E2E_PAID_INVOICE_ID;
    test.skip(!paidInvoiceId, "합성 paid invoice ID가 필요합니다.");
    await page.goto(new URL(`/admin/billing/payments/${paidInvoiceId}`, previewUrl).href);
    await expect(page.getByRole("button", { name: /환불/ })).toBeVisible();
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: /환불/ }).click();
  });

  test("payment session scopes invoices and hides unconfigured bank details", async ({ page }) => {
    const sessionPath = process.env.BILLING_E2E_PAYMENT_SESSION_PATH;
    test.skip(!sessionPath, "합성 결제 세션 경로가 필요합니다.");
    await page.goto(new URL(sessionPath!, previewUrl).href);
    await expect(page.getByRole("main")).not.toContainText(/다른 고객사|계좌번호 없음/);
  });

  test("Toss success cancel and fail use test fixtures only", async ({ page }) => {
    const tossFixturePath = process.env.BILLING_E2E_TOSS_FIXTURE_PATH;
    test.skip(!tossFixturePath, "토스 테스트 키 전용 fixture 경로가 필요합니다.");
    await page.goto(new URL(tossFixturePath!, previewUrl).href);
    await expect(page.getByText(/성공|취소|실패/)).toBeVisible();
  });
});
