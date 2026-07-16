import { Client } from "@neondatabase/serverless";
import { createHash } from "node:crypto";

import { parseAdminSeedEmails } from "../src/lib/admin/admin-users.ts";
import {
  experts,
  inquiryOptions,
  insights,
  selectedWork,
  stats,
  testimonials,
} from "../src/lib/site.ts";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured");
}

const adminEmails = parseAdminSeedEmails(
  process.env.ADMIN_SEED_EMAILS ?? "",
);
const billingAdminSeedValue =
  process.env.BILLING_ADMIN_SEED_EMAILS?.trim() ?? "";
const billingAdminEmails = billingAdminSeedValue
  ? parseAdminSeedEmails(billingAdminSeedValue)
  : [];

function stableUuid(key: string): string {
  const bytes = createHash("sha256").update(`kpopsoft:${key}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const client = new Client({ connectionString: databaseUrl });
await client.connect();

try {
  await client.query("begin");

  for (const email of adminEmails) {
    await client.query(
      `insert into admin_users (id, email, is_active)
       values ($1, $2, true)
       on conflict (email) do update
       set is_active = true, updated_at = now()`,
      [stableUuid(`admin:${email}`), email],
    );
  }

  for (const email of billingAdminEmails) {
    await client.query(
      `insert into billing_admin_roles (admin_id, role, granted_by)
       select id, 'BILLING_ADMIN', id
       from admin_users
       where email = $1 and is_active = true
       on conflict (admin_id, role) do nothing`,
      [email],
    );
  }

  for (const [typeIndex, type] of inquiryOptions.entries()) {
    const typeId = stableUuid(`inquiry-type:${type.type}`);
    await client.query(
      `insert into inquiry_types (id, label, sort_order, is_active)
       values ($1, $2, $3, true)
       on conflict (label) do update
       set sort_order = excluded.sort_order,
           is_active = true,
           updated_at = now()`,
      [typeId, type.type, typeIndex],
    );

    for (const [subtypeIndex, subtype] of type.subtypes.entries()) {
      await client.query(
        `insert into inquiry_subtypes
           (id, type_id, label, placeholder, sort_order, is_active)
         values ($1, $2, $3, $4, $5, true)
         on conflict (type_id, label) do update
         set placeholder = excluded.placeholder,
             sort_order = excluded.sort_order,
             is_active = true,
             updated_at = now()`,
        [
          stableUuid(`inquiry-subtype:${type.type}:${subtype.label}`),
          typeId,
          subtype.label,
          subtype.placeholder,
          subtypeIndex,
        ],
      );
    }
  }

  for (const [sortOrder, item] of selectedWork.entries()) {
    await client.query(
      `insert into work_items
         (id, sort_order, is_published, client, title, category, accent,
          summary, challenge, solution, results)
       values ($1, $2, true, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
       on conflict (id) do update
       set sort_order = excluded.sort_order,
           is_published = true,
           client = excluded.client,
           title = excluded.title,
           category = excluded.category,
           accent = excluded.accent,
           summary = excluded.summary,
           challenge = excluded.challenge,
           solution = excluded.solution,
           results = excluded.results,
           updated_at = now()`,
      [
        stableUuid(`work:${item.title}`),
        sortOrder,
        item.client,
        item.title,
        item.category,
        item.accent,
        item.summary,
        item.challenge,
        item.solution,
        JSON.stringify(item.results),
      ],
    );
  }

  for (const [sortOrder, item] of insights.entries()) {
    const slug = `insight-${sortOrder + 1}`;
    await client.query(
      `insert into insights
         (id, sort_order, is_published, tag, title, date, accent, excerpt,
          body, slug, inquiry_type, inquiry_subtype)
       values ($1, $2, true, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
       on conflict (slug) do update
       set sort_order = excluded.sort_order,
           is_published = true,
           tag = excluded.tag,
           title = excluded.title,
           date = excluded.date,
           accent = excluded.accent,
           excerpt = excluded.excerpt,
           body = excluded.body,
           inquiry_type = excluded.inquiry_type,
           inquiry_subtype = excluded.inquiry_subtype,
           updated_at = now()`,
      [
        stableUuid(`insight:${slug}`),
        sortOrder,
        item.tag,
        item.title,
        item.date,
        item.accent,
        item.excerpt,
        JSON.stringify(item.body),
        slug,
        item.inquiry.type,
        item.inquiry.subtype,
      ],
    );
  }

  for (const [sortOrder, item] of testimonials.entries()) {
    const id = stableUuid(`testimonial:${item.author}:${item.program}`);
    await client.query(
      `insert into testimonials
         (id, sort_order, is_published, quote, author, program, result)
       values ($1, $2, true, $3, $4, $5, $6)
       on conflict (id) do update
       set sort_order = excluded.sort_order,
           is_published = true,
           quote = excluded.quote,
           author = excluded.author,
           program = excluded.program,
           result = excluded.result,
           updated_at = now()`,
      [id, sortOrder, item.quote, item.author, item.program, item.result],
    );
  }

  for (const [sortOrder, item] of experts.entries()) {
    const id = stableUuid(`expert:${item.name}`);
    await client.query(
      `insert into experts
         (id, sort_order, is_published, name, role, quote, tags, accent, image_url)
       values ($1, $2, true, $3, $4, $5, $6::jsonb, $7, $8)
       on conflict (id) do update
       set sort_order = excluded.sort_order,
           is_published = true,
           name = excluded.name,
           role = excluded.role,
           quote = excluded.quote,
           tags = excluded.tags,
           accent = excluded.accent,
           image_url = excluded.image_url,
           updated_at = now()`,
      [
        id,
        sortOrder,
        item.name,
        item.role,
        item.quote,
        JSON.stringify(item.tags),
        item.accent,
        item.image ?? null,
      ],
    );
  }

  for (const [sortOrder, item] of stats.entries()) {
    const id = stableUuid(`stat:${item.label}`);
    await client.query(
      `insert into stats
         (id, sort_order, is_published, value, suffix, label)
       values ($1, $2, true, $3, $4, $5)
       on conflict (id) do update
       set sort_order = excluded.sort_order,
           is_published = true,
           value = excluded.value,
           suffix = excluded.suffix,
           label = excluded.label,
           updated_at = now()`,
      [id, sortOrder, item.value, item.suffix, item.label],
    );
  }

  await client.query("commit");
  console.info("Neon seed completed");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
