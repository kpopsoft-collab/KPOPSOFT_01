import "server-only";

import { desc, sql } from "drizzle-orm";

import { getDb } from "../db";
import {
  billingInvoiceDeliveries,
  billingInvoices,
  billingPaymentAttempts,
  billingRefunds,
  billingRuns,
  billingWebhookReceipts,
} from "../db/schema";

export type BillingOperationsSnapshot = {
  draftApprovals: number;
  overdueInvoices: number;
  deliveryFailures: number;
  confirmingRecent: number;
  confirmingStale: number;
  webhookRetries: number;
  processingRefunds: number;
  failedRefunds: number;
  lastBillingRunAt: string | null;
};

export async function getBillingOperationsSnapshot(): Promise<BillingOperationsSnapshot> {
  const db = getDb();
  const [invoiceRows, deliveryRows, attemptRows, webhookRows, refundRows, runRows] =
    await Promise.all([
      db
        .select({
          draftApprovals: sql<number>`count(*) filter (where ${billingInvoices.status} = 'DRAFT')::int`,
          overdueInvoices: sql<number>`count(*) filter (where ${billingInvoices.status} = 'OVERDUE')::int`,
        })
        .from(billingInvoices),
      db
        .select({
          deliveryFailures: sql<number>`count(*) filter (where ${billingInvoiceDeliveries.status} = 'FAILED')::int`,
        })
        .from(billingInvoiceDeliveries),
      db
        .select({
          confirmingRecent: sql<number>`count(*) filter (
            where ${billingPaymentAttempts.status} = 'CONFIRMING'
              and ${billingPaymentAttempts.updatedAt} >= now() - interval '15 minutes'
          )::int`,
          confirmingStale: sql<number>`count(*) filter (
            where ${billingPaymentAttempts.status} = 'CONFIRMING'
              and ${billingPaymentAttempts.updatedAt} < now() - interval '15 minutes'
          )::int`,
        })
        .from(billingPaymentAttempts),
      db
        .select({
          webhookRetries: sql<number>`count(*) filter (where ${billingWebhookReceipts.status} = 'RETRY')::int`,
        })
        .from(billingWebhookReceipts),
      db
        .select({
          processingRefunds: sql<number>`count(*) filter (where ${billingRefunds.status} = 'PROCESSING')::int`,
          failedRefunds: sql<number>`count(*) filter (where ${billingRefunds.status} = 'FAILED')::int`,
        })
        .from(billingRefunds),
      db
        .select({ startedAt: billingRuns.startedAt })
        .from(billingRuns)
        .orderBy(desc(billingRuns.startedAt))
        .limit(1),
    ]);

  return {
    draftApprovals: invoiceRows[0]?.draftApprovals ?? 0,
    overdueInvoices: invoiceRows[0]?.overdueInvoices ?? 0,
    deliveryFailures: deliveryRows[0]?.deliveryFailures ?? 0,
    confirmingRecent: attemptRows[0]?.confirmingRecent ?? 0,
    confirmingStale: attemptRows[0]?.confirmingStale ?? 0,
    webhookRetries: webhookRows[0]?.webhookRetries ?? 0,
    processingRefunds: refundRows[0]?.processingRefunds ?? 0,
    failedRefunds: refundRows[0]?.failedRefunds ?? 0,
    lastBillingRunAt: runRows[0]?.startedAt.toISOString() ?? null,
  };
}
