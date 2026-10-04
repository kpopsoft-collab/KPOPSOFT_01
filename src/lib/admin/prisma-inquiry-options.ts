import "server-only";

import { getDb } from "@/lib/db";
import { assertAdmin } from "./auth";
import type {
  InquiryOptionsData,
  InquirySubtypeOption,
  InquiryTypeOption,
} from "./inquiry-options";

/**
 * Prisma(Neon) 기반 문의 폼 옵션 — supabase-inquiry-options.ts를 대체한다.
 * inquiry_types 1-N inquiry_subtypes. 어드민 전용이라 모든 메서드가 관리자를
 * 확인한다(공개 폼은 public-content.ts가 따로 읽는다).
 */

type SubRow = {
  id: string;
  label: string;
  placeholder: string;
  sortOrder: number;
  isActive: boolean;
};
type TypeRow = {
  id: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  subtypes?: SubRow[];
};

function mapSub(r: SubRow): InquirySubtypeOption {
  return {
    id: r.id,
    label: r.label,
    placeholder: r.placeholder,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
  };
}

function mapType(r: TypeRow): InquiryTypeOption {
  return {
    id: r.id,
    label: r.label,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
    subtypes: (r.subtypes ?? []).map(mapSub),
  };
}

const withSubtypes = { subtypes: { orderBy: { sortOrder: "asc" as const } } };

class PrismaInquiryOptions implements InquiryOptionsData {
  async listTypes(): Promise<InquiryTypeOption[]> {
    await assertAdmin();
    const rows = await getDb().inquiryType.findMany({
      include: withSubtypes,
      orderBy: { sortOrder: "asc" },
    });
    return rows.map(mapType);
  }

  async getType(id: string): Promise<InquiryTypeOption | null> {
    await assertAdmin();
    const row = await getDb().inquiryType.findUnique({
      where: { id },
      include: withSubtypes,
    });
    return row ? mapType(row) : null;
  }

  async createType(input: {
    label: string;
    isActive?: boolean;
  }): Promise<InquiryTypeOption> {
    await assertAdmin();
    const db = getDb();
    const top = await db.inquiryType.findFirst({
      select: { sortOrder: true },
      orderBy: { sortOrder: "desc" },
    });
    const row = await db.inquiryType.create({
      data: {
        label: input.label,
        isActive: input.isActive ?? true,
        sortOrder: (top?.sortOrder ?? -1) + 1,
      },
    });
    return mapType(row);
  }

  async updateType(
    id: string,
    patch: { label?: string; isActive?: boolean },
  ): Promise<InquiryTypeOption> {
    await assertAdmin();
    const row = await getDb().inquiryType.update({
      where: { id },
      data: { label: patch.label, isActive: patch.isActive },
      include: withSubtypes,
    });
    return mapType(row);
  }

  async deleteType(id: string): Promise<void> {
    await assertAdmin();
    await getDb().inquiryType.deleteMany({ where: { id } });
  }

  async addSubtype(
    typeId: string,
    input: { label: string; placeholder: string },
  ): Promise<InquirySubtypeOption> {
    await assertAdmin();
    const db = getDb();
    const top = await db.inquirySubtype.findFirst({
      where: { typeId },
      select: { sortOrder: true },
      orderBy: { sortOrder: "desc" },
    });
    const row = await db.inquirySubtype.create({
      data: {
        typeId,
        label: input.label,
        placeholder: input.placeholder,
        sortOrder: (top?.sortOrder ?? -1) + 1,
      },
    });
    return mapSub(row);
  }

  async updateSubtype(
    _typeId: string,
    subtypeId: string,
    patch: { label?: string; placeholder?: string; isActive?: boolean },
  ): Promise<InquirySubtypeOption> {
    await assertAdmin();
    const row = await getDb().inquirySubtype.update({
      where: { id: subtypeId },
      data: {
        label: patch.label,
        placeholder: patch.placeholder,
        isActive: patch.isActive,
      },
    });
    return mapSub(row);
  }

  async deleteSubtype(_typeId: string, subtypeId: string): Promise<void> {
    await assertAdmin();
    await getDb().inquirySubtype.deleteMany({ where: { id: subtypeId } });
  }
}

export const prismaInquiryOptions: InquiryOptionsData = new PrismaInquiryOptions();
