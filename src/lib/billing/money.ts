import type {
  InvoiceMoneyInput,
  InvoiceTotals,
} from "./types";

function requireKrwInteger(value: number, options: { positive?: boolean } = {}) {
  const lowerBound = options.positive ? 1 : 0;
  if (!Number.isSafeInteger(value) || value < lowerBound) {
    throw new Error("KRW integer is invalid");
  }
  return value;
}

function safeAdd(left: number, right: number): number {
  return requireKrwInteger(left + right);
}

export function calculateInvoiceTotals(
  items: readonly InvoiceMoneyInput[],
): InvoiceTotals {
  return items.reduce<InvoiceTotals>(
    (totals, item) => {
      const quantity = requireKrwInteger(item.quantity, { positive: true });
      const unitSupplyAmount = requireKrwInteger(item.unitSupplyAmount);
      const vatAmount = requireKrwInteger(item.vatAmount);
      const supplyAmount = requireKrwInteger(quantity * unitSupplyAmount);

      return {
        supplyAmount: safeAdd(totals.supplyAmount, supplyAmount),
        vatAmount: safeAdd(totals.vatAmount, vatAmount),
        totalAmount: safeAdd(
          totals.totalAmount,
          safeAdd(supplyAmount, vatAmount),
        ),
      };
    },
    { supplyAmount: 0, vatAmount: 0, totalAmount: 0 },
  );
}
