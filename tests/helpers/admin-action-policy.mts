const MUTATION_BOUNDARIES = [
  "getAdminData(",
  "getContentData(",
  "getInquiryOptionsData(",
  "createSupabaseServerClient(",
  "createSupabaseAdminClient(",
  "addAdminUser(",
  "setAdminUserActive(",
  "writeAuditLog(",
] as const;

export function findAdminActionGuardViolations(source: string): string[] {
  return source
    .split(/export async function /)
    .slice(1)
    .flatMap((exportedFunction) => {
      const functionName = exportedFunction.match(/^([A-Za-z0-9_]+)/)?.[1];
      if (!functionName) return ["<unknown>"];

      const guardIndex = exportedFunction.indexOf("await requireAdminAction()");
      const mutationIndex = Math.min(
        ...MUTATION_BOUNDARIES.map((boundary) => {
          const index = exportedFunction.indexOf(boundary);
          return index === -1 ? Number.POSITIVE_INFINITY : index;
        }),
      );

      return guardIndex === -1 || guardIndex > mutationIndex
        ? [functionName]
        : [];
    });
}
