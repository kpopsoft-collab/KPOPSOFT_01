import { z } from "zod";

import type { NextInvoiceDateInput } from "./types";

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((value): CalendarDate => {
    const [year, month, day] = value.split("-").map(Number);
    return { year, month, day };
  })
  .refine(
    ({ year, month, day }) =>
      year >= 1 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= daysInMonth(year, month),
    { message: "invalid calendar date" },
  );

function parseCalendarDate(value: string): CalendarDate {
  const parsed = calendarDateSchema.safeParse(value);
  if (!parsed.success) throw new Error("invalid calendar date");
  return parsed.data;
}

function formatCalendarDate(date: CalendarDate): string {
  return [
    String(date.year).padStart(4, "0"),
    String(date.month).padStart(2, "0"),
    String(date.day).padStart(2, "0"),
  ].join("-");
}

function requireAnchorDay(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 31) {
    throw new Error("invalid billing anchor day");
  }
  return value;
}

export function nextInvoiceDate(input: NextInvoiceDateInput): string | null {
  const current = parseCalendarDate(input.current);
  const endDate = input.endDate
    ? formatCalendarDate(parseCalendarDate(input.endDate))
    : null;

  if (input.cycle === "ONE_TIME" || input.cycle === "MANUAL") return null;

  const anchorDay = requireAnchorDay(input.billingAnchorDay ?? current.day);
  let targetYear = current.year;
  let targetMonth = current.month;

  if (input.cycle === "MONTHLY") {
    targetMonth += 1;
    if (targetMonth === 13) {
      targetYear += 1;
      targetMonth = 1;
    }
  } else {
    targetYear += 1;
  }

  const next = formatCalendarDate({
    year: targetYear,
    month: targetMonth,
    day: Math.min(anchorDay, daysInMonth(targetYear, targetMonth)),
  });

  return endDate && next > endDate ? null : next;
}
