import { and, desc, eq, sql } from "drizzle-orm";

const ADMIN_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateAdminEmail(email: string): string {
  const normalized = normalizeAdminEmail(email);
  if (normalized.length > 254 || !ADMIN_EMAIL_PATTERN.test(normalized)) {
    throw new Error("올바른 이메일 주소를 입력해 주세요.");
  }
  return normalized;
}

export function parseAdminSeedEmails(value: string): string[] {
  const emails = value
    .split(",")
    .map(normalizeAdminEmail)
    .filter((email) => ADMIN_EMAIL_PATTERN.test(email));

  if (emails.length === 0) {
    throw new Error(
      "ADMIN_SEED_EMAILS must contain at least one valid email",
    );
  }

  return [...new Set(emails)];
}

export function canDeactivateAdmin(
  activeCount: number,
  targetActive: boolean,
): boolean {
  return !targetActive || activeCount > 1;
}

async function database() {
  const [{ getDb }, { adminUsers, auditLogs }] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/db/schema"),
  ]);
  return { db: getDb(), adminUsers, auditLogs };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const { db, adminUsers } = await database();
  return db
    .select()
    .from(adminUsers)
    .orderBy(desc(adminUsers.isActive), adminUsers.email);
}

export async function writeAuditLog(input: {
  actorAdminId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { db, auditLogs } = await database();
  await db.insert(auditLogs).values({
    actorAdminId: input.actorAdminId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function addAdminUser(
  actorAdminId: string,
  rawEmail: string,
): Promise<AdminUser> {
  const email = validateAdminEmail(rawEmail);
  const { db, adminUsers, auditLogs } = await database();

  await db.execute(sql`
    with upserted as (
      insert into ${adminUsers} ("email", "is_active", "updated_at")
      values (${email}, true, now())
      on conflict ("email") do update
      set "is_active" = true, "updated_at" = now()
      returning "id"
    )
    insert into ${auditLogs}
      ("actor_admin_id", "action", "entity_type", "entity_id", "metadata")
    select
      ${actorAdminId}::uuid,
      'admin.activated',
      'admin_user',
      upserted."id",
      ${JSON.stringify({ email })}::jsonb
    from upserted
  `);

  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  if (!admin) throw new Error("관리자 계정을 저장하지 못했습니다.");
  return admin;
}

export async function setAdminUserActive(
  actorAdminId: string,
  id: string,
  active: boolean,
): Promise<AdminUser> {
  const { db, adminUsers, auditLogs } = await database();
  const now = new Date();
  const allowed = active
    ? sql`true`
    : sql`(
        not ${adminUsers.isActive}
        or (select count(*) from ${adminUsers} where ${adminUsers.isActive}) > 1
      )`;

  const [, updated] = await db.batch([
    db.execute(
      sql`select pg_advisory_xact_lock(hashtext('kpopsoft_admin_users'))`,
    ),
    db
      .update(adminUsers)
      .set({ isActive: active, updatedAt: now })
      .where(and(eq(adminUsers.id, id), allowed))
      .returning(),
    db.execute(sql`
      insert into ${auditLogs}
        ("actor_admin_id", "action", "entity_type", "entity_id", "metadata")
      select
        ${actorAdminId}::uuid,
        ${active ? "admin.activated" : "admin.deactivated"},
        'admin_user',
        ${id}::uuid,
        ${JSON.stringify({ active })}::jsonb
      where exists (
        select 1 from ${adminUsers}
        where ${adminUsers.id} = ${id}::uuid
          and ${adminUsers.isActive} = ${active}
      )
    `),
  ]);

  if (updated[0]) return updated[0];

  const [target] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);
  if (!target) throw new Error("관리자 계정을 찾을 수 없습니다.");
  if (!active && target.isActive) {
    throw new Error("마지막 활성 관리자는 비활성화할 수 없습니다.");
  }
  throw new Error("관리자 상태를 변경하지 못했습니다.");
}
