import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";

import { getDb } from "../db";
import {
  billingContractItems,
  billingContracts,
  billingCustomerContacts,
  billingCustomers,
  billingInvoiceDeliveries,
  billingInvoiceItems,
  billingInvoices,
  billingBankReceipts,
  billingPayments,
  billingProducts,
  billingRuns,
  billingSites,
} from "../db/schema";
import type { ContractStatus, InvoiceStatus } from "./types";

export async function getBillingDashboard() {
  const db = getDb();
  const [invoiceCounts, deliveryCounts, runCounts] = await Promise.all([
    db
      .select({
        draft: sql<number>`count(*) filter (where ${billingInvoices.status} = 'DRAFT')::int`,
        overdue: sql<number>`count(*) filter (where ${billingInvoices.status} = 'OVERDUE')::int`,
        open: sql<number>`count(*) filter (where ${billingInvoices.status} = 'OPEN')::int`,
      })
      .from(billingInvoices),
    db
      .select({
        failed: sql<number>`count(*) filter (where ${billingInvoiceDeliveries.status} = 'FAILED')::int`,
        pending: sql<number>`count(*) filter (where ${billingInvoiceDeliveries.status} = 'PENDING')::int`,
      })
      .from(billingInvoiceDeliveries),
    db
      .select({
        failed: sql<number>`coalesce(sum(${billingRuns.failedCount}), 0)::int`,
      })
      .from(billingRuns)
      .where(sql`${billingRuns.startedAt} >= now() - interval '30 days'`),
  ]);
  return {
    draftInvoices: invoiceCounts[0]?.draft ?? 0,
    openInvoices: invoiceCounts[0]?.open ?? 0,
    overdueInvoices: invoiceCounts[0]?.overdue ?? 0,
    failedDeliveries: deliveryCounts[0]?.failed ?? 0,
    pendingDeliveries: deliveryCounts[0]?.pending ?? 0,
    generatorFailures30d: runCounts[0]?.failed ?? 0,
  };
}

export async function listBillingCustomersForAdmin(filter: {
  query?: string;
  status?: "ACTIVE" | "INACTIVE";
}) {
  const query = filter.query?.trim().slice(0, 100);
  const conditions = [
    filter.status ? eq(billingCustomers.status, filter.status) : undefined,
    query
      ? or(
          ilike(billingCustomers.code, `%${query}%`),
          ilike(billingCustomers.name, `%${query}%`),
        )
      : undefined,
  ].filter((condition) => condition !== undefined);
  return getDb()
    .select({
      id: billingCustomers.id,
      code: billingCustomers.code,
      name: billingCustomers.name,
      status: billingCustomers.status,
      siteCount: sql<number>`count(distinct ${billingSites.id})::int`,
      contactCount: sql<number>`count(distinct ${billingCustomerContacts.id})::int`,
    })
    .from(billingCustomers)
    .leftJoin(
      billingSites,
      eq(billingSites.customerId, billingCustomers.id),
    )
    .leftJoin(
      billingCustomerContacts,
      eq(billingCustomerContacts.customerId, billingCustomers.id),
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(billingCustomers.id)
    .orderBy(asc(billingCustomers.code));
}

export async function getBillingCustomerForAdmin(id: string) {
  const db = getDb();
  const [customer] = await db
    .select()
    .from(billingCustomers)
    .where(eq(billingCustomers.id, id))
    .limit(1);
  if (!customer) return null;
  const [sites, contacts, contracts] = await Promise.all([
    db
      .select()
      .from(billingSites)
      .where(eq(billingSites.customerId, id))
      .orderBy(asc(billingSites.code)),
    db
      .select()
      .from(billingCustomerContacts)
      .where(eq(billingCustomerContacts.customerId, id))
      .orderBy(asc(billingCustomerContacts.email)),
    db
      .select({
        id: billingContracts.id,
        siteName: billingSites.name,
        status: billingContracts.status,
        cycle: billingContracts.cycle,
        nextInvoiceDate: billingContracts.nextInvoiceDate,
      })
      .from(billingContracts)
      .innerJoin(billingSites, eq(billingSites.id, billingContracts.siteId))
      .where(eq(billingContracts.customerId, id))
      .orderBy(desc(billingContracts.createdAt)),
  ]);
  return { ...customer, sites, contacts, contracts };
}

export async function listBillingContractsForAdmin(filter: {
  query?: string;
  status?: ContractStatus;
  customerId?: string;
}) {
  const query = filter.query?.trim().slice(0, 100);
  const conditions = [
    filter.status ? eq(billingContracts.status, filter.status) : undefined,
    filter.customerId
      ? eq(billingContracts.customerId, filter.customerId)
      : undefined,
    query
      ? or(
          ilike(billingCustomers.code, `%${query}%`),
          ilike(billingCustomers.name, `%${query}%`),
          ilike(billingSites.name, `%${query}%`),
        )
      : undefined,
  ].filter((condition) => condition !== undefined);
  return getDb()
    .select({
      id: billingContracts.id,
      customerId: billingContracts.customerId,
      customerCode: billingCustomers.code,
      customerName: billingCustomers.name,
      siteName: billingSites.name,
      status: billingContracts.status,
      cycle: billingContracts.cycle,
      startDate: billingContracts.startDate,
      endDate: billingContracts.endDate,
      nextInvoiceDate: billingContracts.nextInvoiceDate,
      totalAmount: sql<number>`coalesce(sum(${billingContractItems.totalAmount}), 0)::int`,
    })
    .from(billingContracts)
    .innerJoin(
      billingCustomers,
      eq(billingCustomers.id, billingContracts.customerId),
    )
    .innerJoin(billingSites, eq(billingSites.id, billingContracts.siteId))
    .leftJoin(
      billingContractItems,
      eq(billingContractItems.contractId, billingContracts.id),
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(billingContracts.id, billingCustomers.id, billingSites.id)
    .orderBy(desc(billingContracts.updatedAt));
}

export async function getContractFormOptions() {
  const db = getDb();
  const [customers, sites, products] = await Promise.all([
    db
      .select({
        id: billingCustomers.id,
        code: billingCustomers.code,
        name: billingCustomers.name,
      })
      .from(billingCustomers)
      .where(eq(billingCustomers.status, "ACTIVE"))
      .orderBy(asc(billingCustomers.code)),
    db
      .select({
        id: billingSites.id,
        customerId: billingSites.customerId,
        code: billingSites.code,
        name: billingSites.name,
      })
      .from(billingSites)
      .where(eq(billingSites.status, "ACTIVE"))
      .orderBy(asc(billingSites.code)),
    db
      .select({
        id: billingProducts.id,
        code: billingProducts.code,
        name: billingProducts.name,
      })
      .from(billingProducts)
      .where(eq(billingProducts.status, "ACTIVE"))
      .orderBy(asc(billingProducts.code)),
  ]);
  return { customers, sites, products };
}

export async function getBillingContractForAdmin(id: string) {
  const db = getDb();
  const [contract] = await db
    .select({
      id: billingContracts.id,
      customerId: billingContracts.customerId,
      customerName: billingCustomers.name,
      siteId: billingContracts.siteId,
      siteName: billingSites.name,
      status: billingContracts.status,
      cycle: billingContracts.cycle,
      startDate: billingContracts.startDate,
      endDate: billingContracts.endDate,
      billingAnchorDay: billingContracts.billingAnchorDay,
      nextInvoiceDate: billingContracts.nextInvoiceDate,
      dueDays: billingContracts.dueDays,
      autoRenew: billingContracts.autoRenew,
    })
    .from(billingContracts)
    .innerJoin(
      billingCustomers,
      eq(billingCustomers.id, billingContracts.customerId),
    )
    .innerJoin(billingSites, eq(billingSites.id, billingContracts.siteId))
    .where(eq(billingContracts.id, id))
    .limit(1);
  if (!contract) return null;
  const items = await db
    .select({
      productId: billingContractItems.productId,
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
    .where(eq(billingContractItems.contractId, id))
    .orderBy(asc(billingContractItems.sortOrder));
  return { ...contract, items };
}

export async function listBillingInvoicesForAdmin(filter: {
  query?: string;
  status?: InvoiceStatus;
}) {
  const query = filter.query?.trim().slice(0, 100);
  const conditions = [
    filter.status ? eq(billingInvoices.status, filter.status) : undefined,
    query
      ? or(
          ilike(billingInvoices.number, `%${query}%`),
          ilike(billingCustomers.code, `%${query}%`),
          ilike(billingCustomers.name, `%${query}%`),
        )
      : undefined,
  ].filter((condition) => condition !== undefined);
  return getDb()
    .select({
      id: billingInvoices.id,
      number: billingInvoices.number,
      customerCode: billingCustomers.code,
      customerName: billingCustomers.name,
      siteName: billingSites.name,
      status: billingInvoices.status,
      periodStart: billingInvoices.periodStart,
      periodEnd: billingInvoices.periodEnd,
      dueDate: billingInvoices.dueDate,
      totalAmount: billingInvoices.totalAmount,
      approvedAt: billingInvoices.approvedAt,
    })
    .from(billingInvoices)
    .innerJoin(
      billingCustomers,
      eq(billingCustomers.id, billingInvoices.customerId),
    )
    .innerJoin(billingSites, eq(billingSites.id, billingInvoices.siteId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(billingInvoices.createdAt));
}

export async function getBillingInvoiceForAdmin(id: string) {
  const db = getDb();
  const [invoice] = await db
    .select({
      id: billingInvoices.id,
      number: billingInvoices.number,
      customerName: billingCustomers.name,
      siteName: billingSites.name,
      contractId: billingInvoices.contractId,
      status: billingInvoices.status,
      periodStart: billingInvoices.periodStart,
      periodEnd: billingInvoices.periodEnd,
      issueDate: billingInvoices.issueDate,
      dueDate: billingInvoices.dueDate,
      supplyAmount: billingInvoices.supplyAmount,
      vatAmount: billingInvoices.vatAmount,
      totalAmount: billingInvoices.totalAmount,
      approvedAt: billingInvoices.approvedAt,
      voidedAt: billingInvoices.voidedAt,
      voidReason: billingInvoices.voidReason,
    })
    .from(billingInvoices)
    .innerJoin(
      billingCustomers,
      eq(billingCustomers.id, billingInvoices.customerId),
    )
    .innerJoin(billingSites, eq(billingSites.id, billingInvoices.siteId))
    .where(eq(billingInvoices.id, id))
    .limit(1);
  if (!invoice) return null;
  const [items, deliveries, payments] = await Promise.all([
    db
      .select()
      .from(billingInvoiceItems)
      .where(eq(billingInvoiceItems.invoiceId, id))
      .orderBy(asc(billingInvoiceItems.sortOrder)),
    db
      .select()
      .from(billingInvoiceDeliveries)
      .where(eq(billingInvoiceDeliveries.invoiceId, id))
      .orderBy(desc(billingInvoiceDeliveries.updatedAt)),
    db
      .select({
        id: billingPayments.id,
        method: billingPayments.method,
        amount: billingPayments.amount,
        approvedAt: billingPayments.approvedAt,
        refundedAmount: billingPayments.refundedAmount,
        depositorName: billingBankReceipts.depositorName,
        depositedOn: billingBankReceipts.depositedOn,
        evidenceNote: billingBankReceipts.evidenceNote,
      })
      .from(billingPayments)
      .leftJoin(
        billingBankReceipts,
        eq(billingBankReceipts.paymentId, billingPayments.id),
      )
      .where(eq(billingPayments.invoiceId, id))
      .orderBy(desc(billingPayments.approvedAt)),
  ]);
  return { ...invoice, items, deliveries, payments };
}

export function isContractStatus(value: string | undefined): value is ContractStatus {
  return Boolean(
    value &&
      ["DRAFT", "ACTIVE", "SUSPENDED", "ENDED", "CANCELED"].includes(
        value,
      ),
  );
}

export function isInvoiceStatus(value: string | undefined): value is InvoiceStatus {
  return Boolean(
    value &&
      [
        "DRAFT",
        "OPEN",
        "PAID",
        "OVERDUE",
        "PARTIALLY_REFUNDED",
        "REFUNDED",
        "VOID",
      ].includes(value),
  );
}
