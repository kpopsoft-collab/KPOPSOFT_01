import "server-only";

import { getDb } from "@/lib/db";
import { assertAdmin } from "./auth";
import type { AdminDataSource } from "./data";
import type {
  Inquiry,
  InquiryFilter,
  InquiryStats,
  InquiryStatus,
  NewInquiry,
} from "./types";

type InquiryRow = {
  id: string;
  type: string;
  subtype: string;
  sender: string;
  contact: string;
  message: string;
  status: string;
  memo: string;
  createdAt: Date;
  updatedAt: Date;
};

function mapRow(row: InquiryRow): Inquiry {
  return {
    id: row.id,
    type: row.type,
    subtype: row.subtype,
    sender: row.sender,
    contact: row.contact,
    message: row.message,
    status: row.status as InquiryStatus,
    memo: row.memo ?? "",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Prisma(Neon) 기반 문의 데이터 — supabase-data.ts를 대체한다.
 *
 * 조회·수정은 관리자만(`assertAdmin`, 예전 RLS `is_admin()` 자리).
 * `createInquiry`만 예외 — 공개 문의 폼이 익명으로 부른다. 입력 검증·허니팟은
 * 호출부(서버 액션)에서 이미 끝난다.
 */
class PrismaAdminData implements AdminDataSource {
  async listInquiries(filter: InquiryFilter = {}): Promise<Inquiry[]> {
    await assertAdmin();
    const q = filter.query?.trim();
    const rows = await getDb().inquiry.findMany({
      where: {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.type ? { type: filter.type } : {}),
        ...(q
          ? {
              OR: [
                { sender: { contains: q, mode: "insensitive" } },
                { message: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapRow);
  }

  async getInquiry(id: string): Promise<Inquiry | null> {
    await assertAdmin();
    const row = await getDb().inquiry.findUnique({ where: { id } });
    return row ? mapRow(row) : null;
  }

  async updateInquiry(
    id: string,
    patch: { status?: InquiryStatus; memo?: string },
  ): Promise<Inquiry> {
    await assertAdmin();
    const row = await getDb().inquiry.update({
      where: { id },
      data: { status: patch.status, memo: patch.memo },
    });
    return mapRow(row);
  }

  async createInquiry(input: NewInquiry): Promise<Inquiry> {
    const row = await getDb().inquiry.create({
      data: {
        type: input.type,
        subtype: input.subtype,
        sender: input.sender,
        contact: input.contact,
        message: input.message,
      },
    });
    return mapRow(row);
  }

  async getInquiryStats(): Promise<InquiryStats> {
    await assertAdmin();
    const rows = await getDb().inquiry.findMany({
      select: { status: true, createdAt: true },
    });
    return {
      total: rows.length,
      new: rows.filter((r) => r.status === "new").length,
      in_progress: rows.filter((r) => r.status === "in_progress").length,
      done: rows.filter((r) => r.status === "done").length,
      today: rows.filter((r) => isToday(r.createdAt)).length,
    };
  }
}

export const prismaAdminData = new PrismaAdminData();
