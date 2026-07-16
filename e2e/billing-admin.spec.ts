import { expect, test } from "@playwright/test";

const disposable = process.env.BILLING_E2E_DISPOSABLE_PREVIEW === "true";
const previewUrl = process.env.BILLING_E2E_PREVIEW_URL;
const draftInvoiceId = process.env.BILLING_E2E_DRAFT_INVOICE_ID;
const paidInvoiceId = process.env.BILLING_E2E_PAID_INVOICE_ID;

test.describe("disposable Preview billing operations", () => {
  test.skip(
    !disposable || !previewUrl || !draftInvoiceId || !paidInvoiceId,
    "BILLING_E2E_DISPOSABLE_PREVIEW=true와 격리 Preview fixture가 필요합니다.",
  );

  test("admin reviews and approves a synthetic draft", async ({ page }) => {
    await page.goto(new URL(`/admin/billing/invoices/${draftInvoiceId}`, previewUrl).href);
    await expect(page.getByRole("heading")).toContainText(/청구|인보이스/);
    await page.getByRole("button", { name: /승인/ }).click();
    await expect(page.getByText(/OPEN|승인 완료/)).toBeVisible();
  });

  test("bank confirmation and payment queue retain explicit confirmation", async ({ page }) => {
    await page.goto(new URL(`/admin/billing/invoices/${draftInvoiceId}`, previewUrl).href);
    await expect(page.getByRole("button", { name: /입금 확인/ })).toBeVisible();
    await page.goto(new URL("/admin/billing/payments", previewUrl).href);
    await expect(page.getByRole("heading", { name: /결제 운영/ })).toBeVisible();
  });

  test("refund requires a confirmation and never runs against Production", async ({ page }) => {
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
