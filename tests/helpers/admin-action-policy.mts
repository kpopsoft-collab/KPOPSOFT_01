const MUTATION_BOUNDARIES = [
  "getAdminData(",
  "getContentData(",
  "getInquiryOptionsData(",
  "createSupabaseServerClient(",
  "createSupabaseAdminClient(",
  "addAdminUser(",
  "setAdminUserActive(",
  "writeAuditLog(",
  "createCustomerWithSite(",
  "saveContract(",
  "changeContractStatus(",
  "updateDraftInvoice(",
  "approveInvoice(",
  "voidInvoice(",
  "retryInvoiceDelivery(",
  "createWidgetIntegrationCredential(",
  "rotateWidgetIntegrationCredential(",
  "setWidgetIntegrationCredentialEnabled(",
] as const;

const ACTION_GUARDS = [
  "await requireAdminAction()",
  "await requireBillingPermission(",
  "await requireRecentBillingAuth(",
] as const;

export function findAdminActionGuardViolations(source: string): string[] {
  return source
    .split(/export async function /)
    .slice(1)
    .flatMap((exportedFunction) => {
      const functionName = exportedFunction.match(/^([A-Za-z0-9_]+)/)?.[1];
      if (!functionName) return ["<unknown>"];

      const guardIndex = Math.min(
        ...ACTION_GUARDS.map((guard) => {
          const index = exportedFunction.indexOf(guard);
          return index === -1 ? Number.POSITIVE_INFINITY : index;
        }),
      );
      const mutationIndex = Math.min(
        ...MUTATION_BOUNDARIES.map((boundary) => {
          const index = exportedFunction.indexOf(boundary);
          return index === -1 ? Number.POSITIVE_INFINITY : index;
        }),
      );

      return !Number.isFinite(guardIndex) || guardIndex > mutationIndex
        ? [functionName]
        : [];
    });
}
