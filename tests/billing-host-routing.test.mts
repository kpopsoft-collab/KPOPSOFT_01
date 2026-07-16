import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  billingHostDestination,
  billingRequestHost,
} from "../src/lib/billing/hosts.ts";

const hosts = {
  wwwHost: "www.kpopsoft.com",
  payHost: "pay.kpopsoft.com",
  adminHost: "admin.pay.kpopsoft.com",
};

test("production pay host exposes only canonical payment routes", () => {
  assert.deepEqual(billingHostDestination("pay.kpopsoft.com", "/", hosts), {
    kind: "rewrite",
    pathname: "/pay",
    auth: false,
  });
  assert.deepEqual(billingHostDestination("pay.kpopsoft.com", "/invoices/KPB-1", hosts), {
    kind: "rewrite",
    pathname: "/pay/invoices/KPB-1",
    auth: false,
  });
  assert.deepEqual(billingHostDestination("pay.kpopsoft.com", "/start/token", hosts), {
    kind: "rewrite",
    pathname: "/pay/start/token",
    auth: false,
  });
  assert.equal(billingHostDestination("pay.kpopsoft.com", "/admin", hosts).kind, "deny");
});

test("admin host maps billing routes and preserves login/auth callbacks", () => {
  assert.deepEqual(billingHostDestination("admin.pay.kpopsoft.com", "/", hosts), {
    kind: "rewrite",
    pathname: "/admin/billing",
    auth: true,
  });
  assert.deepEqual(billingHostDestination("admin.pay.kpopsoft.com", "/login", hosts), {
    kind: "rewrite",
    pathname: "/admin/login",
    auth: false,
  });
  assert.equal(
    billingHostDestination("admin.pay.kpopsoft.com", "/payments/1", hosts).pathname,
    "/admin/billing/payments/1",
  );
  assert.equal(
    billingHostDestination("admin.pay.kpopsoft.com", "/api/auth/callback/google", hosts).kind,
    "next",
  );
});

test("www keeps ordinary routes and redirects direct billing entry paths", () => {
  assert.deepEqual(billingHostDestination("www.kpopsoft.com", "/education", hosts), {
    kind: "next",
    auth: false,
  });
  assert.deepEqual(billingHostDestination("www.kpopsoft.com", "/pay", hosts), {
    kind: "redirect",
    host: "pay.kpopsoft.com",
    pathname: "/pay",
    auth: false,
  });
  assert.deepEqual(billingHostDestination("www.kpopsoft.com", "/admin/billing", hosts), {
    kind: "redirect",
    host: "admin.pay.kpopsoft.com",
    pathname: "/",
    auth: true,
  });
});

test("host normalization handles ports but unknown hosts gain no mapping", () => {
  const local = { wwwHost: "localhost", payHost: "pay.localhost", adminHost: "admin.localhost" };
  assert.equal(billingHostDestination("pay.localhost:3000", "/", local).pathname, "/pay");
  assert.deepEqual(billingHostDestination("preview.example.vercel.app:443", "/pay", hosts), {
    kind: "next",
    auth: false,
  });
});

test("forwarded host is trusted only on Vercel", () => {
  const headers = new Headers({
    host: "attacker.example",
    "x-forwarded-host": "pay.kpopsoft.com, proxy.internal",
  });
  assert.equal(billingRequestHost(headers, false), "attacker.example");
  assert.equal(billingRequestHost(headers, true), "pay.kpopsoft.com");
});

test("Proxy stays repository-free and never broadens cookie Domain", () => {
  const proxy = readFileSync(join(process.cwd(), "src/proxy.ts"), "utf8");
  const auth = readFileSync(join(process.cwd(), "src/auth.config.ts"), "utf8");
  assert.match(proxy, /billingHostDestination/);
  assert.match(proxy, /NextResponse\.rewrite/);
  assert.match(proxy, /NextResponse\.redirect/);
  assert.doesNotMatch(proxy, /getDb|server-only|node:crypto|billing\/payments|billing\/repository/);
  assert.doesNotMatch(proxy + auth, /domain\s*:/i);
});
