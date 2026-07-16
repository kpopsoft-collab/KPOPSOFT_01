import { and, eq } from "drizzle-orm";

import type { AdminIdentity } from "../admin/auth";
import { isAdminDevBypassEnabled } from "../admin/runtime-mode.ts";
import { isBillingEnabled } from "./runtime.ts";
import {
  BILLING_PERMISSIONS,
  type BillingPermission,
} from "./types.ts";

const IMPLIED: Record<BillingPermission, readonly BillingPermission[]> = {
  BILLING_VIEW: ["BILLING_VIEW"],
  BILLING_EDIT: ["BILLING_VIEW", "BILLING_EDIT"],
  BILLING_APPROVE: ["BILLING_VIEW", "BILLING_APPROVE"],
  BILLING_REFUND: ["BILLING_VIEW", "BILLING_REFUND"],
  BILLING_ADMIN: [
    "BILLING_VIEW",
    "BILLING_EDIT",
    "BILLING_APPROVE",
    "BILLING_REFUND",
    "BILLING_ADMIN",
  ],
};

export type BillingAdminIdentity = AdminIdentity & {
  permissions: BillingPermission[];
};

export type BillingAuthorizationInput = {
  admin: AdminIdentity | null;
  active: boolean;
  granted: readonly BillingPermission[];
  required: BillingPermission;
};

export class BillingReauthenticationRequiredError extends Error {
  readonly code = "reauth_required" as const;
  readonly redirectTo: string;

  constructor(returnTo = "/admin/billing") {
    super("Recent authentication is required");
    this.name = "BillingReauthenticationRequiredError";
    this.redirectTo = `/admin/login?reason=reauth&returnTo=${encodeURIComponent(returnTo)}`;
  }
}

export function hasBillingPermission(
  granted: readonly BillingPermission[],
  required: BillingPermission,
): boolean {
  return granted.some((role) => IMPLIED[role].includes(required));
}

function expandedPermissions(
  granted: readonly BillingPermission[],
): BillingPermission[] {
  const expanded = new Set(
    granted.flatMap((permission) => IMPLIED[permission]),
  );
  return BILLING_PERMISSIONS.filter((permission) => expanded.has(permission));
}

export function authorizeBillingIdentity(
  input: BillingAuthorizationInput,
): BillingAdminIdentity {
  if (
    !input.admin ||
    !input.active ||
    !hasBillingPermission(input.granted, input.required)
  ) {
    throw new Error("Forbidden");
  }

  return {
    ...input.admin,
    permissions: expandedPermissions(input.granted),
  };
}

export function isRecentBillingAuth(
  authTime: number | null | undefined,
  options: { nowSeconds?: number; maxAgeSeconds?: number } = {},
): boolean {
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const maxAgeSeconds = options.maxAgeSeconds ?? 15 * 60;
  if (
    !Number.isSafeInteger(authTime) ||
    !Number.isSafeInteger(nowSeconds) ||
    !Number.isSafeInteger(maxAgeSeconds) ||
    maxAgeSeconds < 0
  ) {
    return false;
  }

  const ageSeconds = nowSeconds - (authTime as number);
  return ageSeconds >= 0 && ageSeconds <= maxAgeSeconds;
}

export async function requireBillingPermission(
  permission: BillingPermission,
): Promise<BillingAdminIdentity> {
  if (!isBillingEnabled()) throw new Error("Billing is not configured");

  const [{ getAdminSession }, { getDb }, { adminUsers, billingAdminRoles }] =
    await Promise.all([
      import("../admin/auth"),
      import("../db"),
      import("../db/schema"),
    ]);
  const admin = await getAdminSession();
  if (isAdminDevBypassEnabled()) {
    return authorizeBillingIdentity({
      admin,
      active: Boolean(admin),
      granted: ["BILLING_ADMIN"],
      required: permission,
    });
  }
  if (!admin) throw new Error("Forbidden");

  const rows = await getDb()
    .select({
      active: adminUsers.isActive,
      role: billingAdminRoles.role,
    })
    .from(adminUsers)
    .leftJoin(
      billingAdminRoles,
      eq(billingAdminRoles.adminId, adminUsers.id),
    )
    .where(
      and(
        eq(adminUsers.id, admin.id),
        eq(adminUsers.isActive, true),
      ),
    );

  return authorizeBillingIdentity({
    admin,
    active: rows[0]?.active === true,
    granted: rows.flatMap((row) => (row.role ? [row.role] : [])),
    required: permission,
  });
}

export async function requireRecentBillingAuth(
  permission: "BILLING_APPROVE" | "BILLING_REFUND" | "BILLING_ADMIN",
  maxAgeSeconds = 15 * 60,
): Promise<BillingAdminIdentity> {
  const identity = await requireBillingPermission(permission);
  if (!isRecentBillingAuth(identity.authTime, { maxAgeSeconds })) {
    throw new BillingReauthenticationRequiredError();
  }
  return identity;
}
