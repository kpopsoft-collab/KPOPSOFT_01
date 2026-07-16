import type { ContractStatus, InvoiceStatus } from "./types";

export const CONTRACT_TRANSITIONS: Readonly<
  Record<ContractStatus, readonly ContractStatus[]>
> = {
  DRAFT: ["ACTIVE", "CANCELED"],
  ACTIVE: ["SUSPENDED", "ENDED", "CANCELED"],
  SUSPENDED: ["ACTIVE", "ENDED", "CANCELED"],
  ENDED: [],
  CANCELED: [],
};

export const INVOICE_TRANSITIONS: Readonly<
  Record<InvoiceStatus, readonly InvoiceStatus[]>
> = {
  DRAFT: ["OPEN", "VOID"],
  OPEN: ["PAID", "OVERDUE", "VOID"],
  OVERDUE: ["PAID", "VOID"],
  PAID: ["PARTIALLY_REFUNDED", "REFUNDED"],
  PARTIALLY_REFUNDED: ["REFUNDED"],
  REFUNDED: [],
  VOID: [],
};

export function canTransitionContract(
  from: ContractStatus,
  to: ContractStatus,
): boolean {
  return CONTRACT_TRANSITIONS[from].includes(to);
}

export function canTransitionInvoice(
  from: InvoiceStatus,
  to: InvoiceStatus,
): boolean {
  return INVOICE_TRANSITIONS[from].includes(to);
}
