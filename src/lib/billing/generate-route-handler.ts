import type { GenerateDueInvoicesResult } from "./invoice-generator.ts";

export type BillingGenerateDependencies = {
  isBillingEnabled: () => boolean;
  requireCronSecret: (request: Request) => void;
  generateDueInvoices: (
    runDate: string,
  ) => Promise<GenerateDueInvoicesResult>;
  todayInSeoul: () => string;
};

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function createBillingGenerateHandler(
  dependencies: BillingGenerateDependencies,
) {
  return async function billingGenerateHandler(
    request: Request,
  ): Promise<Response> {
    if (!dependencies.isBillingEnabled()) {
      return json({ ok: false, code: "billing_disabled" }, 503);
    }

    try {
      dependencies.requireCronSecret(request);
    } catch {
      return json({ ok: false, code: "unauthorized" }, 401);
    }

    try {
      const result = await dependencies.generateDueInvoices(
        dependencies.todayInSeoul(),
      );
      return json(
        {
          ok: true,
          runId: result.runId,
          targetCount: result.targetCount,
          createdCount: result.createdCount,
          failedCount: result.failed.length,
        },
        200,
      );
    } catch {
      return json({ ok: false, code: "generation_failed" }, 500);
    }
  };
}
