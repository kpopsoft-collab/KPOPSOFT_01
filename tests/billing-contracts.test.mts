import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  contractInputSchema,
  createBillingContractCommands,
  customerWithSiteInputSchema,
  prepareContractInput,
  type BillingContractRepository,
  type ContractInput,
  type PreparedContractInput,
  type PreparedCustomerWithSiteInput,
} from "../src/lib/billing/contracts.ts";

const customerId = "11111111-1111-4111-8111-111111111111";
const siteId = "22222222-2222-4222-8222-222222222222";
const productId = "33333333-3333-4333-8333-333333333333";
const actorId = "44444444-4444-4444-8444-444444444444";
const readSource = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), "utf8");

function validContract(
  overrides: Partial<ContractInput> = {},
): ContractInput {
  return {
    customerId,
    siteId,
    status: "ACTIVE",
    cycle: "MONTHLY",
    startDate: "2026-07-01",
    endDate: null,
    billingAnchorDay: 15,
    nextInvoiceDate: "2026-07-15",
    dueDays: 7,
    autoRenew: true,
    items: [
      {
        productId,
        description: " 월 유지관리 ",
        quantity: 2,
        unitSupplyAmount: 100_000,
        vatAmount: 20_000,
      },
    ],
    ...overrides,
  };
}

test("customer and site values are normalized before persistence", () => {
  const parsed = customerWithSiteInputSchema.parse({
    customer: {
      code: " acme_01 ",
      name: " 에이씨미 ",
      businessNumber: "123-45-67890",
      representativeName: " 홍길동 ",
      taxEmail: " TAX@EXAMPLE.COM ",
    },
    site: {
      code: " portal-01 ",
      name: " 고객 포털 ",
      primaryOrigin: "https://PORTAL.Example.com",
    },
    contact: {
      name: " 담당자 ",
      email: " OWNER@EXAMPLE.COM ",
      phone: " 010-1234-5678 ",
      receivesBilling: true,
    },
  });

  assert.equal(parsed.customer.code, "ACME_01");
  assert.equal(parsed.customer.name, "에이씨미");
  assert.equal(parsed.customer.taxEmail, "tax@example.com");
  assert.equal(parsed.site.code, "PORTAL-01");
  assert.equal(parsed.site.primaryOrigin, "https://portal.example.com");
  assert.equal(parsed.contact?.email, "owner@example.com");
  assert.equal(parsed.contact?.phone, "010-1234-5678");
});

test("customer validation requires Korean business-number and exact HTTPS origin formats", () => {
  const base = {
    customer: {
      code: "ACME",
      name: "에이씨미",
      businessNumber: "1234567890",
      representativeName: "대표",
      taxEmail: null,
    },
    site: {
      code: "ACME_SITE",
      name: "관리사이트",
      primaryOrigin: "https://portal.example.com",
    },
    contact: null,
  };

  assert.equal(customerWithSiteInputSchema.safeParse(base).success, false);
  assert.equal(
    customerWithSiteInputSchema.safeParse({
      ...base,
      customer: { ...base.customer, businessNumber: "123-45-67890" },
      site: { ...base.site, primaryOrigin: "http://portal.example.com" },
    }).success,
    false,
  );
  assert.equal(
    customerWithSiteInputSchema.safeParse({
      ...base,
      customer: { ...base.customer, businessNumber: "123-45-67890" },
      site: {
        ...base.site,
        primaryOrigin: "https://portal.example.com/path",
      },
    }).success,
    false,
  );
});

test("contract items are unique and totals are always recalculated", () => {
  assert.equal(
    contractInputSchema.safeParse({
      ...validContract(),
      items: [
        validContract().items[0],
        {
          productId,
          description: "duplicate",
          quantity: 1,
          unitSupplyAmount: 1,
          vatAmount: 0,
        },
      ],
    }).success,
    false,
  );

  const spoofedTotals = {
    ...validContract(),
    items: [
      {
        productId,
        description: "월 유지관리",
        quantity: 2,
        unitSupplyAmount: 100_000,
        vatAmount: 20_000,
        supplyAmount: 1,
        totalAmount: 1,
      },
    ],
  };
  const prepared = prepareContractInput(spoofedTotals);
  assert.deepEqual(prepared.items[0], {
    productId,
    description: "월 유지관리",
    quantity: 2,
    unitSupplyAmount: 100_000,
    supplyAmount: 200_000,
    vatAmount: 20_000,
    totalAmount: 220_000,
    sortOrder: 0,
  });
});

test("active contracts require an item and next invoice date", () => {
  assert.equal(
    contractInputSchema.safeParse(validContract({ items: [] })).success,
    false,
  );
  assert.equal(
    contractInputSchema.safeParse(validContract({ nextInvoiceDate: null }))
      .success,
    false,
  );
});

test("terminal contracts cannot retain a future invoice date", () => {
  for (const status of ["ENDED", "CANCELED"] as const) {
    assert.equal(
      contractInputSchema.safeParse(validContract({ status })).success,
      false,
      status,
    );
    assert.equal(
      contractInputSchema.safeParse(
        validContract({ status, nextInvoiceDate: null }),
      ).success,
      true,
      status,
    );
  }
});

test("commands pass only validated normalized snapshots to the repository", async () => {
  const savedCustomers: PreparedCustomerWithSiteInput[] = [];
  const savedContracts: PreparedContractInput[] = [];

  const repository: BillingContractRepository = {
    async createCustomerWithSite(_actorId, input) {
      savedCustomers.push(input);
      return customerId;
    },
    async saveContract(_actorId, input) {
      savedContracts.push(input);
      return "55555555-5555-4555-8555-555555555555";
    },
    async getContractState() {
      return { status: "ACTIVE", nextInvoiceDate: "2026-08-15" };
    },
    async changeContractStatus(_actorId, _id, _from, _to, nextInvoiceDate) {
      assert.equal(nextInvoiceDate, null);
      return true;
    },
  };
  const commands = createBillingContractCommands(repository);

  await commands.createCustomerWithSite(actorId, {
    customer: {
      code: " acme ",
      name: " Acme ",
      businessNumber: null,
      representativeName: "",
      taxEmail: null,
    },
    site: {
      code: " site_1 ",
      name: " Site ",
      primaryOrigin: "https://SITE.example.com",
    },
    contact: null,
  });
  await commands.saveContract(
    actorId,
    validContract({ status: "DRAFT" }),
  );
  await commands.changeContractStatus(
    actorId,
    "55555555-5555-4555-8555-555555555555",
    "ENDED",
  );

  assert.equal(savedCustomers[0]?.customer.code, "ACME");
  assert.equal(
    savedCustomers[0]?.site.primaryOrigin,
    "https://site.example.com",
  );
  assert.equal(savedContracts[0]?.items[0].totalAmount, 220_000);
});

test("new contracts stay draft until the explicit state command", async () => {
  let saveCount = 0;
  const repository: BillingContractRepository = {
    async createCustomerWithSite() {
      return customerId;
    },
    async saveContract() {
      saveCount += 1;
      return customerId;
    },
    async getContractState() {
      return null;
    },
    async changeContractStatus() {
      return false;
    },
  };
  const commands = createBillingContractCommands(repository);

  await assert.rejects(
    () => commands.saveContract(actorId, validContract()),
    /새 계약은 초안/,
  );
  assert.equal(saveCount, 0);
});

test("repository uses the approved atomic billing audit actions", () => {
  const source = readSource("src/lib/billing/repository.ts");
  for (const action of [
    "billing.customer.created",
    "billing.site.created",
    "billing.contract.created",
    "billing.contract.updated",
    "billing.contract.activated",
    "billing.contract.suspended",
    "billing.contract.ended",
    "billing.contract.canceled",
  ]) {
    assert.match(source, new RegExp(action.replaceAll(".", "\\.")), action);
  }
  assert.match(source, /db\.batch\(/);
  assert.match(source, /with updated as/);
  assert.match(source, /insert into \$\{auditLogs\}/);
});

test("commands reject impossible and missing contract state changes", async () => {
  const repository: BillingContractRepository = {
    async createCustomerWithSite() {
      return customerId;
    },
    async saveContract() {
      return customerId;
    },
    async getContractState(id) {
      return id === customerId
        ? { status: "CANCELED", nextInvoiceDate: null }
        : null;
    },
    async changeContractStatus() {
      return false;
    },
  };
  const commands = createBillingContractCommands(repository);

  await assert.rejects(
    () => commands.changeContractStatus(actorId, siteId, "ENDED"),
    /계약을 찾을 수 없습니다/,
  );
  await assert.rejects(
    () => commands.changeContractStatus(actorId, customerId, "ACTIVE"),
    /변경할 수 없는 계약 상태/,
  );
});
