import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  createInvoiceGenerator,
  generationKey,
  type DraftInvoiceInput,
  type DueInvoiceContract,
  type InvoiceGeneratorRepository,
} from "../src/lib/billing/invoice-generator.ts";

const runId = "11111111-1111-4111-8111-111111111111";
const contractId = "22222222-2222-4222-8222-222222222222";
const customerId = "33333333-3333-4333-8333-333333333333";
const siteId = "44444444-4444-4444-8444-444444444444";

function dueContract(
  overrides: Partial<DueInvoiceContract> = {},
): DueInvoiceContract {
  return {
    id: contractId,
    customerId,
    siteId,
    status: "ACTIVE",
    cycle: "MONTHLY",
    startDate: "2026-01-31",
    endDate: null,
    billingAnchorDay: 31,
    nextInvoiceDate: "2026-01-31",
    dueDays: 7,
    items: [
      {
        productCode: "MAINTENANCE",
        productName: "월 유지관리",
        description: "기본 유지관리",
        quantity: 2,
        unitSupplyAmount: 100_000,
        supplyAmount: 200_000,
        vatAmount: 20_000,
        totalAmount: 220_000,
        sortOrder: 0,
      },
    ],
    ...overrides,
  };
}

function fakeRepository(
  contracts: DueInvoiceContract[],
  createDraft: (input: DraftInvoiceInput) => Promise<boolean>,
) {
  const completed: Array<{
    createdCount: number;
    failed: Array<{ contractId: string; code: string }>;
  }> = [];
  const repository: InvoiceGeneratorRepository = {
    async createRun(_runDate, targetCount) {
      assert.ok(targetCount >= 0);
      return runId;
    },
    async listDueContracts(_runDate, onlyContractId) {
      return onlyContractId
        ? contracts.filter((contract) => contract.id === onlyContractId)
        : contracts;
    },
    createDraft,
    async finishRun(_runId, result) {
      completed.push(result);
    },
    async getRunDate() {
      return "2026-01-31";
    },
    async finishRetry() {},
  };
  return { repository, completed };
}

test("generation keys are deterministic without customer data", () => {
  const first = generationKey(
    contractId,
    "2026-01-31",
    "2026-02-27",
  );
  assert.equal(first, generationKey(contractId, "2026-01-31", "2026-02-27"));
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(first, /KPOPSOFT|customer|33333333/);
});

test("monthly generation corrects month end and snapshots exact items", async () => {
  const drafts: DraftInvoiceInput[] = [];
  const { repository, completed } = fakeRepository(
    [dueContract()],
    async (input) => {
      drafts.push(input);
      return true;
    },
  );
  const generator = createInvoiceGenerator(repository, {
    invoiceSuffix: () => "0123456789",
  });
  const result = await generator.generateDueInvoices("2026-01-31");

  assert.deepEqual(result, {
    runId,
    targetCount: 1,
    createdCount: 1,
    failed: [],
  });
  assert.equal(drafts[0]?.periodStart, "2026-01-31");
  assert.equal(drafts[0]?.periodEnd, "2026-02-27");
  assert.equal(drafts[0]?.nextInvoiceDate, "2026-02-28");
  assert.equal(drafts[0]?.dueDate, "2026-02-07");
  assert.equal(drafts[0]?.number, "KPB-202601-0123456789");
  assert.deepEqual(drafts[0]?.items, dueContract().items);
  assert.deepEqual(completed, [{ createdCount: 1, failed: [] }]);
});

test("annual and one-time periods stop at the contract boundary", async () => {
  const drafts: DraftInvoiceInput[] = [];
  const annual = dueContract({
    id: "55555555-5555-4555-8555-555555555555",
    cycle: "ANNUAL",
    startDate: "2028-02-29",
    nextInvoiceDate: "2028-02-29",
    endDate: "2029-02-28",
    billingAnchorDay: 29,
  });
  const oneTime = dueContract({
    id: "66666666-6666-4666-8666-666666666666",
    cycle: "ONE_TIME",
    startDate: "2026-03-01",
    nextInvoiceDate: "2026-03-15",
    endDate: "2026-03-31",
  });
  const { repository } = fakeRepository([annual, oneTime], async (input) => {
    drafts.push(input);
    return true;
  });

  await createInvoiceGenerator(repository, {
    invoiceSuffix: () => "ABCDEFGHJK",
  }).generateDueInvoices("2028-02-29");

  assert.deepEqual(
    drafts.map(({ contractId: id, periodStart, periodEnd, nextInvoiceDate }) => ({
      id,
      periodStart,
      periodEnd,
      nextInvoiceDate,
    })),
    [
      {
        id: annual.id,
        periodStart: "2028-02-29",
        periodEnd: "2029-02-28",
        nextInvoiceDate: null,
      },
      {
        id: oneTime.id,
        periodStart: "2026-03-01",
        periodEnd: "2026-03-31",
        nextInvoiceDate: null,
      },
    ],
  );
});

test("manual, suspended, ended, and out-of-bound contracts are skipped", async () => {
  let callCount = 0;
  const { repository } = fakeRepository(
    [
      dueContract({ cycle: "MANUAL" }),
      dueContract({ status: "SUSPENDED" }),
      dueContract({ status: "ENDED" }),
      dueContract({ endDate: "2026-01-30" }),
      dueContract({ nextInvoiceDate: "2026-02-01" }),
    ],
    async () => {
      callCount += 1;
      return true;
    },
  );
  const result = await createInvoiceGenerator(repository).generateDueInvoices(
    "2026-01-31",
  );

  assert.equal(result.targetCount, 0);
  assert.equal(callCount, 0);
});

test("a duplicate generation key is successful without counting a new draft", async () => {
  const { repository, completed } = fakeRepository(
    [dueContract()],
    async () => false,
  );
  const result = await createInvoiceGenerator(repository).generateDueInvoices(
    "2026-01-31",
  );

  assert.equal(result.targetCount, 1);
  assert.equal(result.createdCount, 0);
  assert.deepEqual(result.failed, []);
  assert.deepEqual(completed, [{ createdCount: 0, failed: [] }]);
});

test("one contract failure is sanitized and does not block the next", async () => {
  const failedId = contractId;
  const succeedingId = "77777777-7777-4777-8777-777777777777";
  const calls: string[] = [];
  const { repository } = fakeRepository(
    [dueContract(), dueContract({ id: succeedingId })],
    async (input) => {
      calls.push(input.contractId);
      if (input.contractId === failedId) {
        throw new Error("password=secret database timeout");
      }
      return true;
    },
  );
  const result = await createInvoiceGenerator(repository).generateDueInvoices(
    "2026-01-31",
  );

  assert.deepEqual(calls, [failedId, succeedingId]);
  assert.equal(result.createdCount, 1);
  assert.deepEqual(result.failed, [
    { contractId: failedId, code: "GENERATION_FAILED" },
  ]);
  assert.doesNotMatch(JSON.stringify(result), /password|secret|timeout/);
});

test("the SQL advances next date only from an inserted draft", () => {
  const source = readFileSync(
    join(process.cwd(), "src/lib/billing/invoice-generator.ts"),
    "utf8",
  );
  assert.match(source, /on conflict \(generation_key\) do nothing/);
  assert.match(source, /update \$\{billingContracts\}[\s\S]+from inserted_invoice/);
  assert.match(source, /insert into \$\{billingInvoiceItems\}/);
  assert.match(source, /for update/);
});
