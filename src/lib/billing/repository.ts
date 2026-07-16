import { randomUUID } from "node:crypto";

import { and, asc, eq, ilike, or, sql } from "drizzle-orm";

import { getDb } from "../db";
import {
  auditLogs,
  billingContractItems,
  billingContracts,
  billingCustomerContacts,
  billingCustomers,
  billingProducts,
  billingSites,
} from "../db/schema";
import type {
  BillingContractDetail,
  BillingContractRepository,
  BillingCustomerSummary,
  ContractState,
  CustomerFilter,
  PreparedContractInput,
  PreparedCustomerWithSiteInput,
} from "./contracts";
import type { ContractStatus } from "./types";

type RepositoryResultRow = { id: string };

function contractItemsJson(input: PreparedContractInput): string {
  return JSON.stringify(
    input.items.map((item) => ({
      product_id: item.productId,
      description: item.description,
      quantity: item.quantity,
      unit_supply_amount: item.unitSupplyAmount,
      supply_amount: item.supplyAmount,
      vat_amount: item.vatAmount,
      total_amount: item.totalAmount,
      sort_order: item.sortOrder,
    })),
  );
}

function contractAction(status: ContractStatus): string {
  const actions: Record<ContractStatus, string> = {
    DRAFT: "billing.contract.updated",
    ACTIVE: "billing.contract.activated",
    SUSPENDED: "billing.contract.suspended",
    ENDED: "billing.contract.ended",
    CANCELED: "billing.contract.canceled",
  };
  return actions[status];
}

async function createCustomerWithSite(
  actorId: string,
  input: PreparedCustomerWithSiteInput,
): Promise<string> {
  const db = getDb();
  const customerId = randomUUID();
  const siteId = randomUUID();
  const customerInsert = db.insert(billingCustomers).values({
    id: customerId,
    code: input.customer.code,
    name: input.customer.name,
    businessNumber: input.customer.businessNumber,
    representativeName: input.customer.representativeName,
    taxEmail: input.customer.taxEmail,
  });
  const siteInsert = db.insert(billingSites).values({
    id: siteId,
    customerId,
    code: input.site.code,
    name: input.site.name,
    primaryOrigin: input.site.primaryOrigin,
  });
  const customerAudit = db.insert(auditLogs).values({
    actorAdminId: actorId,
    action: "billing.customer.created",
    entityType: "billing_customer",
    entityId: customerId,
    metadata: { code: input.customer.code },
  });
  const siteAudit = db.insert(auditLogs).values({
    actorAdminId: actorId,
    action: "billing.site.created",
    entityType: "billing_site",
    entityId: siteId,
    metadata: { code: input.site.code, customerId },
  });

  try {
    if (input.contact) {
      await db.batch([
        customerInsert,
        siteInsert,
        db.insert(billingCustomerContacts).values({
          id: randomUUID(),
          customerId,
          name: input.contact.name,
          email: input.contact.email,
          phone: input.contact.phone,
          receivesBilling: input.contact.receivesBilling,
        }),
        customerAudit,
        siteAudit,
      ]);
    } else {
      await db.batch([customerInsert, siteInsert, customerAudit, siteAudit]);
    }
  } catch {
    throw new Error("고객사 코드, 사업자번호 또는 사이트 정보가 중복되었습니다.");
  }

  return customerId;
}

async function saveContract(
  actorId: string,
  input: PreparedContractInput,
): Promise<string> {
  const db = getDb();
  const id = input.id ?? randomUUID();
  const itemsJson = contractItemsJson(input);
  const action = input.id
    ? "billing.contract.updated"
    : "billing.contract.created";

  const inputItems = sql`
    select *
    from jsonb_to_recordset(${itemsJson}::jsonb) as item(
      product_id uuid,
      description text,
      quantity integer,
      unit_supply_amount integer,
      supply_amount integer,
      vat_amount integer,
      total_amount integer,
      sort_order integer
    )
  `;
  const validSite = sql`
    select ${billingSites.id}
    from ${billingSites}
    inner join ${billingCustomers}
      on ${billingCustomers.id} = ${billingSites.customerId}
    where ${billingSites.id} = ${input.siteId}::uuid
      and ${billingSites.customerId} = ${input.customerId}::uuid
      and ${billingSites.status} = 'ACTIVE'
      and ${billingCustomers.status} = 'ACTIVE'
  `;
  const validItems = sql`
    select item.*
    from input_items item
    inner join ${billingProducts}
      on ${billingProducts.id} = item.product_id
     and ${billingProducts.status} = 'ACTIVE'
  `;

  try {
    const statement = input.id
      ? sql`
          with input_items as (${inputItems}),
          valid_site as (${validSite}),
          valid_items as (${validItems}),
          updated as (
            update ${billingContracts}
            set customer_id = ${input.customerId}::uuid,
                site_id = ${input.siteId}::uuid,
                cycle = ${input.cycle},
                start_date = ${input.startDate}::date,
                end_date = ${input.endDate}::date,
                billing_anchor_day = ${input.billingAnchorDay},
                next_invoice_date = ${input.nextInvoiceDate}::date,
                due_days = ${input.dueDays},
                auto_renew = ${input.autoRenew},
                updated_at = now()
            where id = ${id}::uuid
              and status = ${input.status}
              and exists (select 1 from valid_site)
              and (select count(*) from input_items) =
                  (select count(*) from valid_items)
            returning id
          ),
          removed as (
            delete from ${billingContractItems}
            where contract_id in (select id from updated)
          ),
          inserted_items as (
            insert into ${billingContractItems}
              (contract_id, product_id, description, quantity,
               unit_supply_amount, supply_amount, vat_amount, total_amount,
               sort_order)
            select updated.id, item.product_id, item.description, item.quantity,
                   item.unit_supply_amount, item.supply_amount, item.vat_amount,
                   item.total_amount, item.sort_order
            from updated cross join valid_items item
          ),
          audited as (
            insert into ${auditLogs}
              (actor_admin_id, action, entity_type, entity_id, metadata)
            select ${actorId}::uuid, ${action}, 'billing_contract', id,
                   ${JSON.stringify({ status: input.status })}::jsonb
            from updated
          )
          select id from updated
        `
      : sql`
          with input_items as (${inputItems}),
          valid_site as (${validSite}),
          valid_items as (${validItems}),
          inserted as (
            insert into ${billingContracts}
              (id, customer_id, site_id, status, cycle, start_date, end_date,
               billing_anchor_day, next_invoice_date, due_days, auto_renew)
            select ${id}::uuid, ${input.customerId}::uuid,
                   ${input.siteId}::uuid, ${input.status}, ${input.cycle},
                   ${input.startDate}::date, ${input.endDate}::date,
                   ${input.billingAnchorDay}, ${input.nextInvoiceDate}::date,
                   ${input.dueDays}, ${input.autoRenew}
            where exists (select 1 from valid_site)
              and (select count(*) from input_items) =
                  (select count(*) from valid_items)
            returning id
          ),
          inserted_items as (
            insert into ${billingContractItems}
              (contract_id, product_id, description, quantity,
               unit_supply_amount, supply_amount, vat_amount, total_amount,
               sort_order)
            select inserted.id, item.product_id, item.description, item.quantity,
                   item.unit_supply_amount, item.supply_amount, item.vat_amount,
                   item.total_amount, item.sort_order
            from inserted cross join valid_items item
          ),
          audited as (
            insert into ${auditLogs}
              (actor_admin_id, action, entity_type, entity_id, metadata)
            select ${actorId}::uuid, ${action}, 'billing_contract', id,
                   ${JSON.stringify({ status: input.status })}::jsonb
            from inserted
          )
          select id from inserted
        `;
    const result = await db.execute(statement);
    const row = result.rows[0] as RepositoryResultRow | undefined;
    if (!row?.id) {
      throw new Error("NOT_FOUND");
    }
    return row.id;
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      throw new Error("계약 또는 활성 참조 정보를 찾을 수 없습니다.");
    }
    throw new Error("계약 정보를 저장하지 못했습니다.");
  }
}

async function getContractState(id: string): Promise<ContractState | null> {
  const [contract] = await getDb()
    .select({
      status: billingContracts.status,
      nextInvoiceDate: billingContracts.nextInvoiceDate,
    })
    .from(billingContracts)
    .where(eq(billingContracts.id, id))
    .limit(1);
  return contract ?? null;
}

async function changeContractStatus(
  actorId: string,
  id: string,
  from: ContractStatus,
  to: ContractStatus,
  nextInvoiceDate: string | null,
): Promise<boolean> {
  const result = await getDb().execute(sql`
    with updated as (
      update ${billingContracts}
      set status = ${to},
          next_invoice_date = ${nextInvoiceDate}::date,
          updated_at = now()
      where id = ${id}::uuid and status = ${from}
      returning id
    ),
    audited as (
      insert into ${auditLogs}
        (actor_admin_id, action, entity_type, entity_id, metadata)
      select ${actorId}::uuid, ${contractAction(to)},
             'billing_contract', id,
             ${JSON.stringify({ from, to })}::jsonb
      from updated
    )
    select id from updated
  `);
  return Boolean((result.rows[0] as RepositoryResultRow | undefined)?.id);
}

async function listBillingCustomers(
  filter: CustomerFilter,
): Promise<BillingCustomerSummary[]> {
  const query = filter.query?.trim().slice(0, 100);
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 100);
  const conditions = [
    filter.status ? eq(billingCustomers.status, filter.status) : undefined,
    query
      ? or(
          ilike(billingCustomers.code, `%${query}%`),
          ilike(billingCustomers.name, `%${query}%`),
        )
      : undefined,
  ].filter((condition) => condition !== undefined);

  const rows = await getDb()
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
    .orderBy(asc(billingCustomers.code))
    .limit(limit);

  return rows;
}

async function getBillingContract(
  id: string,
): Promise<BillingContractDetail | null> {
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

export const billingRepository: BillingContractRepository & {
  listBillingCustomers(
    filter: CustomerFilter,
  ): Promise<BillingCustomerSummary[]>;
  getBillingContract(id: string): Promise<BillingContractDetail | null>;
} = {
  createCustomerWithSite,
  saveContract,
  getContractState,
  changeContractStatus,
  listBillingCustomers,
  getBillingContract,
};
