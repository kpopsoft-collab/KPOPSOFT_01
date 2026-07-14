/**
 * CMS data-access seam (docs/어드민기획.md §11.7, §11.8).
 *
 * Admin content screens call `getContentData().<collection>` — never Supabase
 * directly. Today every collection is a generic in-memory repo over the mock
 * seed. Neon-backed repos now satisfy the same interface, while the explicit
 * development bypass keeps the in-memory implementation available for local UI work.
 */

import {
  mockExperts,
  mockInsights,
  mockStats,
  mockTestimonials,
  mockWork,
} from "./mock-content";
import { resolveAdminDataMode } from "./runtime-mode";
import type {
  ContentBase,
  Expert,
  Insight,
  Stat,
  Testimonial,
  WorkItem,
} from "./content-types";

export interface ContentRepo<T extends ContentBase> {
  /** All rows, ascending by sortOrder. */
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  /** Create a row; id + sortOrder are assigned automatically. */
  create(input: Omit<T, "id" | "sortOrder">): Promise<T>;
  update(id: string, patch: Partial<Omit<T, "id">>): Promise<T>;
  remove(id: string): Promise<void>;
}

export interface ContentData {
  work: ContentRepo<WorkItem>;
  insights: ContentRepo<Insight>;
  testimonials: ContentRepo<Testimonial>;
  experts: ContentRepo<Expert>;
  stats: ContentRepo<Stat>;
}

/** Generic mock repo over a module-level array. */
class MockRepo<T extends ContentBase> implements ContentRepo<T> {
  constructor(
    private rows: T[],
    private prefix: string,
  ) {}

  async list(): Promise<T[]> {
    return [...this.rows].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async get(id: string): Promise<T | null> {
    return this.rows.find((r) => r.id === id) ?? null;
  }

  async create(input: Omit<T, "id" | "sortOrder">): Promise<T> {
    const nextOrder = this.rows.reduce((m, r) => Math.max(m, r.sortOrder), -1) + 1;
    const row = {
      ...(input as object),
      id: `${this.prefix}_${Date.now()}`,
      sortOrder: nextOrder,
    } as T;
    this.rows.push(row);
    return row;
  }

  async update(id: string, patch: Partial<Omit<T, "id">>): Promise<T> {
    const row = this.rows.find((r) => r.id === id);
    if (!row) throw new Error(`${this.prefix} not found: ${id}`);
    Object.assign(row, patch);
    return row;
  }

  async remove(id: string): Promise<void> {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx >= 0) this.rows.splice(idx, 1);
  }
}

const data: ContentData = {
  work: new MockRepo(mockWork, "work"),
  insights: new MockRepo(mockInsights, "insight"),
  testimonials: new MockRepo(mockTestimonials, "testimonial"),
  experts: new MockRepo(mockExperts, "expert"),
  stats: new MockRepo(mockStats, "stat"),
};

/**
 * Single accessor. Neon is the configured runtime; the in-memory mock is available
 * only through the explicit non-production ADMIN_DEV_BYPASS=true mode.
 */
export function getContentData(): ContentData {
  const mode = resolveAdminDataMode();
  if (mode === "neon") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("./neon-content") as typeof import("./neon-content"))
      .neonContentData;
  }
  if (mode === "mock") return data;
  throw new Error("Admin data source is not configured");
}
