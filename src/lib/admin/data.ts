/**
 * Admin data-access seam (docs/어드민기획.md §11.8).
 *
 * Every admin screen and server action talks to this interface — never to
 * a database adapter directly. Neon and the explicit development mock satisfy
 * the same frozen interface, so screens do not change with runtime mode.
 */

import { mockInquiries } from "./mock-data";
import { resolveAdminDataMode } from "./runtime-mode";
import type {
  Inquiry,
  InquiryFilter,
  InquiryDeliveryPatch,
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
  createInquiry(
    input: NewInquiry,
    submissionKey: string,
  ): Promise<{ inquiry: Inquiry; created: boolean }>;
  findInquiryBySubmissionKey(key: string): Promise<Inquiry | null>;
  updateInquiryDelivery(
    id: string,
    patch: InquiryDeliveryPatch,
  ): Promise<Inquiry>;
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

  async createInquiry(
    input: NewInquiry,
    submissionKey: string,
  ): Promise<{ inquiry: Inquiry; created: boolean }> {
    const existing = await this.findInquiryBySubmissionKey(submissionKey);
    if (existing) return { inquiry: existing, created: false };
    const now = new Date().toISOString();
    const created: Inquiry = {
      id: `inq_${Date.now()}`,
      submissionKey,
      ...input,
      status: "new",
      memo: "",
      emailStatus: "pending",
      emailMessageId: null,
      emailSentAt: null,
      emailError: null,
      linearStatus: "pending",
      linearIssueId: null,
      linearIssueUrl: null,
      linearError: null,
      createdAt: now,
      updatedAt: now,
    };
    mockInquiries.unshift(created);
    return { inquiry: created, created: true };
  }

  async findInquiryBySubmissionKey(key: string): Promise<Inquiry | null> {
    return mockInquiries.find((inquiry) => inquiry.submissionKey === key) ?? null;
  }

  async updateInquiryDelivery(
    id: string,
    patch: InquiryDeliveryPatch,
  ): Promise<Inquiry> {
    const found = mockInquiries.find((inquiry) => inquiry.id === id);
    if (!found) throw new Error(`inquiry not found: ${id}`);
    Object.assign(found, patch, {
      ...(patch.emailStatus === "sent" && patch.emailSentAt === undefined
        ? { emailSentAt: new Date().toISOString() }
        : {}),
      updatedAt: new Date().toISOString(),
    });
    return found;
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

/**
 * Single accessor. Uses the Neon adapter when the project is configured
 * (env present). The in-memory mock is available only through the explicit,
 * non-production ADMIN_DEV_BYPASS=true flag. The Neon module is imported
 * lazily to keep `server-only` out of any accidental client path.
 */
export function getAdminData(): AdminDataSource {
  const mode = resolveAdminDataMode();
  if (mode === "neon") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("./neon-data") as typeof import("./neon-data"))
      .neonAdminData;
  }
  if (mode === "mock") return mock;
  throw new Error("Admin data source is not configured");
}
