import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import type { DeliveryAttempt } from "../src/lib/admin/types.ts";
import {
  buildInvoiceEmail,
  createInvoiceService,
  type BillingInvoiceRepository,
  type InvoiceDeliveryMessage,
  type PreparedDraftInvoiceInput,
} from "../src/lib/billing/invoices.ts";

const actorId = "11111111-1111-4111-8111-111111111111";
const invoiceId = "22222222-2222-4222-8222-222222222222";
const deliveryId = "33333333-3333-4333-8333-333333333333";

function deliveryMessage(): InvoiceDeliveryMessage {
  return {
    deliveryId,
    recipient: "billing@example.com",
    invoice: {
      customerName: "에이씨미 <테스트>",
      siteName: "고객 포털",
      siteOrigin: "https://portal.example.com",
      invoiceNumber: "KPB-202607-0123456789",
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      issueDate: "2026-07-15",
      dueDate: "2026-07-22",
      supplyAmount: 100_000,
      vatAmount: 10_000,
      totalAmount: 110_000,
      items: [
        {
          productName: "유지관리 & 지원",
          description: "<월간>",
          quantity: 1,
          unitSupplyAmount: 100_000,
          supplyAmount: 100_000,
          vatAmount: 10_000,
          totalAmount: 110_000,
          sortOrder: 0,
        },
      ],
    },
  };
}

function repository(
  overrides: Partial<BillingInvoiceRepository> = {},
): BillingInvoiceRepository {
  return {
    async updateDraft() {
      return "updated";
    },
    async approveInvoice() {
      return { kind: "approved", deliveries: [] };
    },
    async voidInvoice() {
      return "voided";
    },
    async getDeliveryForRetry() {
      return deliveryMessage();
    },
    async recordDeliveryAttempt() {},
    ...overrides,
  };
}

test("draft edits ignore client totals and recalculate every item", async () => {
  const savedInputs: PreparedDraftInvoiceInput[] = [];
  const service = createInvoiceService(
    repository({
      async updateDraft(_actorId, _invoiceId, input) {
        savedInputs.push(input);
        return "updated";
      },
    }),
    async () => ({ ok: true, externalId: "message" }),
  );

  const spoofedTotals = {
    periodStart: "2026-07-01",
    periodEnd: "2026-07-31",
    issueDate: "2026-07-15",
    dueDate: "2026-07-22",
    items: [
      {
        productCode: "MAINTENANCE",
        productName: "유지관리",
        description: "월 유지관리",
        quantity: 2,
        unitSupplyAmount: 100_000,
        vatAmount: 20_000,
        supplyAmount: 1,
        totalAmount: 1,
      },
    ],
  };
  await service.updateDraftInvoice(actorId, invoiceId, spoofedTotals);

  assert.deepEqual(savedInputs[0]?.totals, {
    supplyAmount: 200_000,
    vatAmount: 20_000,
    totalAmount: 220_000,
  });
  assert.equal(savedInputs[0]?.items[0]?.supplyAmount, 200_000);
  assert.equal(savedInputs[0]?.items[0]?.totalAmount, 220_000);
});

test("non-draft invoices cannot be edited", async () => {
  const service = createInvoiceService(
    repository({ async updateDraft() { return "not_draft"; } }),
    async () => ({ ok: true, externalId: "message" }),
  );
  await assert.rejects(
    () =>
      service.updateDraftInvoice(actorId, invoiceId, {
        periodStart: "2026-07-01",
        periodEnd: "2026-07-31",
        issueDate: "2026-07-15",
        dueDate: "2026-07-22",
        items: [
          {
            productCode: "MAINTENANCE",
            productName: "유지관리",
            description: "월 유지관리",
            quantity: 1,
            unitSupplyAmount: 100_000,
            vatAmount: 10_000,
          },
        ],
      }),
    /초안 상태에서만/,
  );
});

test("approval remains complete when email delivery fails", async () => {
  const attempts: Array<{ id: string; attempt: DeliveryAttempt }> = [];
  const service = createInvoiceService(
    repository({
      async approveInvoice() {
        return { kind: "approved", deliveries: [deliveryMessage()] };
      },
      async recordDeliveryAttempt(id, attempt) {
        attempts.push({ id, attempt });
      },
    }),
    async () => ({ ok: false, errorCode: "provider_error" }),
  );

  await assert.doesNotReject(() => service.approveInvoice(actorId, invoiceId));
  assert.deepEqual(attempts, [
    {
      id: deliveryId,
      attempt: { ok: false, errorCode: "provider_error" },
    },
  ]);
});

test("approval without opted-in recipients sends nothing", async () => {
  let sendCount = 0;
  const service = createInvoiceService(repository(), async () => {
    sendCount += 1;
    return { ok: true, externalId: "message" };
  });

  await service.approveInvoice(actorId, invoiceId);
  assert.equal(sendCount, 0);
});

test("paid or otherwise terminal invoices cannot be voided", async () => {
  const service = createInvoiceService(
    repository({ async voidInvoice() { return "invalid_status"; } }),
    async () => ({ ok: true, externalId: "message" }),
  );

  await assert.rejects(
    () => service.voidInvoice(actorId, invoiceId, "x"),
    /5자 이상/,
  );
  await assert.rejects(
    () =>
      service.voidInvoice(
        actorId,
        invoiceId,
        "고객 요청으로 청구를 취소합니다.",
      ),
    /무효 처리할 수 없는 상태/,
  );
});

test("delivery retry uses the stored recipient and increments through repository", async () => {
  const attempts: DeliveryAttempt[] = [];
  const service = createInvoiceService(
    repository({
      async recordDeliveryAttempt(_id, attempt) {
        attempts.push(attempt);
      },
    }),
    async ({ to }) => {
      assert.equal(to, "billing@example.com");
      return { ok: true, externalId: "message-2" };
    },
  );

  await service.retryInvoiceDelivery(actorId, deliveryId);
  assert.deepEqual(attempts, [{ ok: true, externalId: "message-2" }]);
});

test("invoice email is escaped and points only to the customer management site", () => {
  const message = buildInvoiceEmail(deliveryMessage().invoice);

  assert.match(message.subject, /KPB-202607-0123456789/);
  assert.match(message.text, /https:\/\/portal\.example\.com/);
  assert.match(message.text, /관리사이트에 로그인/);
  assert.doesNotMatch(message.text, /paymentKey|handoff|token=|\/pay\//i);
  assert.match(message.html, /에이씨미 &lt;테스트&gt;/);
  assert.match(message.html, /유지관리 &amp; 지원/);
  assert.doesNotMatch(message.html, /<월간>/);
});

test("approval SQL locks, recalculates, audits, and enqueues atomically", () => {
  const source = readFileSync(
    join(process.cwd(), "src/lib/billing/invoices.ts"),
    "utf8",
  );
  assert.match(source, /for update/);
  assert.match(source, /sum\(.*supply_amount/);
  assert.match(source, /status = 'OPEN'/);
  assert.match(source, /billing\.invoice\.approved/);
  assert.match(source, /insert into \$\{billingInvoiceDeliveries\}/);
  assert.match(source, /receives_billing/);
  assert.match(source, /status in \('DRAFT', 'OPEN', 'OVERDUE'\)/);
});
