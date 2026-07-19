import { createHash, randomBytes } from "node:crypto";

import {
  and,
  asc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";

import {
  billingContractItems,
  billingContracts,
  billingCustomers,
  billingInvoiceItems,
  billingInvoices,
  billingProducts,
  billingRuns,
  billingSites,
} from "../db/schema.ts";
import { calculateInvoiceTotals } from "./money.ts";
import { nextInvoiceDate as calculateNextInvoiceDate } from "./dates.ts";
import type { BillingCycle, ContractStatus } from "./types.ts";

const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export type DueInvoiceItem = {
  productCode: string;
  productName: string;
  description: string;
  quantity: number;
  unitSupplyAmount: number;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  sortOrder: number;
};

export type DueInvoiceContract = {
  id: string;
  customerId: string;
  siteId: string;
  status: ContractStatus;
  cycle: BillingCycle;
  startDate: string;
  endDate: string | null;
  billingAnchorDay: number;
  nextInvoiceDate: string | null;
  dueDays: number;
  items: DueInvoiceItem[];
};

export type DraftInvoiceInput = {
  number: string;
  contractId: string;
  customerId: string;
  siteId: string;
  generationKey: string;
  expectedNextInvoiceDate: string;
  nextInvoiceDate: string | null;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate: string;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  items: DueInvoiceItem[];
};

export type GenerateDueInvoicesResult = {
  runId: string;
  targetCount: number;
  createdCount: number;
  failed: Array<{ contractId: string; code: string }>;
};

export type InvoiceGeneratorRepository = {
  createRun(runDate: string, targetCount: number): Promise<string>;
  listDueContracts(
    runDate: string,
    onlyContractId?: string,
  ): Promise<DueInvoiceContract[]>;
  createDraft(input: DraftInvoiceInput): Promise<boolean>;
  finishRun(
    runId: string,
    result: Pick<GenerateDueInvoicesResult, "createdCount" | "failed">,
  ): Promise<void>;
  getRunDate(runId: string): Promise<string | null>;
  finishRetry(
    runId: string,
    contractId: string,
    created: boolean,
    errorCode: string | null,
  ): Promise<void>;
};

export type InvoiceGeneratorOptions = {
  invoiceSuffix?: () => string;
};

function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("invalid calendar date");
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("invalid calendar date");
  }
  return date;
}

function validateContractId(value: string): void {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new Error("invalid contract id");
  }
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  if (!Number.isSafeInteger(days)) throw new Error("invalid day offset");
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

function randomInvoiceSuffix(): string {
  return [...randomBytes(10)]
    .map((byte) => CROCKFORD_ALPHABET[byte % CROCKFORD_ALPHABET.length])
    .join("");
}

function invoiceNumber(issueDate: string, suffix: string): string {
  const month = issueDate.slice(0, 7).replace("-", "");
  if (!/^[0-9A-HJKMNP-TV-Z]{10}$/.test(suffix)) {
    throw new Error("invalid invoice suffix");
  }
  return `KPB-${month}-${suffix}`;
}

export function generationKey(
  contractId: string,
  periodStart: string,
  periodEnd: string,
): string {
  return createHash("sha256")
    .update(`${contractId}:${periodStart}:${periodEnd}`)
    .digest("hex");
}

function isEligible(contract: DueInvoiceContract, runDate: string): boolean {
  return (
    contract.status === "ACTIVE" &&
    contract.cycle !== "MANUAL" &&
    Boolean(contract.nextInvoiceDate) &&
    (contract.nextInvoiceDate as string) <= runDate &&
    (!contract.endDate ||
      (contract.nextInvoiceDate as string) <= contract.endDate)
  );
}

function recurringPeriod(contract: DueInvoiceContract): {
  periodStart: string;
  periodEnd: string;
  nextInvoiceDate: string | null;
} {
  const periodStart = contract.nextInvoiceDate as string;
  const calculatedNext = calculateNextInvoiceDate({
    cycle: contract.cycle,
    current: periodStart,
    billingAnchorDay: contract.billingAnchorDay,
    endDate: null,
  });
  if (!calculatedNext) {
    throw new Error("missing recurring invoice date");
  }

  if (contract.endDate && calculatedNext >= contract.endDate) {
    return {
      periodStart,
      periodEnd: contract.endDate,
      nextInvoiceDate: null,
    };
  }
  return {
    periodStart,
    periodEnd: addDays(calculatedNext, -1),
    nextInvoiceDate: calculatedNext,
  };
}

function oneTimePeriod(contract: DueInvoiceContract): {
  periodStart: string;
  periodEnd: string;
  nextInvoiceDate: null;
} {
  return {
    periodStart: contract.startDate,
    periodEnd: contract.endDate ?? contract.startDate,
    nextInvoiceDate: null,
  };
}

function prepareDraft(
  contract: DueInvoiceContract,
  runDate: string,
  suffix: string,
): DraftInvoiceInput {
  if (!contract.nextInvoiceDate || contract.items.length === 0) {
    throw new Error("contract is not invoice-ready");
  }

  const period =
    contract.cycle === "ONE_TIME"
      ? oneTimePeriod(contract)
      : recurringPeriod(contract);
  const items = contract.items.map((item) => {
    const totals = calculateInvoiceTotals([item]);
    return { ...item, ...totals };
  });
  const totals = calculateInvoiceTotals(items);

  return {
    number: invoiceNumber(runDate, suffix),
    contractId: contract.id,
    customerId: contract.customerId,
    siteId: contract.siteId,
    generationKey: generationKey(
      contract.id,
      period.periodStart,
      period.periodEnd,
    ),
    expectedNextInvoiceDate: contract.nextInvoiceDate,
    nextInvoiceDate: period.nextInvoiceDate,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    issueDate: runDate,
    dueDate: addDays(runDate, contract.dueDays),
    ...totals,
    items,
  };
}

export function createInvoiceGenerator(
  repository: InvoiceGeneratorRepository,
  options: InvoiceGeneratorOptions = {},
) {
  const makeSuffix = options.invoiceSuffix ?? randomInvoiceSuffix;

  async function processContract(
    contract: DueInvoiceContract,
    runDate: string,
  ): Promise<boolean> {
    return repository.createDraft(
      prepareDraft(contract, runDate, makeSuffix()),
    );
  }

  async function generateContracts(
    runDate: string,
    contracts: DueInvoiceContract[],
  ): Promise<GenerateDueInvoicesResult> {
    const runId = await repository.createRun(runDate, contracts.length);
    const failed: GenerateDueInvoicesResult["failed"] = [];
    let createdCount = 0;

    for (const contract of contracts) {
      try {
        if (await processContract(contract, runDate)) createdCount += 1;
      } catch {
        failed.push({
          contractId: contract.id,
          code: "GENERATION_FAILED",
        });
      }
    }

    await repository.finishRun(runId, { createdCount, failed });
    return { runId, targetCount: contracts.length, createdCount, failed };
  }

  return {
    async generateDueInvoices(
      runDate: string,
    ): Promise<GenerateDueInvoicesResult> {
      parseDate(runDate);
      const due = (await repository.listDueContracts(runDate)).filter(
        (contract) => isEligible(contract, runDate),
      );
      return generateContracts(runDate, due);
    },

    async generateDueInvoiceForContract(
      runDate: string,
      contractId: string,
    ): Promise<GenerateDueInvoicesResult> {
      parseDate(runDate);
      validateContractId(contractId);
      const due = (await repository.listDueContracts(runDate, contractId))
        .filter(
          (contract) =>
            contract.id === contractId && isEligible(contract, runDate),
        )
        .slice(0, 1);
      return generateContracts(runDate, due);
    },

    async retryFailedContract(
      runId: string,
      contractId: string,
    ): Promise<void> {
      const runDate = await repository.getRunDate(runId);
      if (!runDate) throw new Error("청구 실행 기록을 찾을 수 없습니다.");
      const [contract] = (
        await repository.listDueContracts(runDate, contractId)
      ).filter((candidate) => isEligible(candidate, runDate));
      if (!contract) throw new Error("재시도할 계약을 찾을 수 없습니다.");

      try {
        const created = await processContract(contract, runDate);
        await repository.finishRetry(runId, contractId, created, null);
      } catch {
        await repository.finishRetry(
          runId,
          contractId,
          false,
          "GENERATION_FAILED",
        );
        throw new Error("계약 청구서 재생성에 실패했습니다.");
      }
    },
  };
}

async function database() {
  const { getDb } = await import("../db");
  return getDb();
}

const neonInvoiceGeneratorRepository: InvoiceGeneratorRepository = {
  async createRun(runDate, targetCount) {
    const [run] = await (await database())
      .insert(billingRuns)
      .values({ runDate, targetCount })
      .returning({ id: billingRuns.id });
    if (!run) throw new Error("청구 실행 기록을 만들지 못했습니다.");
    return run.id;
  },

  async listDueContracts(runDate, onlyContractId) {
    const db = await database();
    const conditions = [
      eq(billingContracts.status, "ACTIVE"),
      ne(billingContracts.cycle, "MANUAL"),
      lte(billingContracts.nextInvoiceDate, runDate),
      or(
        isNull(billingContracts.endDate),
        gte(billingContracts.endDate, billingContracts.nextInvoiceDate),
      ),
      eq(billingCustomers.status, "ACTIVE"),
      eq(billingSites.status, "ACTIVE"),
      onlyContractId ? eq(billingContracts.id, onlyContractId) : undefined,
    ].filter((condition) => condition !== undefined);
    const contracts = await db
      .select({
        id: billingContracts.id,
        customerId: billingContracts.customerId,
        siteId: billingContracts.siteId,
        status: billingContracts.status,
        cycle: billingContracts.cycle,
        startDate: billingContracts.startDate,
        endDate: billingContracts.endDate,
        billingAnchorDay: billingContracts.billingAnchorDay,
        nextInvoiceDate: billingContracts.nextInvoiceDate,
        dueDays: billingContracts.dueDays,
      })
      .from(billingContracts)
      .innerJoin(
        billingCustomers,
        eq(billingCustomers.id, billingContracts.customerId),
      )
      .innerJoin(billingSites, eq(billingSites.id, billingContracts.siteId))
      .where(and(...conditions))
      .orderBy(asc(billingContracts.id));
    if (contracts.length === 0) return [];

    const items = await db
      .select({
        contractId: billingContractItems.contractId,
        productCode: billingProducts.code,
        productName: billingProducts.name,
        description: billingContractItems.description,
        quantity: billingContractItems.quantity,
        unitSupplyAmount: billingContractItems.unitSupplyAmount,
        supplyAmount: billingContractItems.supplyAmount,
        vatAmount: billingContractItems.vatAmount,
        totalAmount: billingContractItems.totalAmount,
        sortOrder: billingContractItems.sortOrder,
      })
      .from(billingContractItems)
      .innerJoin(
        billingProducts,
        eq(billingProducts.id, billingContractItems.productId),
      )
      .where(
        inArray(
          billingContractItems.contractId,
          contracts.map((contract) => contract.id),
        ),
      )
      .orderBy(
        asc(billingContractItems.contractId),
        asc(billingContractItems.sortOrder),
      );
    const itemsByContract = new Map<string, DueInvoiceItem[]>();
    for (const { contractId, ...item } of items) {
      const current = itemsByContract.get(contractId) ?? [];
      current.push(item);
      itemsByContract.set(contractId, current);
    }
    return contracts.map((contract) => ({
      ...contract,
      items: itemsByContract.get(contract.id) ?? [],
    }));
  },

  async createDraft(input) {
    const itemsJson = JSON.stringify(
      input.items.map((item) => ({
        product_code: item.productCode,
        product_name: item.productName,
        description: item.description,
        quantity: item.quantity,
        unit_supply_amount: item.unitSupplyAmount,
        supply_amount: item.supplyAmount,
        vat_amount: item.vatAmount,
        total_amount: item.totalAmount,
        sort_order: item.sortOrder,
      })),
    );
    const result = await (await database()).execute(sql`
      with locked_contract as (
        select id, customer_id, site_id
        from ${billingContracts}
        where id = ${input.contractId}::uuid
          and status = 'ACTIVE'
          and next_invoice_date = ${input.expectedNextInvoiceDate}::date
        for update
      ),
      inserted_invoice as (
        insert into ${billingInvoices}
          (number, customer_id, site_id, contract_id, generation_key,
           period_start, period_end, issue_date, due_date, currency,
           supply_amount, vat_amount, total_amount, status)
        select ${input.number}, locked_contract.customer_id,
               locked_contract.site_id, locked_contract.id,
               ${input.generationKey}, ${input.periodStart}::date,
               ${input.periodEnd}::date, ${input.issueDate}::date,
               ${input.dueDate}::date, 'KRW', ${input.supplyAmount},
               ${input.vatAmount}, ${input.totalAmount}, 'DRAFT'
        from locked_contract
        where locked_contract.customer_id = ${input.customerId}::uuid
          and locked_contract.site_id = ${input.siteId}::uuid
        on conflict (generation_key) do nothing
        returning id, contract_id
      ),
      inserted_items as (
        insert into ${billingInvoiceItems}
          (invoice_id, product_code, product_name, description, quantity,
           unit_supply_amount, supply_amount, vat_amount, total_amount,
           sort_order)
        select inserted_invoice.id, item.product_code, item.product_name,
               item.description, item.quantity, item.unit_supply_amount,
               item.supply_amount, item.vat_amount, item.total_amount,
               item.sort_order
        from inserted_invoice
        cross join jsonb_to_recordset(${itemsJson}::jsonb) as item(
          product_code text,
          product_name text,
          description text,
          quantity integer,
          unit_supply_amount integer,
          supply_amount integer,
          vat_amount integer,
          total_amount integer,
          sort_order integer
        )
      ),
      advanced_contract as (
        update ${billingContracts}
        set next_invoice_date = ${input.nextInvoiceDate}::date,
            updated_at = now()
        from inserted_invoice
        where ${billingContracts.id} = inserted_invoice.contract_id
        returning ${billingContracts.id}
      )
      select id from inserted_invoice
    `);
    return Boolean(result.rows[0]);
  },

  async finishRun(runId, result) {
    await (await database())
      .update(billingRuns)
      .set({
        finishedAt: new Date(),
        createdCount: result.createdCount,
        failedCount: result.failed.length,
        errorSummary: result.failed,
        updatedAt: new Date(),
      })
      .where(eq(billingRuns.id, runId));
  },

  async getRunDate(runId) {
    const [run] = await (await database())
      .select({ runDate: billingRuns.runDate })
      .from(billingRuns)
      .where(eq(billingRuns.id, runId))
      .limit(1);
    return run?.runDate ?? null;
  },

  async finishRetry(runId, contractId, created, errorCode) {
    if (errorCode) return;
    await (await database()).execute(sql`
      with current as (
        select id, target_count, created_count, failed_count,
               exists (
                 select 1
                 from jsonb_array_elements(error_summary) entry
                 where entry->>'contractId' = ${contractId}
               ) as had_failure
        from ${billingRuns}
        where id = ${runId}::uuid
        for update
      )
      update ${billingRuns}
      set created_count = least(
            current.target_count,
            current.created_count +
              case when current.had_failure and ${created} then 1 else 0 end
          ),
          failed_count = greatest(
            0,
            current.failed_count - case when current.had_failure then 1 else 0 end
          ),
          error_summary = coalesce(
            (
              select jsonb_agg(entry)
              from jsonb_array_elements(${billingRuns.errorSummary}) entry
              where entry->>'contractId' <> ${contractId}
            ),
            '[]'::jsonb
          ),
          updated_at = now()
      from current
      where ${billingRuns.id} = current.id
    `);
  },
};

const defaultInvoiceGenerator = createInvoiceGenerator(
  neonInvoiceGeneratorRepository,
);

export async function generateDueInvoices(
  runDate: string,
): Promise<GenerateDueInvoicesResult> {
  return defaultInvoiceGenerator.generateDueInvoices(runDate);
}

export async function generateDueInvoiceForContract(
  runDate: string,
  contractId: string,
): Promise<GenerateDueInvoicesResult> {
  return defaultInvoiceGenerator.generateDueInvoiceForContract(runDate, contractId);
}

export async function retryFailedContract(
  runId: string,
  contractId: string,
): Promise<void> {
  return defaultInvoiceGenerator.retryFailedContract(runId, contractId);
}
