import "server-only";

import { getDb } from "@/lib/db";
import { deleteBlobPrefix } from "@/lib/blob";
import { assertAdmin } from "./auth";
import { BUNDLE_BUCKET, BUNDLE_PATH_RE } from "./course-bundle";
import type {
  ContentData,
  ContentRepo,
  EducationOrgTrainingRepo,
  EducationPastProgramImagesRepo,
  EducationRegularClassRepo,
} from "./content-data";
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

/**
 * Prisma(Neon) 기반 CMS 리포 — supabase-content.ts를 대체한다.
 *
 * Prisma 모델 필드 이름이 도메인 타입 필드 이름과 같아서(@map으로 컬럼만
 * snake_case) 매핑은 "어떤 필드를 옮기는가"만 정한다. 모델에만 있고 도메인에
 * 없는 필드(createdAt, work_items.layout_type 등)는 화면으로 새지 않게 거른다.
 *
 * **모든 메서드가 먼저 `assertAdmin()`을 부른다.** Supabase 시절에는 RLS가
 * 비관리자의 읽기(비공개 행)·쓰기를 DB에서 막았다. 이제 그 역할을 여기서 한다.
 */

type Row = Record<string, unknown>;

/** 여러 모델을 한 제네릭 리포로 다루기 위한 최소 델리게이트 모양. */
type Delegate = {
  findMany(args: object): Promise<Row[]>;
  findUnique(args: object): Promise<Row | null>;
  findFirst(args: object): Promise<Row | null>;
  create(args: object): Promise<Row>;
  update(args: object): Promise<Row>;
  deleteMany(args: object): Promise<unknown>;
};

type ModelName =
  | "workItem"
  | "homePillar"
  | "homePillarExample"
  | "expert"
  | "stat"
  | "educationRegularClass"
  | "educationClubCohort"
  | "educationClubTier"
  | "educationPastProgram"
  | "educationReview"
  | "educationFaq"
  | "educationStat";

function delegate(model: ModelName): Delegate {
  return getDb()[model] as unknown as Delegate;
}

const COMMON = ["sortOrder", "isPublished"] as const;
/** 클럽 기수에는 is_published가 없다(의도적 — 결정기록 04). 숨김 축은 status. */
const ORDER_ONLY = ["sortOrder"] as const;

const FIELDS: Record<ModelName, readonly string[]> = {
  workItem: [
    ...COMMON,
    "client", "title", "category", "accent", "summary", "challenge", "solution",
    "results", "imageUrl", "imageUrls", "scope", "features", "userFlow",
    "externalUrl", "showOnHome",
  ],
  expert: [...COMMON, "name", "role", "quote", "tags", "accent", "imageUrl"],
  stat: [...COMMON, "value", "suffix", "label"],
  homePillar: [...COMMON, "key", "title", "description", "tags", "imageUrl", "imageAlt", "accent"],
  homePillarExample: [
    ...COMMON,
    "pillarKey", "key", "name", "client", "headline", "description", "highlights",
    "imageUrl", "imageAlt", "accent",
  ],
  educationRegularClass: [
    ...COMMON,
    "slug", "indexLabel", "name", "subtitle", "description", "duration", "level",
    "tracks", "accent", "imageUrl", "imageAlt", "imageCaption", "curriculum",
    "detailHref", "seoTitle", "seoDescription", "scheduleType", "startDate",
    "endDate", "detailHtml", "detailBundlePath", "detailBundleName",
  ],
  educationClubCohort: [
    ...ORDER_ONLY,
    "label", "status", "recruitPeriod", "runPeriod", "price", "listPrice",
    "capacity", "note", "ctaDisabled", "showPrice", "showCapacity", "showSchedule",
    "showCta",
  ],
  educationClubTier: [
    ...COMMON,
    "name", "role", "points", "accent", "characterSrc", "characterWidth", "characterHeight",
  ],
  educationPastProgram: [
    ...COMMON,
    "slug", "title", "category", "period", "audience", "duration", "summary",
    "outcome", "accent", "coverImageUrl", "coverImageAlt", "coverImageCaption",
    "coverUnoptimized",
  ],
  educationReview: [...COMMON, "key", "rating", "body", "author", "program", "dateLabel", "accent"],
  educationFaq: [...COMMON, "key", "question", "answer"],
  educationStat: [...COMMON, "key", "value", "label"],
};

/**
 * date 컬럼(@db.Date)인 필드. 도메인은 "YYYY-MM-DD" 문자열(없으면 "")로 다룬다
 * — 폼과 `<input type="date">`가 전부 문자열이라서다. 정규 클래스에만 있다.
 */
const DATE_FIELDS: Partial<Record<ModelName, ReadonlySet<string>>> = {
  educationRegularClass: new Set(["startDate", "endDate"]),
};

function dateToIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isoToDate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

/** DB row → domain object. null인 nullable 컬럼은 빠진다(도메인의 `?` 필드). */
function fromRow<T>(model: ModelName, row: Row): T {
  const out: Row = { id: row.id };
  const dateFields = DATE_FIELDS[model];
  for (const field of FIELDS[model]) {
    const v = row[field];
    if (dateFields?.has(field)) {
      out[field] = v instanceof Date ? dateToIso(v) : "";
      continue;
    }
    if (v === null || v === undefined) continue;
    out[field] = v;
  }
  return out as T;
}

/** Partial domain object → Prisma data (undefined는 건너뛴다). */
function toData(model: ModelName, obj: Row): Row {
  const out: Row = {};
  const dateFields = DATE_FIELDS[model];
  for (const field of FIELDS[model]) {
    const v = obj[field];
    if (v === undefined) continue;
    if (dateFields?.has(field)) {
      // 빈 문자열 = 날짜를 지운다. date 컬럼에 ''를 넣을 수 없으니 null로.
      out[field] = typeof v === "string" && v !== "" ? isoToDate(v) : null;
      continue;
    }
    out[field] = v;
  }
  return out;
}

function selectOf(fields: readonly string[]): Record<string, true> {
  return Object.fromEntries([["id", true], ...fields.map((f) => [f, true])]);
}

class PrismaRepo<T extends OrderedBase> implements ContentRepo<T> {
  constructor(
    protected model: ModelName,
    /**
     * list()가 읽는 필드. 기본은 도메인 필드 전체 — 정규 클래스만
     * `detailHtml`을 뺀다(목록 화면까지 최대 5MB짜리 HTML을 나를 이유가 없다).
     */
    protected listFields: readonly string[] = FIELDS[model],
  ) {}

  protected get db(): Delegate {
    return delegate(this.model);
  }

  async list(): Promise<T[]> {
    await assertAdmin();
    const rows = await this.db.findMany({
      select: selectOf(this.listFields),
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((r) => fromRow<T>(this.model, r));
  }

  async get(id: string): Promise<T | null> {
    await assertAdmin();
    const row = await this.db.findUnique({ where: { id } });
    return row ? fromRow<T>(this.model, row) : null;
  }

  async create(input: Omit<T, "id" | "sortOrder">): Promise<T> {
    await assertAdmin();
    // 다음 sort_order = 현재 최댓값 + 1 (끝에 붙인다).
    const top = await this.db.findFirst({
      select: { sortOrder: true },
      orderBy: { sortOrder: "desc" },
    });
    const nextOrder = ((top?.sortOrder as number | undefined) ?? -1) + 1;
    const row = await this.db.create({
      data: { ...toData(this.model, input as Row), sortOrder: nextOrder },
    });
    return fromRow<T>(this.model, row);
  }

  async update(id: string, patch: Partial<Omit<T, "id">>): Promise<T> {
    await assertAdmin();
    const row = await this.db.update({
      where: { id },
      data: toData(this.model, patch as Row),
    });
    return fromRow<T>(this.model, row);
  }

  async remove(id: string): Promise<void> {
    await assertAdmin();
    // 없는 행 삭제는 Supabase 때처럼 조용히 넘어간다.
    await this.db.deleteMany({ where: { id } });
  }
}

/**
 * 정규 클래스 리포 — 동반 테이블(`education_regular_class_html_sources`)과
 * Blob 번들 폴더 삭제를 더한다(07 §3 5-1).
 */
class PrismaRegularClassRepo
  extends PrismaRepo<EducationRegularClass>
  implements EducationRegularClassRepo
{
  constructor() {
    super(
      "educationRegularClass",
      FIELDS.educationRegularClass.filter((f) => f !== "detailHtml"),
    );
  }

  async getForEdit(id: string): Promise<EducationRegularClassEdit | null> {
    const item = await this.get(id);
    if (!item) return null;

    const source = await getDb().educationRegularClassHtmlSource.findUnique({
      where: { classId: id },
      select: { raw: true, fileName: true },
    });
    return {
      ...item,
      detailHtmlRaw: source?.raw ?? "",
      detailHtmlFileName: source?.fileName ?? "",
    };
  }

  async upsertHtmlSource(classId: string, raw: string, fileName: string): Promise<void> {
    await assertAdmin();
    await getDb().educationRegularClassHtmlSource.upsert({
      where: { classId },
      create: { classId, raw, fileName },
      update: { raw, fileName },
    });
  }

  async deleteHtmlSource(classId: string): Promise<void> {
    await assertAdmin();
    await getDb().educationRegularClassHtmlSource.deleteMany({ where: { classId } });
  }

  /**
   * 번들 폴더를 통째로 지운다. DB CHECK가 이미 경로 모양을 막지만 여기서 한 번
   * 더 본다 — 이 값이 곧 Blob 삭제 prefix이고, 과정 이미지와 같은 `education/`
   * 아래에 있어 prefix가 어긋나면 이미지까지 사정권에 들어온다.
   */
  async removeBundleFolder(path: string): Promise<void> {
    await assertAdmin();
    if (!BUNDLE_PATH_RE.test(path)) return;
    await deleteBlobPrefix(`${BUNDLE_BUCKET}/${path}`);
  }
}

/** 지난 프로그램 갤러리 — 부모 행에 딸린 목록이라 별도 리포다. */
class PrismaPastProgramImagesRepo implements EducationPastProgramImagesRepo {
  private map(row: {
    id: string;
    programId: string;
    imageUrl: string;
    alt: string;
    caption: string;
    sortOrder: number;
  }): EducationPastProgramImage {
    return {
      id: row.id,
      programId: row.programId,
      imageUrl: row.imageUrl,
      alt: row.alt,
      caption: row.caption,
      sortOrder: row.sortOrder,
    };
  }

  async listByProgram(programId: string): Promise<EducationPastProgramImage[]> {
    await assertAdmin();
    const rows = await getDb().educationPastProgramImage.findMany({
      where: { programId },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((r) => this.map(r));
  }

  async create(input: EducationPastProgramImageInput): Promise<EducationPastProgramImage> {
    await assertAdmin();
    const row = await getDb().educationPastProgramImage.create({
      data: {
        programId: input.programId,
        imageUrl: input.imageUrl,
        alt: input.alt,
        caption: input.caption,
        sortOrder: input.sortOrder,
      },
    });
    return this.map(row);
  }

  async update(
    id: string,
    patch: Partial<EducationPastProgramImageInput>,
  ): Promise<EducationPastProgramImage> {
    await assertAdmin();
    const row = await getDb().educationPastProgramImage.update({
      where: { id },
      data: {
        programId: patch.programId,
        imageUrl: patch.imageUrl,
        alt: patch.alt,
        caption: patch.caption,
        sortOrder: patch.sortOrder,
      },
    });
    return this.map(row);
  }

  async remove(id: string): Promise<void> {
    await assertAdmin();
    await getDb().educationPastProgramImage.deleteMany({ where: { id } });
  }
}

/** 조직·기업 맞춤 교육 — 행이 하나뿐이라 get/update만 있다. */
class PrismaOrgTrainingRepo implements EducationOrgTrainingRepo {
  private empty: EducationOrgTraining = {
    title: "",
    description: "",
    minParticipants: "",
    imageAlt: "",
    imageCaption: "",
    ctaLabel: "",
  };

  private map(
    row: {
      title: string;
      description: string;
      minParticipants: string;
      imageUrl: string | null;
      imageAlt: string;
      imageCaption: string;
      ctaLabel: string;
    } | null,
  ): EducationOrgTraining {
    if (!row) return this.empty;
    return {
      title: row.title,
      description: row.description,
      minParticipants: row.minParticipants,
      ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
      imageAlt: row.imageAlt,
      imageCaption: row.imageCaption,
      ctaLabel: row.ctaLabel,
    };
  }

  async get(): Promise<EducationOrgTraining> {
    await assertAdmin();
    return this.map(await getDb().educationOrgTraining.findFirst());
  }

  async update(patch: Partial<EducationOrgTraining>): Promise<EducationOrgTraining> {
    await assertAdmin();
    const data = {
      title: patch.title,
      description: patch.description,
      minParticipants: patch.minParticipants,
      imageUrl: patch.imageUrl,
      imageAlt: patch.imageAlt,
      imageCaption: patch.imageCaption,
      ctaLabel: patch.ctaLabel,
    };
    // 행이 없을 수도 있어(시딩 전) upsert — singleton 유니크가 두 번째 행을 막는다.
    const row = await getDb().educationOrgTraining.upsert({
      where: { singleton: true },
      create: { singleton: true, ...data },
      update: data,
    });
    return this.map(row);
  }
}

export const prismaContentData: ContentData = {
  work: new PrismaRepo<WorkItem>("workItem"),
  pillars: new PrismaRepo<HomePillar>("homePillar"),
  pillarExamples: new PrismaRepo<HomePillarExample>("homePillarExample"),
  experts: new PrismaRepo<Expert>("expert"),
  stats: new PrismaRepo<Stat>("stat"),
  education: {
    regularClasses: new PrismaRegularClassRepo(),
    orgTraining: new PrismaOrgTrainingRepo(),
    clubCohorts: new PrismaRepo<EducationClubCohort>("educationClubCohort"),
    clubTiers: new PrismaRepo<EducationClubTier>("educationClubTier"),
    pastPrograms: new PrismaRepo<EducationPastProgram>("educationPastProgram"),
    pastProgramImages: new PrismaPastProgramImagesRepo(),
    reviews: new PrismaRepo<EducationReview>("educationReview"),
    faqs: new PrismaRepo<EducationFaq>("educationFaq"),
    stats: new PrismaRepo<EducationStat>("educationStat"),
  },
};
