export const CONTRACT_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "SUSPENDED",
  "ENDED",
  "CANCELED",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const BILLING_CYCLES = [
  "MONTHLY",
  "ANNUAL",
  "ONE_TIME",
  "MANUAL",
] as const;

export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const INVOICE_STATUSES = [
  "DRAFT",
  "OPEN",
  "PAID",
  "OVERDUE",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "VOID",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const BILLING_PERMISSIONS = [
  "BILLING_VIEW",
  "BILLING_EDIT",
  "BILLING_APPROVE",
  "BILLING_REFUND",
  "BILLING_ADMIN",
] as const;

export type BillingPermission = (typeof BILLING_PERMISSIONS)[number];

export type InvoiceMoneyInput = {
  quantity: number;
  unitSupplyAmount: number;
  vatAmount: number;
};

export type InvoiceTotals = {
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
};

export type NextInvoiceDateInput = {
  cycle: BillingCycle;
  current: string;
  billingAnchorDay?: number;
  endDate: string | null;
};
