/**
 * CMS data-access seam (docs/어드민기획.md §11.7, §11.8).
 *
 * Admin content screens call `getContentData().<collection>` — never Supabase
 * directly. Today every collection is a generic in-memory repo over the mock
 * seed; on wiring day we add Supabase-backed repos and swap them in here, with
 * no screen changes. Public sections still read src/lib/site.ts for now; moving
 * them onto this seam happens together with the DB wiring.
 */

import {
  mockEducationCases,
  mockEducationFaqs,
  mockEducationImages,
  mockEducationOutputs,
  mockEducationPrograms,
  mockEducationSettings,
  mockExperts,
  mockInsights,
  mockProgramInstructorLinks,
  mockStats,
  mockTestimonials,
  mockVibedaysRoles,
  mockWork,
} from "./mock-content";
import type {
  ContentBase,
  EducationCase,
  EducationFaq,
  EducationImage,
  EducationImageInput,
  EducationImageOwner,
  EducationOutput,
  EducationPageSettings,
  EducationProgram,
  Expert,
  Insight,
  Stat,
  Testimonial,
  VibedaysRole,
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

/** Polymorphic image-gallery repo (Education §24) — not ContentBase-shaped. */
export interface EducationImagesRepo {
  listByOwner(ownerType: EducationImageOwner, ownerId: string): Promise<EducationImage[]>;
  create(input: EducationImageInput): Promise<EducationImage>;
  update(id: string, patch: Partial<EducationImageInput>): Promise<EducationImage>;
  remove(id: string): Promise<void>;
}

/** Singleton Education page settings repo (Education §27.1). */
export interface EducationSettingsRepo {
  get(): Promise<EducationPageSettings>;
  update(patch: Partial<EducationPageSettings>): Promise<EducationPageSettings>;
}

export interface EducationContentData {
  programs: ContentRepo<EducationProgram>;
  outputs: ContentRepo<EducationOutput>;
  cases: ContentRepo<EducationCase>;
  faqs: ContentRepo<EducationFaq>;
  vibedaysRoles: ContentRepo<VibedaysRole>;
  images: EducationImagesRepo;
  settings: EducationSettingsRepo;
}

export interface ContentData {
  work: ContentRepo<WorkItem>;
  insights: ContentRepo<Insight>;
  testimonials: ContentRepo<Testimonial>;
  experts: ContentRepo<Expert>;
  stats: ContentRepo<Stat>;
  education: EducationContentData;
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

/**
 * Programs need the base CRUD plus the Program ↔ Instructor junction
 * (§28 — relational, not a column) layered on top, so it wraps a MockRepo
 * instead of extending it directly.
 */
class MockEducationProgramsRepo implements ContentRepo<EducationProgram> {
  private base = new MockRepo<EducationProgram>(mockEducationPrograms, "edu_program");

  private linksFor(programId: string): string[] {
    return mockProgramInstructorLinks
      .filter((l) => l.programId === programId)
      .map((l) => l.expertId);
  }

  private setLinks(programId: string, expertIds: string[]) {
    for (let i = mockProgramInstructorLinks.length - 1; i >= 0; i--) {
      if (mockProgramInstructorLinks[i].programId === programId) {
        mockProgramInstructorLinks.splice(i, 1);
      }
    }
    for (const expertId of expertIds) {
      mockProgramInstructorLinks.push({ programId, expertId });
    }
  }

  async list(): Promise<EducationProgram[]> {
    const rows = await this.base.list();
    return rows.map((r) => ({ ...r, instructorIds: this.linksFor(r.id) }));
  }

  async get(id: string): Promise<EducationProgram | null> {
    const row = await this.base.get(id);
    return row ? { ...row, instructorIds: this.linksFor(row.id) } : null;
  }

  async create(
    input: Omit<EducationProgram, "id" | "sortOrder">,
  ): Promise<EducationProgram> {
    const { instructorIds, ...rest } = input;
    const row = await this.base.create({ ...rest, instructorIds: [] });
    this.setLinks(row.id, instructorIds ?? []);
    return { ...row, instructorIds: instructorIds ?? [] };
  }

  async update(
    id: string,
    patch: Partial<Omit<EducationProgram, "id">>,
  ): Promise<EducationProgram> {
    const { instructorIds, ...rest } = patch;
    const row = await this.base.update(id, rest);
    if (instructorIds !== undefined) this.setLinks(id, instructorIds);
    return { ...row, instructorIds: this.linksFor(id) };
  }

  async remove(id: string): Promise<void> {
    await this.base.remove(id);
    this.setLinks(id, []);
  }
}

class MockEducationImagesRepo implements EducationImagesRepo {
  async listByOwner(
    ownerType: EducationImageOwner,
    ownerId: string,
  ): Promise<EducationImage[]> {
    return mockEducationImages
      .filter((img) => img.ownerType === ownerType && img.ownerId === ownerId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async create(input: EducationImageInput): Promise<EducationImage> {
    const row: EducationImage = { ...input, id: `edu_image_${Date.now()}` };
    mockEducationImages.push(row);
    return row;
  }

  async update(
    id: string,
    patch: Partial<EducationImageInput>,
  ): Promise<EducationImage> {
    const row = mockEducationImages.find((img) => img.id === id);
    if (!row) throw new Error(`education image not found: ${id}`);
    Object.assign(row, patch);
    return row;
  }

  async remove(id: string): Promise<void> {
    const idx = mockEducationImages.findIndex((img) => img.id === id);
    if (idx >= 0) mockEducationImages.splice(idx, 1);
  }
}

class MockEducationSettingsRepo implements EducationSettingsRepo {
  async get(): Promise<EducationPageSettings> {
    return { ...mockEducationSettings, sections: { ...mockEducationSettings.sections } };
  }

  async update(patch: Partial<EducationPageSettings>): Promise<EducationPageSettings> {
    Object.assign(mockEducationSettings, patch);
    return this.get();
  }
}

const data: ContentData = {
  work: new MockRepo(mockWork, "work"),
  insights: new MockRepo(mockInsights, "insight"),
  testimonials: new MockRepo(mockTestimonials, "testimonial"),
  experts: new MockRepo(mockExperts, "expert"),
  stats: new MockRepo(mockStats, "stat"),
  education: {
    programs: new MockEducationProgramsRepo(),
    outputs: new MockRepo(mockEducationOutputs, "edu_output"),
    cases: new MockRepo(mockEducationCases, "edu_case"),
    faqs: new MockRepo(mockEducationFaqs, "edu_faq"),
    vibedaysRoles: new MockRepo(mockVibedaysRoles, "vibedays_role"),
    images: new MockEducationImagesRepo(),
    settings: new MockEducationSettingsRepo(),
  },
};

/**
 * Single accessor. Uses Supabase-backed repos when the project is configured,
 * else the in-memory mock so the app still runs without a DB.
 */
export function getContentData(): ContentData {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("./supabase-content") as typeof import("./supabase-content"))
      .supabaseContentData;
  }
  return data;
}
