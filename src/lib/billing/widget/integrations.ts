import { randomBytes, randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";
import { z } from "zod";

import {
  encodeWidgetSecret,
  encryptWidgetSecret,
  generateWidgetSecret,
} from "./crypto.ts";
import { normalizeWidgetOrigin } from "./origins.ts";
import { requireWidgetMasterKey } from "./runtime.ts";

export { normalizeWidgetOrigin } from "./origins.ts";

export type WidgetIntegrationCredential = {
  id: string;
  publicId: string;
  siteId: string;
  keyVersion: number;
  status: "ACTIVE" | "DISABLED";
  encryptedSecret: Uint8Array;
  secretIv: Uint8Array;
  secretTag: Uint8Array;
};

export type CreateWidgetIntegrationRecord = {
  id: string;
  actorId: string;
  publicId: string;
  siteId: string;
  allowedOrigin: string;
  keyVersion: number;
  encryptedSecret: Uint8Array;
  secretIv: Uint8Array;
  secretTag: Uint8Array;
};

export type RotateWidgetIntegrationRecord = {
  actorId: string;
  integrationId: string;
  expectedKeyVersion: number;
  keyVersion: number;
  encryptedSecret: Uint8Array;
  secretIv: Uint8Array;
  secretTag: Uint8Array;
};

export type WidgetIntegrationRepository = {
  create(input: CreateWidgetIntegrationRecord): Promise<string>;
  findCredential(integrationId: string): Promise<WidgetIntegrationCredential | null>;
  rotate(input: RotateWidgetIntegrationRecord): Promise<boolean>;
  setEnabled(input: {
    actorId: string;
    integrationId: string;
    enabled: boolean;
  }): Promise<boolean>;
};

export type WidgetIntegrationCommandOptions = {
  masterKey: Uint8Array;
  randomSecret?: () => Uint8Array;
  randomPublicId?: () => string;
};

function defaultPublicId(): string {
  return `wgt_live_${randomBytes(18).toString("base64url")}`;
}

function uuid(value: string): string {
  return z.string().uuid().parse(value);
}

function assertSecret(value: Uint8Array): Uint8Array {
  if (value.byteLength !== 32) {
    throw new Error("Widget secret generator must return 32 bytes");
  }
  return value;
}

export function createWidgetIntegrationCommands(
  repository: WidgetIntegrationRepository,
  options: WidgetIntegrationCommandOptions,
) {
  const randomSecret = options.randomSecret ?? generateWidgetSecret;
  const randomPublicId = options.randomPublicId ?? defaultPublicId;

  return {
    async createWidgetIntegration(
      actorId: string,
      siteId: string,
      allowedOrigin: string,
    ): Promise<{ publicId: string; secret: string }> {
      const normalizedActorId = uuid(actorId);
      const normalizedSiteId = uuid(siteId);
      const normalizedOrigin = normalizeWidgetOrigin(allowedOrigin);
      const publicId = z.string().min(16).max(128).parse(randomPublicId());
      const secret = assertSecret(randomSecret());
      const encrypted = encryptWidgetSecret(secret, options.masterKey, {
        publicId,
        siteId: normalizedSiteId,
        keyVersion: 1,
      });

      await repository.create({
        id: randomUUID(),
        actorId: normalizedActorId,
        publicId,
        siteId: normalizedSiteId,
        allowedOrigin: normalizedOrigin,
        keyVersion: 1,
        encryptedSecret: encrypted.ciphertext,
        secretIv: encrypted.iv,
        secretTag: encrypted.tag,
      });
      return { publicId, secret: encodeWidgetSecret(secret) };
    },

    async rotateWidgetIntegration(
      actorId: string,
      integrationId: string,
    ): Promise<{ secret: string; keyVersion: number }> {
      const normalizedActorId = uuid(actorId);
      const normalizedIntegrationId = uuid(integrationId);
      const current = await repository.findCredential(normalizedIntegrationId);
      if (!current) throw new Error("Widget integration not found");
      if (current.status !== "ACTIVE") {
        throw new Error("Disabled widget integration cannot be rotated");
      }

      const keyVersion = current.keyVersion + 1;
      if (!Number.isSafeInteger(keyVersion)) {
        throw new Error("Invalid widget key version");
      }
      const secret = assertSecret(randomSecret());
      const encrypted = encryptWidgetSecret(secret, options.masterKey, {
        publicId: current.publicId,
        siteId: current.siteId,
        keyVersion,
      });
      const changed = await repository.rotate({
        actorId: normalizedActorId,
        integrationId: normalizedIntegrationId,
        expectedKeyVersion: current.keyVersion,
        keyVersion,
        encryptedSecret: encrypted.ciphertext,
        secretIv: encrypted.iv,
        secretTag: encrypted.tag,
      });
      if (!changed) {
        throw new Error("Widget integration changed; retry rotation");
      }
      return { secret: encodeWidgetSecret(secret), keyVersion };
    },

    async setWidgetIntegrationEnabled(
      actorId: string,
      integrationId: string,
      enabled: boolean,
    ): Promise<void> {
      const changed = await repository.setEnabled({
        actorId: uuid(actorId),
        integrationId: uuid(integrationId),
        enabled: z.boolean().parse(enabled),
      });
      if (!changed) throw new Error("Widget integration state was not changed");
    },
  };
}

const defaultWidgetIntegrationRepository: WidgetIntegrationRepository = {
  async create(input) {
    const [{ getDb }, schema] = await Promise.all([
      import("../../db"),
      import("../../db/schema"),
    ]);
    const metadata = JSON.stringify({
      publicId: input.publicId,
      siteId: input.siteId,
      keyVersion: input.keyVersion,
    });
    const result = await getDb().execute(sql`
      with valid_site as (
        select ${schema.billingSites.id}
        from ${schema.billingSites}
        inner join ${schema.billingCustomers}
          on ${schema.billingCustomers.id} = ${schema.billingSites.customerId}
        where ${schema.billingSites.id} = ${input.siteId}::uuid
          and ${schema.billingSites.primaryOrigin} = ${input.allowedOrigin}
          and ${schema.billingSites.status} = 'ACTIVE'
          and ${schema.billingCustomers.status} = 'ACTIVE'
      ), inserted as (
        insert into ${schema.billingWidgetIntegrations}
          (id, public_id, site_id, encrypted_secret, secret_iv, secret_tag,
           allowed_origin, key_version, status)
        select ${input.id}::uuid, ${input.publicId}, ${input.siteId}::uuid,
               ${input.encryptedSecret}, ${input.secretIv}, ${input.secretTag},
               ${input.allowedOrigin}, ${input.keyVersion}, 'ACTIVE'
        where exists (select 1 from valid_site)
        returning id
      ), audited as (
        insert into ${schema.auditLogs}
          (actor_admin_id, action, entity_type, entity_id, metadata)
        select ${input.actorId}::uuid, 'billing.widget.created',
               'billing_widget_integration', id, ${metadata}::jsonb
        from inserted
      )
      select id from inserted
    `);
    const id = (result.rows[0] as { id?: string } | undefined)?.id;
    if (!id) {
      throw new Error("Widget integration site or origin is unavailable");
    }
    return id;
  },

  async findCredential(integrationId) {
    const [{ getDb }, schema] = await Promise.all([
      import("../../db"),
      import("../../db/schema"),
    ]);
    const [row] = await getDb()
      .select({
        id: schema.billingWidgetIntegrations.id,
        publicId: schema.billingWidgetIntegrations.publicId,
        siteId: schema.billingWidgetIntegrations.siteId,
        keyVersion: schema.billingWidgetIntegrations.keyVersion,
        status: schema.billingWidgetIntegrations.status,
        encryptedSecret: schema.billingWidgetIntegrations.encryptedSecret,
        secretIv: schema.billingWidgetIntegrations.secretIv,
        secretTag: schema.billingWidgetIntegrations.secretTag,
      })
      .from(schema.billingWidgetIntegrations)
      .where(sql`${schema.billingWidgetIntegrations.id} = ${integrationId}::uuid`)
      .limit(1);
    return row ?? null;
  },

  async rotate(input) {
    const [{ getDb }, schema] = await Promise.all([
      import("../../db"),
      import("../../db/schema"),
    ]);
    const metadata = JSON.stringify({
      keyVersion: input.keyVersion,
    });
    const result = await getDb().execute(sql`
      with updated as (
        update ${schema.billingWidgetIntegrations}
        set encrypted_secret = ${input.encryptedSecret},
            secret_iv = ${input.secretIv},
            secret_tag = ${input.secretTag},
            key_version = ${input.keyVersion},
            rotated_at = now(),
            updated_at = now()
        where id = ${input.integrationId}::uuid
          and key_version = ${input.expectedKeyVersion}
          and status = 'ACTIVE'
        returning id
      ), audited as (
        insert into ${schema.auditLogs}
          (actor_admin_id, action, entity_type, entity_id, metadata)
        select ${input.actorId}::uuid, 'billing.widget.rotated',
               'billing_widget_integration', id, ${metadata}::jsonb
        from updated
      )
      select id from updated
    `);
    return Boolean((result.rows[0] as { id?: string } | undefined)?.id);
  },

  async setEnabled(input) {
    const [{ getDb }, schema] = await Promise.all([
      import("../../db"),
      import("../../db/schema"),
    ]);
    const status = input.enabled ? "ACTIVE" : "DISABLED";
    const action = input.enabled
      ? "billing.widget.enabled"
      : "billing.widget.disabled";
    const metadata = JSON.stringify({ status });
    const result = await getDb().execute(sql`
      with updated as (
        update ${schema.billingWidgetIntegrations} integration
        set status = ${status}, updated_at = now()
        where integration.id = ${input.integrationId}::uuid
          and integration.status <> ${status}
          and (
            ${input.enabled} = false
            or exists (
              select 1
              from ${schema.billingSites} site
              inner join ${schema.billingCustomers} customer
                on customer.id = site.customer_id
              where site.id = integration.site_id
                and site.status = 'ACTIVE'
                and customer.status = 'ACTIVE'
            )
          )
        returning integration.id
      ), audited as (
        insert into ${schema.auditLogs}
          (actor_admin_id, action, entity_type, entity_id, metadata)
        select ${input.actorId}::uuid, ${action},
               'billing_widget_integration', id, ${metadata}::jsonb
        from updated
      )
      select id from updated
    `);
    return Boolean((result.rows[0] as { id?: string } | undefined)?.id);
  },
};

async function defaultCommands() {
  return createWidgetIntegrationCommands(defaultWidgetIntegrationRepository, {
    masterKey: requireWidgetMasterKey(),
  });
}

export async function createWidgetIntegration(
  actorId: string,
  siteId: string,
  allowedOrigin: string,
): Promise<{ publicId: string; secret: string }> {
  return (await defaultCommands()).createWidgetIntegration(
    actorId,
    siteId,
    allowedOrigin,
  );
}

export async function rotateWidgetIntegration(
  actorId: string,
  integrationId: string,
): Promise<{ secret: string; keyVersion: number }> {
  return (await defaultCommands()).rotateWidgetIntegration(
    actorId,
    integrationId,
  );
}

export async function setWidgetIntegrationEnabled(
  actorId: string,
  integrationId: string,
  enabled: boolean,
): Promise<void> {
  return (await defaultCommands()).setWidgetIntegrationEnabled(
    actorId,
    integrationId,
    enabled,
  );
}

export async function listWidgetIntegrationsForAdmin() {
  const [{ getDb }, schema] = await Promise.all([
    import("../../db"),
    import("../../db/schema"),
  ]);
  const db = getDb();
  const [integrations, sites] = await Promise.all([
    db
      .select({
        id: schema.billingWidgetIntegrations.id,
        publicId: schema.billingWidgetIntegrations.publicId,
        allowedOrigin: schema.billingWidgetIntegrations.allowedOrigin,
        keyVersion: schema.billingWidgetIntegrations.keyVersion,
        status: schema.billingWidgetIntegrations.status,
        lastUsedAt: schema.billingWidgetIntegrations.lastUsedAt,
        rotatedAt: schema.billingWidgetIntegrations.rotatedAt,
        siteId: schema.billingSites.id,
        siteCode: schema.billingSites.code,
        siteName: schema.billingSites.name,
        customerName: schema.billingCustomers.name,
      })
      .from(schema.billingWidgetIntegrations)
      .innerJoin(
        schema.billingSites,
        sql`${schema.billingSites.id} = ${schema.billingWidgetIntegrations.siteId}`,
      )
      .innerJoin(
        schema.billingCustomers,
        sql`${schema.billingCustomers.id} = ${schema.billingSites.customerId}`,
      )
      .orderBy(schema.billingCustomers.name, schema.billingSites.code),
    db
      .select({
        id: schema.billingSites.id,
        code: schema.billingSites.code,
        name: schema.billingSites.name,
        customerName: schema.billingCustomers.name,
        primaryOrigin: schema.billingSites.primaryOrigin,
      })
      .from(schema.billingSites)
      .innerJoin(
        schema.billingCustomers,
        sql`${schema.billingCustomers.id} = ${schema.billingSites.customerId}`,
      )
      .leftJoin(
        schema.billingWidgetIntegrations,
        sql`${schema.billingWidgetIntegrations.siteId} = ${schema.billingSites.id}`,
      )
      .where(sql`${schema.billingSites.status} = 'ACTIVE'
        and ${schema.billingCustomers.status} = 'ACTIVE'
        and ${schema.billingWidgetIntegrations.id} is null`)
      .orderBy(schema.billingCustomers.name, schema.billingSites.code),
  ]);
  return { integrations, sites };
}

export async function getWidgetIntegrationForAdmin(id: string) {
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) return null;
  const [{ getDb }, schema] = await Promise.all([
    import("../../db"),
    import("../../db/schema"),
  ]);
  const [row] = await getDb()
    .select({
      id: schema.billingWidgetIntegrations.id,
      publicId: schema.billingWidgetIntegrations.publicId,
      allowedOrigin: schema.billingWidgetIntegrations.allowedOrigin,
      keyVersion: schema.billingWidgetIntegrations.keyVersion,
      status: schema.billingWidgetIntegrations.status,
      lastUsedAt: schema.billingWidgetIntegrations.lastUsedAt,
      rotatedAt: schema.billingWidgetIntegrations.rotatedAt,
      createdAt: schema.billingWidgetIntegrations.createdAt,
      siteCode: schema.billingSites.code,
      siteName: schema.billingSites.name,
      customerName: schema.billingCustomers.name,
    })
    .from(schema.billingWidgetIntegrations)
    .innerJoin(
      schema.billingSites,
      sql`${schema.billingSites.id} = ${schema.billingWidgetIntegrations.siteId}`,
    )
    .innerJoin(
      schema.billingCustomers,
      sql`${schema.billingCustomers.id} = ${schema.billingSites.customerId}`,
    )
    .where(sql`${schema.billingWidgetIntegrations.id} = ${parsedId.data}::uuid`)
    .limit(1);
  return row ?? null;
}
