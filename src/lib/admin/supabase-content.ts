import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BUNDLE_BUCKET, BUNDLE_PATH_RE, walkBundle } from "./course-bundle";
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
 * Supabase-backed CMS repos (docs/06-admin/ §4.2 / §11.8 wiring day).
 * Runs through the session server client, so RLS gates writes to admins and
 * lets admins read unpublished rows. camel↔snake mapping is table-driven.
 */

type FieldMap = ReadonlyArray<readonly [camel: string, snake: string]>;

const COMMON: FieldMap = [
  ["sortOrder", "sort_order"],
  ["isPublished", "is_published"],
];

/**
 * `education_club_cohorts` 전용 — 그 테이블에는 `is_published` 컬럼이 없다
 * (의도적, 백로그 04 / RLS 주석 `..._p3_education_ver3.sql:299` 참고). 숨기는
 * 축은 `status`(예: "ended") 하나뿐이라 여기서 `COMMON`을 안 쓴다.
 */
const ORDER_ONLY: FieldMap = [["sortOrder", "sort_order"]];

const FIELDS: Record<string, FieldMap> = {
  work_items: [
    ...COMMON,
    ["client", "client"],
    ["title", "title"],
    ["category", "category"],
    ["accent", "accent"],
    ["summary", "summary"],
    ["challenge", "challenge"],
    ["solution", "solution"],
    ["results", "results"],
    ["imageUrl", "image_url"],
    ["imageUrls", "image_urls"],
    ["scope", "scope"],
    ["features", "features"],
    ["userFlow", "user_flow"],
    ["externalUrl", "external_url"],
    ["showOnHome", "show_on_home"],
  ],
  experts: [
    ...COMMON,
    ["name", "name"],
    ["role", "role"],
    ["quote", "quote"],
    ["tags", "tags"],
    ["accent", "accent"],
    ["imageUrl", "image_url"],
  ],
  stats: [
    ...COMMON,
    ["value", "value"],
    ["suffix", "suffix"],
    ["label", "label"],
  ],
  home_pillars: [
    ...COMMON,
    ["key", "key"],
    ["title", "title"],
    ["description", "description"],
    ["tags", "tags"],
    ["imageUrl", "image_url"],
    ["imageAlt", "image_alt"],
    ["accent", "accent"],
  ],
  home_pillar_examples: [
    ...COMMON,
    ["pillarKey", "pillar_key"],
    ["key", "key"],
    ["name", "name"],
    ["client", "client"],
    ["headline", "headline"],
    ["description", "description"],
    ["highlights", "highlights"],
    ["imageUrl", "image_url"],
    ["imageAlt", "image_alt"],
    ["accent", "accent"],
  ],
  education_regular_classes: [
    ...COMMON,
    ["slug", "slug"],
    ["indexLabel", "index_label"],
    ["name", "name"],
    ["subtitle", "subtitle"],
    ["description", "description"],
    ["duration", "duration"],
    ["level", "level"],
    ["tracks", "tracks"],
    ["accent", "accent"],
    ["imageUrl", "image_url"],
    ["imageAlt", "image_alt"],
    ["imageCaption", "image_caption"],
    ["curriculum", "curriculum"],
    ["detailHref", "detail_href"],
    ["seoTitle", "seo_title"],
    ["seoDescription", "seo_description"],
    ["scheduleType", "schedule_type"],
    ["startDate", "start_date"],
    ["endDate", "end_date"],
    ["detailHtml", "detail_html"],
    ["detailBundlePath", "detail_bundle_path"],
    ["detailBundleName", "detail_bundle_name"],
  ],
  education_club_cohorts: [
    ...ORDER_ONLY,
    ["label", "label"],
    ["status", "status"],
    ["recruitPeriod", "recruit_period"],
    ["runPeriod", "run_period"],
    ["price", "price"],
    ["listPrice", "list_price"],
    ["capacity", "capacity"],
    ["note", "note"],
    ["ctaDisabled", "cta_disabled"],
    ["showPrice", "show_price"],
    ["showCapacity", "show_capacity"],
    ["showSchedule", "show_schedule"],
    ["showCta", "show_cta"],
  ],
  education_club_tiers: [
    ...COMMON,
    ["name", "name"],
    ["role", "role"],
    ["points", "points"],
    ["accent", "accent"],
    ["characterSrc", "character_src"],
    ["characterWidth", "character_width"],
    ["characterHeight", "character_height"],
  ],
  education_past_programs: [
    ...COMMON,
    ["slug", "slug"],
    ["title", "title"],
    ["category", "category"],
    ["period", "period"],
    ["audience", "audience"],
    ["duration", "duration"],
    ["summary", "summary"],
    ["outcome", "outcome"],
    ["accent", "accent"],
    ["coverImageUrl", "cover_image_url"],
    ["coverImageAlt", "cover_image_alt"],
    ["coverImageCaption", "cover_image_caption"],
    ["coverUnoptimized", "cover_unoptimized"],
  ],
  education_reviews: [
    ...COMMON,
    ["key", "key"],
    ["rating", "rating"],
    ["body", "body"],
    ["author", "author"],
    ["program", "program"],
    ["dateLabel", "date_label"],
    ["accent", "accent"],
  ],
  education_faqs: [
    ...COMMON,
    ["key", "key"],
    ["question", "question"],
    ["answer", "answer"],
  ],
  education_stats: [
    ...COMMON,
    ["key", "key"],
    ["value", "value"],
    ["label", "label"],
  ],
};

/**
 * 테이블별 "날짜인데 빈 문자열 기반"인 필드 집합. 이 필드들만 null↔""
 * 대칭 변환을 받는다 — 정규 클래스에만 해당하고, 나머지 11개 테이블은
 * 이 표에 아예 없어서 항상 no-op이다(COMMON을 건드리지 않는 이유이기도
 * 하다: 전역 규칙이 아니라 테이블별 예외라서).
 */
const DATE_FIELDS: Record<string, ReadonlySet<string>> = {
  education_regular_classes: new Set(["startDate", "endDate"]),
};

/** DB row → domain object (id + mapped fields; null nullable columns → undefined,
 * so they line up with the optional (`?`) fields on the domain types). */
function fromRow<T extends OrderedBase>(table: string, row: Record<string, unknown>): T {
  const out: Record<string, unknown> = { id: row.id };
  const dateFields = DATE_FIELDS[table];
  for (const [camel, snake] of FIELDS[table]) {
    const v = row[snake];
    if (v === null || v === undefined) {
      // 날짜 컬럼의 null은 "값 없음"이다. 도메인 타입은 이 필드를 string
      // (옵셔널 아님)으로 선언해서 폼이 항상 문자열로만 다루게 했으므로,
      // 여기서 ""로 정규화해야 폼마다 `?? ""`를 반복하지 않는다.
      if (dateFields?.has(camel)) out[camel] = "";
      continue;
    }
    out[camel] = v;
  }
  return out as T;
}

/** Partial domain object → DB row columns (skips undefined). */
function toRow(table: string, obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const dateFields = DATE_FIELDS[table];
  for (const [camel, snake] of FIELDS[table]) {
    if (obj[camel] === undefined) continue;
    const v = obj[camel];
    // 빈 문자열은 "날짜를 지운다"는 의도다. null로 바꿔 보내지 않으면 date
    // 컬럼에 ''가 그대로 들어가려다 DB가 거부하거나(타입 불일치), 값이
    // 남아 CHECK 제약과 표기 포맷 함수가 둘 다 깨진다.
    out[snake] = dateFields?.has(camel) && v === "" ? null : v;
  }
  return out;
}

class SupabaseRepo<T extends OrderedBase> implements ContentRepo<T> {
  constructor(
    protected table: string,
    /**
     * list()가 읽는 컬럼. 기본은 전체(`*`) — 정규 클래스만 `detail_html`을
     * 뺀 좁은 목록을 넘긴다(목록 화면까지 최대 5MB짜리 HTML을 나를 이유가
     * 없다). 다른 테이블은 이 값을 안 넘겨 지금까지의 동작과 같다.
     */
    protected listColumns: string = "*",
  ) {}

  async list(): Promise<T[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(this.table)
      .select(this.listColumns)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    // supabase-js는 select()에 리터럴이 아닌 string(this.listColumns)이 오면
    // 컬럼을 추론하지 못해 데이터 타입을 GenericStringError로 좁힌다 — 실제
    // 런타임 형태는 다른 리포와 같은 row 배열이라 unknown을 거쳐 되돌린다.
    return (data as unknown as Record<string, unknown>[]).map((r) =>
      fromRow<T>(this.table, r),
    );
  }

  async get(id: string): Promise<T | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(this.table)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromRow<T>(this.table, data) : null;
  }

  async create(input: Omit<T, "id" | "sortOrder">): Promise<T> {
    const supabase = await createSupabaseServerClient();
    // Next sort_order = current max + 1 (append to the end).
    const { data: top } = await supabase
      .from(this.table)
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (top?.[0]?.sort_order ?? -1) + 1;

    const row = { ...toRow(this.table, input as Record<string, unknown>), sort_order: nextOrder };
    const { data, error } = await supabase
      .from(this.table)
      .insert(row)
      .select("*")
      .single();
    if (error) throw error;
    return fromRow<T>(this.table, data);
  }

  async update(id: string, patch: Partial<Omit<T, "id">>): Promise<T> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(this.table)
      .update(toRow(this.table, patch as Record<string, unknown>))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return fromRow<T>(this.table, data);
  }

  async remove(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from(this.table).delete().eq("id", id);
    if (error) throw error;
  }
}

/** education_regular_classes의 list() 컬럼 — detail_html만 뺀 전체. */
const REGULAR_CLASS_LIST_COLUMNS =
  "id," +
  FIELDS.education_regular_classes
    .map(([, snake]) => snake)
    .filter((snake) => snake !== "detail_html")
    .join(",");

/**
 * 정규 클래스 리포 — 동반 테이블(`education_regular_class_html_sources`)
 * 읽기·쓰기를 더한다(07 §3 5-1). 기본 CRUD는 그대로 SupabaseRepo를 쓴다:
 * `detailHtml`은 FIELDS에 있는 평범한 컬럼이라 create/update가 이미 옮긴다 —
 * 여기서 새로 다루는 건 동반 테이블뿐이다.
 */
class SupabaseRegularClassRepo
  extends SupabaseRepo<EducationRegularClass>
  implements EducationRegularClassRepo
{
  constructor() {
    super("education_regular_classes", REGULAR_CLASS_LIST_COLUMNS);
  }

  async getForEdit(id: string): Promise<EducationRegularClassEdit | null> {
    const item = await this.get(id);
    if (!item) return null;

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("education_regular_class_html_sources")
      .select("raw, file_name")
      .eq("class_id", id)
      .maybeSingle();
    if (error) throw error;

    return {
      ...item,
      detailHtmlRaw: (data?.raw as string | undefined) ?? "",
      detailHtmlFileName: (data?.file_name as string | undefined) ?? "",
    };
  }

  async upsertHtmlSource(classId: string, raw: string, fileName: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("education_regular_class_html_sources")
      .upsert({ class_id: classId, raw, file_name: fileName }, { onConflict: "class_id" });
    if (error) throw error;
  }

  async deleteHtmlSource(classId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("education_regular_class_html_sources")
      .delete()
      .eq("class_id", classId);
    if (error) throw error;
  }

  /**
   * 번들 폴더를 통째로 지운다. DB CHECK가 이미 경로 모양을 막지만 여기서 한 번
   * 더 본다 — 이 값이 곧 Storage 삭제 prefix이고, 버킷을 과정 이미지와
   * 공유하므로 prefix가 어긋나면 이미지까지 사정권에 들어온다.
   * `list()`는 재귀가 아니고 하위 폴더는 `id`가 null로 오므로(Storage API 동작)
   * `walkBundle`이 훑어 모은 객체 경로를 한 번에 넘긴다.
   */
  async removeBundleFolder(path: string): Promise<void> {
    if (!BUNDLE_PATH_RE.test(path)) return;

    const supabase = await createSupabaseServerClient();
    const bucket = supabase.storage.from(BUNDLE_BUCKET);

    const paths = await walkBundle(path, async (prefix) => {
      // limit을 반드시 준다 — 기본값이 100이라 한 폴더에 100개가 넘으면 나머지가
      // 조용히 안 지워진다. 번들 전체 상한이 MAX_FILES(300)라 1000이면 넉넉하다.
      const { data, error } = await bucket.list(prefix, { limit: 1000 });
      if (error) throw error;
      return (data ?? []).map((entry) => ({ name: entry.name, id: entry.id }));
    });
    if (paths.length === 0) return;

    const { error } = await bucket.remove(paths);
    if (error) throw error;
  }
}

/**
 * 지난 프로그램 갤러리 — 부모 행에 딸린 목록이라 ContentBase 모양이 아니고
 * (공개 여부·정렬을 부모가 정한다) 별도 리포지토리로 둔다.
 */
class SupabasePastProgramImagesRepo implements EducationPastProgramImagesRepo {
  private map(row: Record<string, unknown>): EducationPastProgramImage {
    return {
      id: row.id as string,
      programId: row.program_id as string,
      imageUrl: (row.image_url as string) ?? "",
      alt: (row.alt as string) ?? "",
      caption: (row.caption as string) ?? "",
      sortOrder: (row.sort_order as number) ?? 0,
    };
  }

  private toRow(input: Partial<EducationPastProgramImageInput>) {
    const out: Record<string, unknown> = {};
    if (input.programId !== undefined) out.program_id = input.programId;
    if (input.imageUrl !== undefined) out.image_url = input.imageUrl;
    if (input.alt !== undefined) out.alt = input.alt;
    if (input.caption !== undefined) out.caption = input.caption;
    if (input.sortOrder !== undefined) out.sort_order = input.sortOrder;
    return out;
  }

  async listByProgram(programId: string): Promise<EducationPastProgramImage[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("education_past_program_images")
      .select("*")
      .eq("program_id", programId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as Record<string, unknown>[]).map((r) => this.map(r));
  }

  async create(input: EducationPastProgramImageInput): Promise<EducationPastProgramImage> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("education_past_program_images")
      .insert(this.toRow(input))
      .select("*")
      .single();
    if (error) throw error;
    return this.map(data);
  }

  async update(
    id: string,
    patch: Partial<EducationPastProgramImageInput>,
  ): Promise<EducationPastProgramImage> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("education_past_program_images")
      .update(this.toRow(patch))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return this.map(data);
  }

  async remove(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("education_past_program_images")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}

/** 조직·기업 맞춤 교육 — 행이 하나뿐이라 get/update만 있다. */
class SupabaseOrgTrainingRepo implements EducationOrgTrainingRepo {
  private empty: EducationOrgTraining = {
    title: "",
    description: "",
    minParticipants: "",
    imageAlt: "",
    imageCaption: "",
    ctaLabel: "",
  };

  private map(row: Record<string, unknown> | null): EducationOrgTraining {
    if (!row) return this.empty;
    return {
      title: (row.title as string) ?? "",
      description: (row.description as string) ?? "",
      minParticipants: (row.min_participants as string) ?? "",
      ...(row.image_url ? { imageUrl: row.image_url as string } : {}),
      imageAlt: (row.image_alt as string) ?? "",
      imageCaption: (row.image_caption as string) ?? "",
      ctaLabel: (row.cta_label as string) ?? "",
    };
  }

  async get(): Promise<EducationOrgTraining> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("education_org_training")
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return this.map(data);
  }

  async update(patch: Partial<EducationOrgTraining>): Promise<EducationOrgTraining> {
    const supabase = await createSupabaseServerClient();
    const row: Record<string, unknown> = { singleton: true };
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.minParticipants !== undefined) row.min_participants = patch.minParticipants;
    if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl;
    if (patch.imageAlt !== undefined) row.image_alt = patch.imageAlt;
    if (patch.imageCaption !== undefined) row.image_caption = patch.imageCaption;
    if (patch.ctaLabel !== undefined) row.cta_label = patch.ctaLabel;

    // 행이 없을 수도 있어(시딩 전) upsert로 만든다 — singleton 유니크 제약이
    // 두 번째 행을 막으므로 항상 같은 행이 갱신된다.
    const { data, error } = await supabase
      .from("education_org_training")
      .upsert(row, { onConflict: "singleton" })
      .select("*")
      .single();
    if (error) throw error;
    return this.map(data);
  }
}

export const supabaseContentData: ContentData = {
  work: new SupabaseRepo<WorkItem>("work_items"),
  pillars: new SupabaseRepo<HomePillar>("home_pillars"),
  pillarExamples: new SupabaseRepo<HomePillarExample>("home_pillar_examples"),
  experts: new SupabaseRepo<Expert>("experts"),
  stats: new SupabaseRepo<Stat>("stats"),
  education: {
    regularClasses: new SupabaseRegularClassRepo(),
    orgTraining: new SupabaseOrgTrainingRepo(),
    clubCohorts: new SupabaseRepo<EducationClubCohort>("education_club_cohorts"),
    clubTiers: new SupabaseRepo<EducationClubTier>("education_club_tiers"),
    pastPrograms: new SupabaseRepo<EducationPastProgram>("education_past_programs"),
    pastProgramImages: new SupabasePastProgramImagesRepo(),
    reviews: new SupabaseRepo<EducationReview>("education_reviews"),
    faqs: new SupabaseRepo<EducationFaq>("education_faqs"),
    stats: new SupabaseRepo<EducationStat>("education_stats"),
  },
};
