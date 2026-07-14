/**
 * Inquiry-form options seam (docs/어드민기획.md §4.2 — inquiry_types/inquiry_subtypes).
 *
 * Two levels: a type (프로젝트/교육/AI 솔루션 문의) holds ordered subtypes, and each
 * subtype carries a `placeholder` (the 문의 내용 예시 문구 that drives the public
 * form UX). Modeled nested here for a natural editing UI; on wiring day it maps
 * to two tables (inquiry_types + inquiry_subtypes, FK). Mock arrays persist in a
 * running dev server. Seeded from src/lib/site.ts `inquiryOptions`.
 */

import { inquiryOptions } from "@/lib/site";
import { resolveAdminDataMode } from "./runtime-mode";

export type InquirySubtypeOption = {
  id: string;
  label: string;
  placeholder: string;
  sortOrder: number;
  isActive: boolean;
};

export type InquiryTypeOption = {
  id: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  subtypes: InquirySubtypeOption[];
};

const mockTypes: InquiryTypeOption[] = inquiryOptions.map((o, i) => ({
  id: `itype_${i + 1}`,
  label: o.type,
  sortOrder: i,
  isActive: true,
  subtypes: o.subtypes.map((s, j) => ({
    id: `isub_${i + 1}_${j + 1}`,
    label: s.label,
    placeholder: s.placeholder,
    sortOrder: j,
    isActive: true,
  })),
}));

export interface InquiryOptionsData {
  listTypes(): Promise<InquiryTypeOption[]>;
  getType(id: string): Promise<InquiryTypeOption | null>;
  createType(input: { label: string; isActive?: boolean }): Promise<InquiryTypeOption>;
  updateType(
    id: string,
    patch: { label?: string; isActive?: boolean },
  ): Promise<InquiryTypeOption>;
  deleteType(id: string): Promise<void>;
  addSubtype(
    typeId: string,
    input: { label: string; placeholder: string },
  ): Promise<InquirySubtypeOption>;
  updateSubtype(
    typeId: string,
    subtypeId: string,
    patch: { label?: string; placeholder?: string; isActive?: boolean },
  ): Promise<InquirySubtypeOption>;
  deleteSubtype(typeId: string, subtypeId: string): Promise<void>;
}

class MockInquiryOptions implements InquiryOptionsData {
  async listTypes(): Promise<InquiryTypeOption[]> {
    return [...mockTypes].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getType(id: string): Promise<InquiryTypeOption | null> {
    return mockTypes.find((t) => t.id === id) ?? null;
  }

  async createType(input: {
    label: string;
    isActive?: boolean;
  }): Promise<InquiryTypeOption> {
    const nextOrder =
      mockTypes.reduce((m, t) => Math.max(m, t.sortOrder), -1) + 1;
    const type: InquiryTypeOption = {
      id: `itype_${Date.now()}`,
      label: input.label,
      sortOrder: nextOrder,
      isActive: input.isActive ?? true,
      subtypes: [],
    };
    mockTypes.push(type);
    return type;
  }

  async updateType(
    id: string,
    patch: { label?: string; isActive?: boolean },
  ): Promise<InquiryTypeOption> {
    const type = mockTypes.find((t) => t.id === id);
    if (!type) throw new Error(`inquiry type not found: ${id}`);
    Object.assign(type, patch);
    return type;
  }

  async deleteType(id: string): Promise<void> {
    const idx = mockTypes.findIndex((t) => t.id === id);
    if (idx >= 0) mockTypes.splice(idx, 1);
  }

  private requireType(typeId: string): InquiryTypeOption {
    const type = mockTypes.find((t) => t.id === typeId);
    if (!type) throw new Error(`inquiry type not found: ${typeId}`);
    return type;
  }

  async addSubtype(
    typeId: string,
    input: { label: string; placeholder: string },
  ): Promise<InquirySubtypeOption> {
    const type = this.requireType(typeId);
    const nextOrder =
      type.subtypes.reduce((m, s) => Math.max(m, s.sortOrder), -1) + 1;
    const sub: InquirySubtypeOption = {
      id: `isub_${Date.now()}`,
      label: input.label,
      placeholder: input.placeholder,
      sortOrder: nextOrder,
      isActive: true,
    };
    type.subtypes.push(sub);
    return sub;
  }

  async updateSubtype(
    typeId: string,
    subtypeId: string,
    patch: { label?: string; placeholder?: string; isActive?: boolean },
  ): Promise<InquirySubtypeOption> {
    const type = this.requireType(typeId);
    const sub = type.subtypes.find((s) => s.id === subtypeId);
    if (!sub) throw new Error(`inquiry subtype not found: ${subtypeId}`);
    Object.assign(sub, patch);
    return sub;
  }

  async deleteSubtype(typeId: string, subtypeId: string): Promise<void> {
    const type = this.requireType(typeId);
    const idx = type.subtypes.findIndex((s) => s.id === subtypeId);
    if (idx >= 0) type.subtypes.splice(idx, 1);
  }
}

const data = new MockInquiryOptions();

/**
 * Single accessor. Neon is the configured runtime; the in-memory mock is available
 * only through the explicit non-production ADMIN_DEV_BYPASS=true mode.
 */
export function getInquiryOptionsData(): InquiryOptionsData {
  const mode = resolveAdminDataMode();
  if (mode === "neon") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./neon-inquiry-options") as typeof import("./neon-inquiry-options");
    return mod.neonInquiryOptions;
  }
  if (mode === "mock") return data;
  throw new Error("Admin data source is not configured");
}
