import { expect, test, type Page } from "@playwright/test";

type State = "PREPARING" | "UPCOMING" | "OPEN" | "OVERDUE" | "PAID" | "EMPTY";

const summaries: Record<State, object> = {
  PREPARING: { state: "PREPARING", nextPaymentDate: "2026-07-20", amount: null, currency: "KRW", openInvoiceCount: 0, canPay: false },
  UPCOMING: { state: "UPCOMING", nextPaymentDate: "2026-08-01", amount: 330_000, currency: "KRW", openInvoiceCount: 0, canPay: false },
  OPEN: { state: "OPEN", nextPaymentDate: "2026-07-22", amount: 220_000, currency: "KRW", openInvoiceCount: 1, canPay: true },
  OVERDUE: { state: "OVERDUE", nextPaymentDate: "2026-07-14", amount: 110_000, currency: "KRW", openInvoiceCount: 1, canPay: true },
  PAID: { state: "PAID", nextPaymentDate: null, amount: null, currency: "KRW", openInvoiceCount: 0, canPay: false },
  EMPTY: { state: "EMPTY", nextPaymentDate: null, amount: null, currency: "KRW", openInvoiceCount: 0, canPay: false },
};

const titles: Record<State, string> = {
  PREPARING: "결제 준비 중",
  UPCOMING: "다음 결제일",
  OPEN: "결제할 내역이 있습니다",
  OVERDUE: "납부 기한이 지났습니다",
  PAID: "결제 완료",
  EMPTY: "결제할 내역이 없습니다",
};

async function routeSummary(page: Page, state: State) {
  await page.route("**/api/widget/v1/summary", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(summaries[state]) });
  });
}

for (const width of [390, 1280]) {
  for (const state of Object.keys(summaries) as State[]) {
    test(`${state} state at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await routeSummary(page, state);
      await page.goto("/");
      const widget = page.locator("kpopsoft-billing");
      await expect(widget.getByRole("heading", { name: titles[state] })).toBeVisible();
      await expect(widget.getByRole("status")).toHaveAttribute("aria-live", "polite");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (state === "OPEN" || state === "OVERDUE") {
        const button = widget.getByRole("button", { name: "결제하기" });
        await expect(button).toBeVisible();
        expect((await button.evaluate((element) => getComputedStyle(element).minHeight))).toBe("44px");
      } else {
        await expect(widget.getByRole("button", { name: "결제하기" })).toHaveCount(0);
      }
    });
  }
}

test("shows preparing copy while the summary is loading", async ({ page }) => {
  await page.route("**/api/widget/v1/summary", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(summaries.UPCOMING) });
  });
  await page.goto("/");
  await expect(page.locator("kpopsoft-billing").getByRole("heading", { name: "결제 정보를 불러오는 중입니다" })).toBeVisible();
});

test("denied customer session fails closed with a keyboard-accessible retry", async ({ page }) => {
  await page.goto("/?token=denied");
  const widget = page.locator("kpopsoft-billing");
  await expect(widget.getByRole("heading", { name: "결제 정보를 불러오지 못했습니다" })).toBeVisible();
  const retry = widget.getByRole("button", { name: "다시 시도" });
  await retry.focus();
  await expect(retry).toBeFocused();
});

for (const failure of [
  { name: "expired token", status: 401 },
  { name: "wrong origin", status: 403 },
  { name: "replay limit", status: 429 },
]) {
  test(`${failure.name} exposes no provider detail`, async ({ page }) => {
    await page.route("**/api/widget/v1/summary", (route) => route.fulfill({
      status: failure.status,
      contentType: "application/json",
      body: JSON.stringify({ code: "synthetic_private_code" }),
    }));
    await page.goto("/");
    const widget = page.locator("kpopsoft-billing");
    await expect(widget.getByRole("heading", { name: "결제 정보를 불러오지 못했습니다" })).toBeVisible();
    await expect(widget).not.toContainText("synthetic_private_code");
  });
}

test("handoff navigates the top-level page and a second use is denied", async ({ page }) => {
  await routeSummary(page, "OPEN");
  let handoffUses = 0;
  await page.route("**/api/widget/v1/handoffs", async (route) => {
    handoffUses += 1;
    if (handoffUses > 1) {
      await route.fulfill({ status: 409, contentType: "application/json", body: "{}" });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: "http://127.0.0.1:4173/pay/handoff/synthetic" }),
    });
  });
  await page.goto("/");
  await page.locator("kpopsoft-billing").getByRole("button", { name: "결제하기" }).click();
  await expect(page).toHaveURL(/\/pay\/handoff\/synthetic$/);
  await page.goBack();
  const widget = page.locator("kpopsoft-billing");
  await expect(widget.getByRole("button", { name: "결제하기" })).toBeVisible();
  await widget.getByRole("button", { name: "결제하기" }).click();
  await expect(widget.getByRole("heading", { name: "결제 정보를 불러오지 못했습니다" })).toBeVisible();
});
