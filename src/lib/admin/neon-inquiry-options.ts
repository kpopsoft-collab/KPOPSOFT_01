import "server-only";

import { and, asc, eq, max } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { inquirySubtypes, inquiryTypes } from "@/lib/db/schema";

import type {
  InquiryOptionsData,
  InquirySubtypeOption,
  InquiryTypeOption,
} from "./inquiry-options";
import {
  toInquirySubtypeOption,
  toInquiryTypeOption,
} from "./neon-mappers";

class NeonInquiryOptions implements InquiryOptionsData {
  async listTypes(): Promise<InquiryTypeOption[]> {
    const [types, subtypes] = await Promise.all([
      getDb().select().from(inquiryTypes).orderBy(asc(inquiryTypes.sortOrder)),
      getDb()
        .select()
        .from(inquirySubtypes)
        .orderBy(asc(inquirySubtypes.sortOrder)),
    ]);
    return types.map((type) => toInquiryTypeOption(type, subtypes));
  }

  async getType(id: string): Promise<InquiryTypeOption | null> {
    const [type] = await getDb()
      .select()
      .from(inquiryTypes)
      .where(eq(inquiryTypes.id, id))
      .limit(1);
    if (!type) return null;

    const subtypes = await getDb()
      .select()
      .from(inquirySubtypes)
      .where(eq(inquirySubtypes.typeId, id))
      .orderBy(asc(inquirySubtypes.sortOrder));
    return toInquiryTypeOption(type, subtypes);
  }

  async createType(input: {
    label: string;
    isActive?: boolean;
  }): Promise<InquiryTypeOption> {
    const [top] = await getDb()
      .select({ value: max(inquiryTypes.sortOrder) })
      .from(inquiryTypes);
    const [row] = await getDb()
      .insert(inquiryTypes)
      .values({
        label: input.label,
        isActive: input.isActive ?? true,
        sortOrder: (top.value ?? -1) + 1,
      })
      .returning();
    return toInquiryTypeOption(row, []);
  }

  async updateType(
    id: string,
    patch: { label?: string; isActive?: boolean },
  ): Promise<InquiryTypeOption> {
    const update: { label?: string; isActive?: boolean } = {};
    if (patch.label !== undefined) update.label = patch.label;
    if (patch.isActive !== undefined) update.isActive = patch.isActive;

    if (Object.keys(update).length > 0) {
      const [row] = await getDb()
        .update(inquiryTypes)
        .set(update)
        .where(eq(inquiryTypes.id, id))
        .returning({ id: inquiryTypes.id });
      if (!row) throw new Error(`inquiry type not found: ${id}`);
    }

    const type = await this.getType(id);
    if (!type) throw new Error(`inquiry type not found: ${id}`);
    return type;
  }

  async deleteType(id: string): Promise<void> {
    await getDb().delete(inquiryTypes).where(eq(inquiryTypes.id, id));
  }

  async addSubtype(
    typeId: string,
    input: { label: string; placeholder: string },
  ): Promise<InquirySubtypeOption> {
    const [top] = await getDb()
      .select({ value: max(inquirySubtypes.sortOrder) })
      .from(inquirySubtypes)
      .where(eq(inquirySubtypes.typeId, typeId));
    const [row] = await getDb()
      .insert(inquirySubtypes)
      .values({
        typeId,
        label: input.label,
        placeholder: input.placeholder,
        sortOrder: (top.value ?? -1) + 1,
      })
      .returning();
    return toInquirySubtypeOption(row);
  }

  async updateSubtype(
    typeId: string,
    subtypeId: string,
    patch: { label?: string; placeholder?: string; isActive?: boolean },
  ): Promise<InquirySubtypeOption> {
    const update: {
      label?: string;
      placeholder?: string;
      isActive?: boolean;
    } = {};
    if (patch.label !== undefined) update.label = patch.label;
    if (patch.placeholder !== undefined) update.placeholder = patch.placeholder;
    if (patch.isActive !== undefined) update.isActive = patch.isActive;

    const [row] = await getDb()
      .update(inquirySubtypes)
      .set(update)
      .where(
        and(
          eq(inquirySubtypes.id, subtypeId),
          eq(inquirySubtypes.typeId, typeId),
        ),
      )
      .returning();
    if (!row) throw new Error(`inquiry subtype not found: ${subtypeId}`);
    return toInquirySubtypeOption(row);
  }

  async deleteSubtype(typeId: string, subtypeId: string): Promise<void> {
    await getDb()
      .delete(inquirySubtypes)
      .where(
        and(
          eq(inquirySubtypes.id, subtypeId),
          eq(inquirySubtypes.typeId, typeId),
        ),
      );
  }
}

export const neonInquiryOptions: InquiryOptionsData =
  new NeonInquiryOptions();
