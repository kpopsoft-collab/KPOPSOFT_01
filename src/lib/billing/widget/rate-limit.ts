import { createHmac, randomUUID } from "node:crypto";
import { isIP } from "node:net";

import { sql } from "drizzle-orm";

export type WidgetRateLimitInput = {
  integrationId: string;
  ip: string;
  now?: number;
};

export type WidgetRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export type WidgetRateLimiter = {
  consume(input: WidgetRateLimitInput): Promise<WidgetRateLimitResult>;
};

function expandIpv6(value: string): string[] | null {
  const withoutZone = value.split("%")[0].toLowerCase();
  if (isIP(withoutZone) !== 6) return null;
  const [leftRaw, rightRaw, ...extra] = withoutZone.split("::");
  if (extra.length > 0) return null;
  const left = leftRaw ? leftRaw.split(":") : [];
  const right = rightRaw ? rightRaw.split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((withoutZone.includes("::") && missing < 1) || (!withoutZone.includes("::") && missing !== 0)) {
    return null;
  }
  return [
    ...left,
    ...Array.from({ length: missing }, () => "0"),
    ...right,
  ].map((part) => Number.parseInt(part || "0", 16).toString(16));
}

export function normalizeIpPrefix(value: string): string {
  const candidate = value.trim();
  if (isIP(candidate) === 4) {
    const octets = candidate.split(".");
    return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
  }
  const ipv6 = expandIpv6(candidate);
  if (ipv6) return `${ipv6.slice(0, 4).join(":")}::/64`;
  return "unknown";
}

export function hmacRateLimitKey(
  hashKey: Uint8Array,
  value: string,
): Uint8Array {
  if (hashKey.byteLength !== 32) {
    throw new Error("Rate-limit hash key must be 32 bytes");
  }
  return new Uint8Array(
    createHmac("sha256", hashKey).update(value, "utf8").digest(),
  );
}

function retryAfter(now: number): number {
  const elapsed = ((now % 60_000) + 60_000) % 60_000;
  return Math.max(1, Math.ceil((60_000 - elapsed) / 1000));
}

export function createInMemoryWidgetRateLimiter(
  limits: {
    integrationLimit?: number;
    integrationIpLimit?: number;
  } = {},
): WidgetRateLimiter {
  const integrationLimit = limits.integrationLimit ?? 300;
  const integrationIpLimit = limits.integrationIpLimit ?? 60;
  const integration = new Map<string, number>();
  const integrationIp = new Map<string, number>();

  return {
    async consume(input) {
      const now = input.now ?? Date.now();
      const bucket = Math.floor(now / 60_000);
      const prefix = normalizeIpPrefix(input.ip);
      const integrationKey = `${bucket}:${input.integrationId}`;
      const ipKey = `${integrationKey}:${prefix}`;
      const integrationCount = (integration.get(integrationKey) ?? 0) + 1;
      const ipCount = (integrationIp.get(ipKey) ?? 0) + 1;
      integration.set(integrationKey, integrationCount);
      integrationIp.set(ipKey, ipCount);
      const allowed =
        integrationCount <= integrationLimit &&
        ipCount <= integrationIpLimit;
      return {
        allowed,
        retryAfterSeconds: allowed ? 0 : retryAfter(now),
      };
    },
  };
}

export function createNeonWidgetRateLimiter(
  hashKey: Uint8Array,
): WidgetRateLimiter {
  return {
    async consume(input) {
      const [{ getDb }, schema] = await Promise.all([
        import("../../db"),
        import("../../db/schema"),
      ]);
      const now = input.now ?? Date.now();
      const bucketStart = new Date(Math.floor(now / 60_000) * 60_000);
      const integrationHash = hmacRateLimitKey(
        hashKey,
        `integration:${input.integrationId}`,
      );
      const ipHash = hmacRateLimitKey(
        hashKey,
        `integration-ip:${input.integrationId}:${normalizeIpPrefix(input.ip)}`,
      );
      const result = await getDb().execute(sql`
        insert into ${schema.billingWidgetRateLimits}
          (id, integration_id, scope, key_hash, bucket_start, request_count)
        values
          (${randomUUID()}::uuid, ${input.integrationId}::uuid,
           'INTEGRATION', ${integrationHash}, ${bucketStart}, 1),
          (${randomUUID()}::uuid, ${input.integrationId}::uuid,
           'INTEGRATION_IP', ${ipHash}, ${bucketStart}, 1)
        on conflict (integration_id, scope, key_hash, bucket_start)
        do update set
          request_count = ${schema.billingWidgetRateLimits.requestCount} + 1,
          updated_at = now()
        returning scope, request_count
      `);
      const counts = new Map(
        result.rows.map((row) => {
          const value = row as { scope: string; request_count: number | string };
          return [value.scope, Number(value.request_count)] as const;
        }),
      );
      const allowed =
        (counts.get("INTEGRATION") ?? 301) <= 300 &&
        (counts.get("INTEGRATION_IP") ?? 61) <= 60;
      return {
        allowed,
        retryAfterSeconds: allowed ? 0 : retryAfter(now),
      };
    },
  };
}

export async function cleanupExpiredWidgetRateLimits(): Promise<void> {
  const [{ getDb }, schema] = await Promise.all([
    import("../../db"),
    import("../../db/schema"),
  ]);
  await getDb().execute(sql`
    delete from ${schema.billingWidgetRateLimits}
    where bucket_start < now() - interval '1 day'
  `);
}
