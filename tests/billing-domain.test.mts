import assert from "node:assert/strict";
import test from "node:test";

import { nextInvoiceDate } from "../src/lib/billing/dates.ts";
import { calculateInvoiceTotals } from "../src/lib/billing/money.ts";
import {
  canTransitionContract,
  canTransitionInvoice,
} from "../src/lib/billing/transitions.ts";

test("invoice totals accept safe non-negative KRW integers", () => {
  assert.deepEqual(
    calculateInvoiceTotals([
      { quantity: 2, unitSupplyAmount: 100_000, vatAmount: 20_000 },
    ]),
    { supplyAmount: 200_000, vatAmount: 20_000, totalAmount: 220_000 },
  );
});

test("invoice totals reject fractional or unsafe KRW values", () => {
  assert.throws(
    () =>
      calculateInvoiceTotals([
        { quantity: 1.5, unitSupplyAmount: 100, vatAmount: 10 },
      ]),
    /KRW integer/,
  );
  assert.throws(
    () =>
      calculateInvoiceTotals([
        {
          quantity: 2,
          unitSupplyAmount: Number.MAX_SAFE_INTEGER,
          vatAmount: 0,
        },
      ]),
    /KRW integer/,
  );
});

test("monthly billing corrects missing month days", () => {
  assert.equal(
    nextInvoiceDate({
      cycle: "MONTHLY",
      current: "2026-01-31",
      endDate: null,
    }),
    "2026-02-28",
  );
  assert.equal(
    nextInvoiceDate({
      cycle: "MONTHLY",
      current: "2028-01-31",
      endDate: null,
    }),
    "2028-02-29",
  );
});

test("monthly billing preserves the original anchor after correction", () => {
  assert.equal(
    nextInvoiceDate({
      cycle: "MONTHLY",
      current: "2026-02-28",
      billingAnchorDay: 31,
      endDate: null,
    }),
    "2026-03-31",
  );
});

test("non-recurring cycles and dates past the contract end stop", () => {
  assert.equal(
    nextInvoiceDate({
      cycle: "ANNUAL",
      current: "2026-08-16",
      endDate: "2027-01-31",
    }),
    null,
  );
  assert.equal(
    nextInvoiceDate({
      cycle: "ONE_TIME",
      current: "2026-08-16",
      endDate: null,
    }),
    null,
  );
  assert.equal(
    nextInvoiceDate({
      cycle: "MANUAL",
      current: "2026-08-16",
      endDate: null,
    }),
    null,
  );
});

test("invalid calendar input fails closed", () => {
  assert.throws(
    () =>
      nextInvoiceDate({
        cycle: "MONTHLY",
        current: "2026-02-30",
        endDate: null,
      }),
    /calendar date/,
  );
});

test("invoice transitions prevent skipping payment states", () => {
  assert.equal(canTransitionInvoice("DRAFT", "OPEN"), true);
  assert.equal(canTransitionInvoice("DRAFT", "PAID"), false);
  assert.equal(canTransitionInvoice("PAID", "VOID"), false);
  assert.equal(canTransitionInvoice("PAID", "PARTIALLY_REFUNDED"), true);
});

test("contract transitions cannot reactivate terminal contracts", () => {
  assert.equal(canTransitionContract("DRAFT", "ACTIVE"), true);
  assert.equal(canTransitionContract("ACTIVE", "SUSPENDED"), true);
  assert.equal(canTransitionContract("ENDED", "ACTIVE"), false);
  assert.equal(canTransitionContract("CANCELED", "ACTIVE"), false);
});
