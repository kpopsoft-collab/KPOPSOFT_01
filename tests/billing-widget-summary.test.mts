import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWidgetSummary,
  createWidgetSummaryService,
  type WidgetSummarySnapshot,
} from "../src/lib/billing/widget/summary.ts";

const today = "2026-07-16";

function snapshot(
  overrides: Partial<WidgetSummarySnapshot> = {},
): WidgetSummarySnapshot {
  return {
    invoices: [],
    nextContract: null,
    ...overrides,
  };
}

test("overdue invoices outrank open invoices and expose only aggregate payment data", () => {
  const summary = buildWidgetSummary(
    snapshot({
      invoices: [
        { status: "OPEN", dueDate: "2026-07-22", totalAmount: 220_000, createdAt: "2026-07-10T00:00:00Z" },
        { status: "OVERDUE", dueDate: "2026-07-15", totalAmount: 110_000, createdAt: "2026-07-01T00:00:00Z" },
        { status: "OVERDUE", dueDate: "2026-07-14", totalAmount: 55_000, createdAt: "2026-07-02T00:00:00Z" },
      ],
    }),
    today,
  );
  assert.deepEqual(summary, {
    state: "OVERDUE",
    nextPaymentDate: "2026-07-14",
    amount: 55_000,
    currency: "KRW",
    openInvoiceCount: 3,
    canPay: true,
  });
});

test("an OPEN invoice past its due date is treated as overdue", () => {
  assert.equal(
    buildWidgetSummary(
      snapshot({
        invoices: [
          { status: "OPEN", dueDate: "2026-07-15", totalAmount: 10_000, createdAt: "2026-07-01T00:00:00Z" },
        ],
      }),
      today,
    ).state,
    "OVERDUE",
  );
});

test("drafts are private while upcoming, paid, and empty states remain useful", () => {
  assert.deepEqual(
    buildWidgetSummary(
      snapshot({
        invoices: [
          { status: "DRAFT", dueDate: "2026-07-20", totalAmount: 999_999, createdAt: "2026-07-10T00:00:00Z" },
        ],
      }),
      today,
    ),
    {
      state: "PREPARING",
      nextPaymentDate: "2026-07-20",
      amount: null,
      currency: "KRW",
      openInvoiceCount: 0,
      canPay: false,
    },
  );
  assert.deepEqual(
    buildWidgetSummary(
      snapshot({ nextContract: { nextInvoiceDate: "2026-08-01", totalAmount: 330_000 } }),
      today,
    ),
    {
      state: "UPCOMING",
      nextPaymentDate: "2026-08-01",
      amount: 330_000,
      currency: "KRW",
      openInvoiceCount: 0,
      canPay: false,
    },
  );
  assert.equal(
    buildWidgetSummary(
      snapshot({
        invoices: [
          { status: "PAID", dueDate: "2026-07-10", totalAmount: 110_000, createdAt: "2026-07-01T00:00:00Z" },
        ],
      }),
      today,
    ).state,
    "PAID",
  );
  assert.equal(buildWidgetSummary(snapshot(), today).state, "EMPTY");
});

test("summary service scopes every read to verified site and customer", async () => {
  const calls: unknown[] = [];
  const service = createWidgetSummaryService({
    async loadSnapshot(input) {
      calls.push(input);
      return snapshot({
        invoices: [
          { status: "OPEN", dueDate: "2026-07-20", totalAmount: 110_000, createdAt: "2026-07-01T00:00:00Z" },
        ],
      });
    },
  });
  const result = await service(
    {
      integrationId: "integration",
      publicId: "public",
      siteId: "site",
      customerId: "customer",
      subject: "opaque",
      origin: "https://client.example.com",
      keyVersion: 1,
      expiresAt: "2026-07-16T00:02:00.000Z",
    },
    today,
  );
  assert.deepEqual(calls, [{ siteId: "site", customerId: "customer" }]);
  assert.equal(result.state, "OPEN");
  assert.deepEqual(Object.keys(result).sort(), [
    "amount",
    "canPay",
    "currency",
    "nextPaymentDate",
    "openInvoiceCount",
    "state",
  ]);
  assert.doesNotMatch(
    JSON.stringify(result),
    /customer|business|contact|invoiceNumber|invoiceId/i,
  );
});
