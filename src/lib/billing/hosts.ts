export type BillingHostConfig = {
  wwwHost: string;
  payHost: string;
  adminHost: string;
};

export type BillingHostDestination = {
  kind: "next" | "rewrite" | "redirect" | "deny";
  auth: boolean;
  pathname?: string;
  host?: string;
};

function normalizeHost(value: string): string {
  const first = value.split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("[")) {
    const end = first.indexOf("]");
    return end >= 0 ? first.slice(0, end + 1) : "";
  }
  return first.split(":")[0] ?? "";
}

function cleanPath(pathname: string): string {
  return pathname.startsWith("/") && !pathname.startsWith("//")
    ? pathname
    : "/";
}

function existingAdminAuth(pathname: string): BillingHostDestination {
  if (pathname === "/admin/login") return { kind: "next", auth: false };
  return { kind: "next", auth: pathname === "/admin" || pathname.startsWith("/admin/") };
}

export function billingHostDestination(
  rawHost: string,
  rawPathname: string,
  config: BillingHostConfig,
): BillingHostDestination {
  const host = normalizeHost(rawHost);
  const pathname = cleanPath(rawPathname);
  const wwwHost = normalizeHost(config.wwwHost);
  const payHost = normalizeHost(config.payHost);
  const adminHost = normalizeHost(config.adminHost);

  if (host === payHost && payHost) {
    if (pathname === "/") return { kind: "rewrite", pathname: "/pay", auth: false };
    if (pathname === "/invoices" || pathname.startsWith("/invoices/")) {
      return { kind: "rewrite", pathname: `/pay${pathname}`, auth: false };
    }
    if (pathname === "/start" || pathname.startsWith("/start/")) {
      return { kind: "rewrite", pathname: `/pay${pathname}`, auth: false };
    }
    if (
      pathname === "/pay" ||
      pathname.startsWith("/pay/") ||
      pathname.startsWith("/api/pay/") ||
      pathname.startsWith("/api/payments/") ||
      pathname.startsWith("/api/widget/")
    ) {
      return { kind: "next", auth: false };
    }
    return { kind: "deny", auth: false };
  }

  if (host === adminHost && adminHost) {
    if (pathname === "/") {
      return { kind: "rewrite", pathname: "/admin/billing", auth: true };
    }
    if (pathname === "/login") {
      return { kind: "rewrite", pathname: "/admin/login", auth: false };
    }
    if (pathname.startsWith("/api/auth/")) return { kind: "next", auth: false };
    if (pathname === "/admin/login") return { kind: "next", auth: false };
    if (pathname === "/admin/billing" || pathname.startsWith("/admin/billing/")) {
      return { kind: "next", auth: true };
    }
    const prefixes = [
      "/customers",
      "/contracts",
      "/invoices",
      "/payments",
      "/integrations",
    ];
    if (pathname === "/billing") {
      return { kind: "rewrite", pathname: "/admin/billing", auth: true };
    }
    if (prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return {
        kind: "rewrite",
        pathname: `/admin/billing${pathname}`,
        auth: true,
      };
    }
    return { kind: "deny", auth: true };
  }

  if (host === wwwHost && wwwHost) {
    if (pathname === "/pay" || pathname.startsWith("/pay/")) {
      return {
        kind: "redirect",
        host: payHost,
        pathname,
        auth: false,
      };
    }
    if (pathname === "/admin/billing" || pathname.startsWith("/admin/billing/")) {
      const suffix = pathname.slice("/admin/billing".length);
      return {
        kind: "redirect",
        host: adminHost,
        pathname: suffix || "/",
        auth: true,
      };
    }
    return existingAdminAuth(pathname);
  }

  return existingAdminAuth(pathname);
}

export function billingRequestHost(headers: Headers, isVercel: boolean): string {
  const value = isVercel
    ? headers.get("x-forwarded-host") || headers.get("host") || ""
    : headers.get("host") || "";
  return normalizeHost(value);
}
