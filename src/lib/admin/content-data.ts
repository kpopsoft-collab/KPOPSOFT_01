/**
 * CMS data-access seam (docs/06-admin/ §11.7, §11.8).
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
  EducationClubCohort,
  EducationClubTier,
  EducationFaq,
  EducationOrgTraining,
  EducationPastProgram,
  EducationPastProgramImage,
  EducationPastProgramImageInput,
  EducationRegularClass,
  EducationRegularClassEdit,
  EducationReview,
  EducationStat,
  Expert,
  HomePillar,
  HomePillarExample,
  OrderedBase,
  Stat,
  WorkItem,
} from "./content-types";

export interface ContentRepo<T extends OrderedBase> {
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

/**
 * 정규 클래스 리포 — 동반 테이블(업로드 원본) 때문에 일반 `ContentRepo`로는
 * 부족하다(07 §3 5-1). `list()`/`get()`은 여전히 정제본(`detailHtml`)만
 * 다루고, 아래 세 메서드만 원본을 만진다.
 */
export interface EducationRegularClassRepo extends ContentRepo<EducationRegularClass> {
  /** 편집 화면 전용 조회 — 동반 테이블의 원본·파일명을 함께 읽는다. */
  getForEdit(id: string): Promise<EducationRegularClassEdit | null>;
  /** `HtmlIntent.replace` — 동반 테이블에 원본·파일명을 upsert한다. */
  upsertHtmlSource(classId: string, raw: string, fileName: string): Promise<void>;
  /** `HtmlIntent.remove` — 동반 테이블 행을 지운다. */
  deleteHtmlSource(classId: string): Promise<void>;
}

export interface EducationContentData {
  regularClasses: EducationRegularClassRepo;
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
class MockRepo<T extends OrderedBase> implements ContentRepo<T> {
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

/**
 * 동반 테이블(업로드 원본)을 목데이터에서는 모델링하지 않는다 — 목 시드가
 * 항상 빈 배열이라 (06 §1-1) 실제로 값을 들고 있을 일이 없다. `getForEdit`은
 * 그래서 원본을 정제본으로만 채워 반환하고, upsert/delete는 no-op이다.
 */
class MockRegularClassRepo
  extends MockRepo<EducationRegularClass>
  implements EducationRegularClassRepo
{
  constructor(rows: EducationRegularClass[]) {
    super(rows, "edu_class");
  }

  async getForEdit(id: string): Promise<EducationRegularClassEdit | null> {
    const item = await this.get(id);
    if (!item) return null;
    return { ...item, detailHtmlRaw: item.detailHtml, detailHtmlFileName: "" };
  }

  async upsertHtmlSource(): Promise<void> {
    // no-op — 동반 테이블이 목 모드에 없다.
  }

  async deleteHtmlSource(): Promise<void> {
    // no-op — 동반 테이블이 목 모드에 없다.
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
    regularClasses: new MockRegularClassRepo(mockEducationRegularClasses),
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
