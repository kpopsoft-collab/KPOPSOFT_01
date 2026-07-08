/**
 * Admin data-access seam (docs/어드민기획.md §11.8).
 *
 * Every admin screen and server action talks to this interface — never to
 * Supabase directly. Today `getAdminData()` returns the in-memory mock; on
 * wiring day we add a Supabase implementation and swap the one line in
 * `getAdminData()`. The interface stays frozen, so no screen changes.
 */

import { mockInquiries } from "./mock-data";
import type {
  Inquiry,
  InquiryFilter,
  InquiryStats,
  InquiryStatus,
  NewInquiry,
} from "./types";

export interface AdminDataSource {
  listInquiries(filter?: InquiryFilter): Promise<Inquiry[]>;
  getInquiry(id: string): Promise<Inquiry | null>;
  updateInquiry(
    id: string,
    patch: { status?: InquiryStatus; memo?: string },
  ): Promise<Inquiry>;
  createInquiry(input: NewInquiry): Promise<Inquiry>;
  getInquiryStats(): Promise<InquiryStats>;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Mock adapter — reads/mutates the module-level array. */
class MockAdminData implements AdminDataSource {
  async listInquiries(filter: InquiryFilter = {}): Promise<Inquiry[]> {
    const q = filter.query?.trim().toLowerCase();
    return mockInquiries
      .filter((i) => (filter.status ? i.status === filter.status : true))
      .filter((i) => (filter.type ? i.type === filter.type : true))
      .filter((i) =>
        q
          ? i.sender.toLowerCase().includes(q) ||
            i.message.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getInquiry(id: string): Promise<Inquiry | null> {
    return mockInquiries.find((i) => i.id === id) ?? null;
  }

  async updateInquiry(
    id: string,
    patch: { status?: InquiryStatus; memo?: string },
  ): Promise<Inquiry> {
    const found = mockInquiries.find((i) => i.id === id);
    if (!found) throw new Error(`inquiry not found: ${id}`);
    if (patch.status !== undefined) found.status = patch.status;
    if (patch.memo !== undefined) found.memo = patch.memo;
    found.updatedAt = new Date().toISOString();
    return found;
  }

  async createInquiry(input: NewInquiry): Promise<Inquiry> {
    const now = new Date().toISOString();
    const created: Inquiry = {
      id: `inq_${Date.now()}`,
      ...input,
      status: "new",
      memo: "",
      createdAt: now,
      updatedAt: now,
    };
    mockInquiries.unshift(created);
    return created;
  }

  async getInquiryStats(): Promise<InquiryStats> {
    return {
      total: mockInquiries.length,
      new: mockInquiries.filter((i) => i.status === "new").length,
      in_progress: mockInquiries.filter((i) => i.status === "in_progress")
        .length,
      done: mockInquiries.filter((i) => i.status === "done").length,
      today: mockInquiries.filter((i) => isToday(i.createdAt)).length,
    };
  }
}

const mock = new MockAdminData();

/** Single accessor. Swap the return here for the Supabase adapter on wiring day. */
export function getAdminData(): AdminDataSource {
  return mock;
}
