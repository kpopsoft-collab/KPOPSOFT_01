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
  mockEducationClubCohorts,
  mockEducationClubTiers,
  mockEducationFaqs,
  mockEducationPastProgramImages,
  mockEducationPastPrograms,
  mockEducationRegularClasses,
  mockEducationReviews,
  mockEducationStats,
  mockExperts,
  mockHomePillarExamples,
  mockHomePillars,
  mockOrgTraining,
  mockStats,
  mockWork,
} from "./mock-content";
import type {
  ContentBase,
  EducationClubCohort,
  EducationClubTier,
  EducationFaq,
  EducationOrgTraining,
  EducationPastProgram,
  EducationPastProgramImage,
  EducationPastProgramImageInput,
  EducationRegularClass,
  EducationReview,
  EducationStat,
  Expert,
  HomePillar,
  HomePillarExample,
  Stat,
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

/** 지난 프로그램 갤러리 — 부모에 딸린 목록이라 ContentBase 모양이 아니다. */
export interface EducationPastProgramImagesRepo {
  listByProgram(programId: string): Promise<EducationPastProgramImage[]>;
  create(input: EducationPastProgramImageInput): Promise<EducationPastProgramImage>;
  update(
    id: string,
    patch: Partial<EducationPastProgramImageInput>,
  ): Promise<EducationPastProgramImage>;
  remove(id: string): Promise<void>;
}

/** 조직·기업 맞춤 교육 — 상품이 하나뿐이라 목록이 아니라 싱글턴이다. */
export interface EducationOrgTrainingRepo {
  get(): Promise<EducationOrgTraining>;
  update(patch: Partial<EducationOrgTraining>): Promise<EducationOrgTraining>;
}

export interface EducationContentData {
  regularClasses: ContentRepo<EducationRegularClass>;
  orgTraining: EducationOrgTrainingRepo;
  clubCohorts: ContentRepo<EducationClubCohort>;
  clubTiers: ContentRepo<EducationClubTier>;
  pastPrograms: ContentRepo<EducationPastProgram>;
  pastProgramImages: EducationPastProgramImagesRepo;
  reviews: ContentRepo<EducationReview>;
  faqs: ContentRepo<EducationFaq>;
  /** 교육 성과 수치 — 홈 `stats`와 다른 항목이라 테이블도 다르다. */
  stats: ContentRepo<EducationStat>;
}

export interface ContentData {
  work: ContentRepo<WorkItem>;
  /** 핵심 비즈니스 카드 3장. */
  pillars: ContentRepo<HomePillar>;
  /** 카드를 누르면 열리는 사례 슬라이드. */
  pillarExamples: ContentRepo<HomePillarExample>;
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

class MockPastProgramImagesRepo implements EducationPastProgramImagesRepo {
  async listByProgram(programId: string): Promise<EducationPastProgramImage[]> {
    return mockEducationPastProgramImages
      .filter((img) => img.programId === programId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async create(input: EducationPastProgramImageInput): Promise<EducationPastProgramImage> {
    const row: EducationPastProgramImage = { ...input, id: `edu_past_image_${Date.now()}` };
    mockEducationPastProgramImages.push(row);
    return row;
  }

  async update(
    id: string,
    patch: Partial<EducationPastProgramImageInput>,
  ): Promise<EducationPastProgramImage> {
    const row = mockEducationPastProgramImages.find((img) => img.id === id);
    if (!row) throw new Error(`past program image not found: ${id}`);
    Object.assign(row, patch);
    return row;
  }

  async remove(id: string): Promise<void> {
    const idx = mockEducationPastProgramImages.findIndex((img) => img.id === id);
    if (idx >= 0) mockEducationPastProgramImages.splice(idx, 1);
  }
}

class MockOrgTrainingRepo implements EducationOrgTrainingRepo {
  async get(): Promise<EducationOrgTraining> {
    return { ...mockOrgTraining };
  }

  async update(patch: Partial<EducationOrgTraining>): Promise<EducationOrgTraining> {
    Object.assign(mockOrgTraining, patch);
    return this.get();
  }
}

const data: ContentData = {
  work: new MockRepo(mockWork, "work"),
  pillars: new MockRepo(mockHomePillars, "pillar"),
  pillarExamples: new MockRepo(mockHomePillarExamples, "pillar_example"),
  experts: new MockRepo(mockExperts, "expert"),
  stats: new MockRepo(mockStats, "stat"),
  education: {
    regularClasses: new MockRepo(mockEducationRegularClasses, "edu_class"),
    orgTraining: new MockOrgTrainingRepo(),
    clubCohorts: new MockRepo(mockEducationClubCohorts, "edu_cohort"),
    clubTiers: new MockRepo(mockEducationClubTiers, "edu_tier"),
    pastPrograms: new MockRepo(mockEducationPastPrograms, "edu_past"),
    pastProgramImages: new MockPastProgramImagesRepo(),
    reviews: new MockRepo(mockEducationReviews, "edu_review"),
    faqs: new MockRepo(mockEducationFaqs, "edu_faq"),
    stats: new MockRepo(mockEducationStats, "edu_stat"),
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
