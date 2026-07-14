import "server-only";

import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { getDb } from "@/lib/db";
import { inquiries } from "@/lib/db/schema";

import type { AdminDataSource } from "./data";
import { toInquiry } from "./neon-mappers";
import type {
  Inquiry,
  InquiryDeliveryPatch,
  InquiryFilter,
  InquiryStats,
  InquiryStatus,
  NewInquiry,
} from "./types";

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

class NeonAdminData implements AdminDataSource {
  async listInquiries(filter: InquiryFilter = {}): Promise<Inquiry[]> {
    const conditions: SQL[] = [];
    if (filter.status) conditions.push(eq(inquiries.status, filter.status));
    if (filter.type) conditions.push(eq(inquiries.type, filter.type));

    const query = filter.query?.trim();
    if (query) {
      const pattern = `%${escapeLike(query)}%`;
      conditions.push(
        or(
          ilike(inquiries.sender, pattern),
          ilike(inquiries.message, pattern),
        )!,
      );
    }

    const rows = await getDb()
      .select()
      .from(inquiries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(inquiries.createdAt));

    return rows.map(toInquiry);
  }

  async getInquiry(id: string): Promise<Inquiry | null> {
    const [row] = await getDb()
      .select()
      .from(inquiries)
      .where(eq(inquiries.id, id))
      .limit(1);
    return row ? toInquiry(row) : null;
  }

  async updateInquiry(
    id: string,
    patch: { status?: InquiryStatus; memo?: string },
  ): Promise<Inquiry> {
    const update: { status?: string; memo?: string } = {};
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.memo !== undefined) update.memo = patch.memo;

    if (Object.keys(update).length === 0) {
      const existing = await this.getInquiry(id);
      if (!existing) throw new Error(`inquiry not found: ${id}`);
      return existing;
    }

    const [row] = await getDb()
      .update(inquiries)
      .set(update)
      .where(eq(inquiries.id, id))
      .returning();
    if (!row) throw new Error(`inquiry not found: ${id}`);
    return toInquiry(row);
  }

  async createInquiry(
    input: NewInquiry,
    submissionKey: string,
  ): Promise<{ inquiry: Inquiry; created: boolean }> {
    const [row] = await getDb()
      .insert(inquiries)
      .values({
        submissionKey,
        type: input.type,
        subtype: input.subtype,
        sender: input.sender,
        contact: input.contact,
        message: input.message,
      })
      .onConflictDoNothing({ target: inquiries.submissionKey })
      .returning();
    if (row) return { inquiry: toInquiry(row), created: true };

    const existing = await this.findInquiryBySubmissionKey(submissionKey);
    if (!existing) throw new Error("inquiry idempotency conflict");
    return { inquiry: existing, created: false };
  }

  async findInquiryBySubmissionKey(key: string): Promise<Inquiry | null> {
    const [row] = await getDb()
      .select()
      .from(inquiries)
      .where(eq(inquiries.submissionKey, key))
      .limit(1);
    return row ? toInquiry(row) : null;
  }

  async updateInquiryDelivery(
    id: string,
    patch: InquiryDeliveryPatch,
  ): Promise<Inquiry> {
    const { emailSentAt, ...rest } = patch;
    const resolvedEmailSentAt =
      emailSentAt !== undefined
        ? emailSentAt
        : patch.emailStatus === "sent"
          ? new Date().toISOString()
          : undefined;
    const [row] = await getDb()
      .update(inquiries)
      .set({
        ...rest,
        ...(resolvedEmailSentAt !== undefined
          ? {
              emailSentAt: resolvedEmailSentAt
                ? new Date(resolvedEmailSentAt)
                : null,
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(inquiries.id, id))
      .returning();
    if (!row) throw new Error(`inquiry not found: ${id}`);
    return toInquiry(row);
  }

  async getInquiryStats(): Promise<InquiryStats> {
    const now = new Date();
    const localMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const [row] = await getDb()
      .select({
        total: count(),
        newCount: sql<number>`count(*) filter (where ${inquiries.status} = 'new')`,
        inProgressCount: sql<number>`count(*) filter (where ${inquiries.status} = 'in_progress')`,
        doneCount: sql<number>`count(*) filter (where ${inquiries.status} = 'done')`,
        todayCount: count(
          sql`case when ${gte(inquiries.createdAt, localMidnight)} then 1 end`,
        ),
      })
      .from(inquiries);

    return {
      total: Number(row.total),
      new: Number(row.newCount),
      in_progress: Number(row.inProgressCount),
      done: Number(row.doneCount),
      today: Number(row.todayCount),
    };
  }
}

export const neonAdminData: AdminDataSource = new NeonAdminData();
