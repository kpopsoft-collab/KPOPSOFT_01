import { createSupabasePublicClient } from "@/lib/supabase/public";
import {
  route,
  type Accent,
  type Expert,
  experts as seedExperts,
  selectedWork as seedWork,
  testimonials as seedTestimonials,
  stats as seedStats,
  inquiryOptions as seedOptions,
} from "@/lib/site";
import {
  aiExamples,
  type PillarExample,
  type PillarKey,
  softwareExamples,
} from "@/lib/pillar-examples";
import {
  type ClubCohort,
  type ClubTier,
  type EduImage,
  type EduReview,
  type EduStat,
  type FaqItem,
  type OrgTraining,
  type PastProgram,
  type RegularClass,
  type RegularClassDetail,
  clubCohorts,
  clubTiers,
  eduFaqs,
  eduReviews,
  eduStats,
  orgTraining,
  pastPrograms,
  regularClasses,
} from "@/lib/education-content";

/**
 * Public-site content readers (docs/06-admin/ §11.8). Each reads published /
 * active rows through the anon public client and maps them back to the exact
 * src/lib/site.ts shape the sections already consume. On empty result or any
 * error they fall back to the site.ts seed, so the landing page never breaks —
 * even mid-migration or during a DB outage.
 */

export type PublicExpert = Expert;
export type PublicWork = {
  client: string;
  title: string;
  category: string;
  accent: Accent;
  summary: string;
  challenge: string;
  solution: string;
  results: string[];
  imageUrl?: string;
  /**
   * 홈 포트폴리오 노출 여부. 사례가 쌓이면 홈에는 고른 것만 띄우고 나머지는
   * `/work` 목록에서 보게 한다. 시드 폴백에는 이 값이 없으므로 기본은 노출이다
   * — 관리자가 끄기 전까지는 지금처럼 전부 나오는 편이 안전하다.
   */
  showOnHome: boolean;
  /**
   * 갤러리 이미지. 여러 장이면 카드에 도트 페이지네이션이 붙는다
   * (docs/02-home/ §SECTION 05).
   * 비어 있으면 `imageUrl` 한 장만 쓴다.
   */
  imageUrls?: string[];
  /**
   * 담당 범위 (수정 요청서 §8). **실제 수행 내용이 확인된 경우에만** 채운다 —
   * 확인되지 않은 역할을 임의로 추가하지 않는다. 비어 있으면 카드에서 이 줄이
   * 통째로 빠진다.
   */
  scope?: string[];
  /** 주요 기능 — 상세 패널에서만 보여준다 (요청서 §9~§11). */
  features?: string[];
  /** 핵심 사용자 흐름 한 줄 (요청서 §9~§11). */
  flow?: string;
  /** 공개된 실제 서비스 주소. 있으면 카드·상세에 외부 링크가 붙는다. */
  externalUrl?: string;
};
export type PublicTestimonial = {
  quote: string;
  author: string;
  program: string;
  result: string;
};
export type PublicStat = { value: number; suffix: string; label: string };
export type PublicInquiryOption = {
  type: string;
  subtypes: { label: string; placeholder: string }[];
};

// site.ts seeds are `as const`; loosen them to the mutable public types for fallback.
const fallbackExperts = seedExperts as PublicExpert[];
// 시드에는 노출 플래그가 없다 — DB가 없을 때는 전부 보여준다.
const fallbackWork = (seedWork as unknown as Omit<PublicWork, "showOnHome">[]).map(
  (w) => ({ ...w, showOnHome: true }),
) as PublicWork[];
const fallbackTestimonials = seedTestimonials as unknown as PublicTestimonial[];
const fallbackStats = seedStats as unknown as PublicStat[];
const fallbackOptions = seedOptions as unknown as PublicInquiryOption[];

export async function getPublicExperts(): Promise<PublicExpert[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("experts")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return fallbackExperts;
    return data.map((r) => ({
      name: r.name,
      role: r.role,
      quote: r.quote,
      tags: r.tags ?? [],
      accent: r.accent as Accent,
      ...(r.image_url ? { image: r.image_url as string } : {}),
    }));
  } catch {
    return fallbackExperts;
  }
}

export async function getPublicWork(): Promise<PublicWork[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("work_items")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return fallbackWork;
    return data.map((r) => ({
      client: r.client,
      title: r.title,
      category: r.category,
      accent: r.accent as Accent,
      summary: r.summary,
      challenge: r.challenge,
      solution: r.solution,
      results: r.results ?? [],
      ...(r.image_url ? { imageUrl: r.image_url as string } : {}),
      ...(Array.isArray(r.image_urls) && r.image_urls.length > 0
        ? { imageUrls: r.image_urls as string[] }
        : {}),
      // 아래 네 필드는 수정 요청서 §8~§12로 새로 생긴 컬럼이다. 컬럼이 아직
      // 없는 DB에서도 `select *`가 그냥 undefined를 주므로 안전하게 빠진다.
      ...(Array.isArray(r.scope) && r.scope.length > 0
        ? { scope: r.scope as string[] }
        : {}),
      ...(Array.isArray(r.features) && r.features.length > 0
        ? { features: r.features as string[] }
        : {}),
      ...(r.user_flow ? { flow: r.user_flow as string } : {}),
      ...(r.external_url ? { externalUrl: r.external_url as string } : {}),
      showOnHome: r.show_on_home !== false,
    }));
  } catch {
    return fallbackWork;
  }
}


export async function getPublicTestimonials(): Promise<PublicTestimonial[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("testimonials")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return fallbackTestimonials;
    return data.map((r) => ({
      quote: r.quote,
      author: r.author,
      program: r.program,
      result: r.result,
    }));
  } catch {
    return fallbackTestimonials;
  }
}

export async function getPublicStats(): Promise<PublicStat[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("stats")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return fallbackStats;
    return data.map((r) => ({
      value: r.value,
      suffix: r.suffix,
      label: r.label,
    }));
  } catch {
    return fallbackStats;
  }
}

export async function getPublicInquiryOptions(): Promise<PublicInquiryOption[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("inquiry_types")
      .select("*, inquiry_subtypes(*)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return fallbackOptions;
    return data.map((t) => ({
      type: t.label as string,
      subtypes: ((t.inquiry_subtypes ?? []) as Record<string, unknown>[])
        .filter((s) => s.is_active !== false)
        .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
        .map((s) => ({
          label: s.label as string,
          placeholder: (s.placeholder as string) ?? "",
        })),
    }));
  } catch {
    return fallbackOptions;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Education (docs/03-education/) — public readers.
//
// 위 섹션들이 site.ts 시드로 폴백하듯, 교육은 `education-content.ts`의 정적
// 데이터로 폴백한다. DB가 비었거나(마이그레이션 직후) 조회가 실패해도
// /education은 지금 화면 그대로 나온다 — 빈 페이지가 나오는 편이 더 나쁘다.
//
// 반환 타입은 정적 데이터와 **같은 타입**을 그대로 쓴다. 섹션 컴포넌트가 이미
// 그 모양을 소비하고 있어, 별도 Public* 타입을 만들면 같은 것을 두 번 정의한
// 뒤 서로 변환하는 코드만 늘어난다.
//
// ver2 스키마(education_programs / outputs / cases / vibedays_roles / images /
// page_settings)를 읽던 함수들은 지웠다. 그 테이블은 DB에 만들어진 적이 없고
// ver3 3분류 체계와 구조가 맞지 않았으며, 호출하는 곳도 없었다.
// ─────────────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.map(str) : []);
/** 비어 있으면 필드 자체를 빼기 위한 헬퍼 — optional 필드에 ""를 넣지 않는다. */
const opt = (v: unknown): string | undefined => (str(v) ? str(v) : undefined);

/** 이미지 세 컬럼(url/alt/caption) → EduImage. url이 없으면 이미지 자체가 없다. */
function toImage(url: unknown, alt: unknown, caption: unknown): EduImage | undefined {
  if (!str(url)) return undefined;
  return {
    src: str(url),
    alt: str(alt),
    ...(str(caption) ? { caption: str(caption) } : {}),
  };
}

/**
 * 조회 한 번을 감싸는 공통 틀. 에러·빈 결과면 폴백을 돌려준다.
 * 세 군데에서 같은 try/catch를 반복하지 않기 위한 것이지 다른 동작은 없다.
 */
async function read<T>(
  table: string,
  map: (rows: Row[]) => T,
  fallback: T,
): Promise<T> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from(table)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return fallback;
    return map(data as Row[]);
  } catch {
    return fallback;
  }
}

/** 01. 조직·기업 맞춤 교육 — 싱글턴 행. */
export async function getPublicOrgTraining(): Promise<OrgTraining> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("education_org_training")
      .select("*")
      .maybeSingle();
    if (error || !data) return orgTraining;
    return {
      title: str(data.title),
      description: str(data.description),
      minParticipants: str(data.min_participants),
      image:
        toImage(data.image_url, data.image_alt, data.image_caption) ??
        orgTraining.image,
      cta: { label: str(data.cta_label) },
    };
  } catch {
    return orgTraining;
  }
}

/**
 * 02. 정규 클래스 4과정.
 *
 * 공통 헬퍼 `read()`를 쓰지 않는다 — `read()`는 "빈 결과 = 정적 폴백"으로
 * 동작하는데(다른 리더들이 이 동작에 기대고 있어 거기는 그대로 둔다),
 * 정규 클래스에 그대로 적용하면 관리자가 전 과정을 비공개로 돌린 **정상
 * 상태**(빈 배열)에서 정적 4행이 되살아난다(백로그 01 §3 6단계 / 06 §P1-5).
 * 여기서는 **조회 자체가 실패했을 때만** 폴백하고, 정상적인 0행은 빈 배열을
 * 그대로 돌려준다.
 *
 * `detailHtml`은 여기서 매핑하지 않는다 — 본문은 백로그 02의 slug 단건
 * 조회에서 읽는다. 목록 응답에 수백 KB짜리 HTML을 함께 실어 보내지 않기
 * 위해서다.
 */
const REGULAR_CLASS_PUBLIC_COLUMNS = [
  "slug",
  "index_label",
  "name",
  "subtitle",
  "description",
  "duration",
  "level",
  "schedule_type",
  "start_date",
  "end_date",
  "tracks",
  "accent",
  "image_url",
  "image_alt",
  "image_caption",
  "curriculum",
  "detail_href",
  "seo_title",
  "seo_description",
  "sort_order",
].join(",");

export async function getPublicRegularClasses(): Promise<RegularClass[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("education_regular_classes")
      // 컬럼을 명시하는 이유 — `*`로 읽으면 상세 본문(detail_html)까지 행마다
      // 딸려 온다. 이 목록은 /education이 매 요청 렌더할 때 읽히는데 본문은
      // 거기서 쓰지도 않는다. 본문은 백로그 02의 slug 단건 조회에서만 읽는다.
      .select(REGULAR_CLASS_PUBLIC_COLUMNS)
      .order("sort_order", { ascending: true });
    if (error || !data) return regularClasses;
    // supabase-js는 select()에 리터럴이 아닌 string이 오면 컬럼 타입을 추론하지
    // 못하고 GenericStringError로 떨어뜨린다. 런타임 모양은 평범한 행이라
    // unknown을 한 번 거쳐 좁힌다(supabase-content.ts의 list()와 같은 사정).
    return (data as unknown as Row[]).map((r) => ({
      slug: str(r.slug),
      index: str(r.index_label),
      name: str(r.name),
      subtitle: str(r.subtitle),
      description: str(r.description),
      duration: str(r.duration),
      level: str(r.level),
      // 컬럼이 비어 있으면(마이그레이션 직후 등) "multi"를 기본값으로 삼는다
      // — 기존 4과정도 D4에 따라 multi로 시작한다.
      scheduleType: (str(r.schedule_type) ||
        "multi") as RegularClass["scheduleType"],
      ...(opt(r.start_date) ? { startDate: opt(r.start_date) } : {}),
      ...(opt(r.end_date) ? { endDate: opt(r.end_date) } : {}),
      tracks: strArray(r.tracks) as RegularClass["tracks"],
      accent: str(r.accent) as Accent,
      ...(toImage(r.image_url, r.image_alt, r.image_caption)
        ? { image: toImage(r.image_url, r.image_alt, r.image_caption) }
        : {}),
      curriculum: strArray(r.curriculum),
      detailHref: str(r.detail_href),
      seo: { title: str(r.seo_title), description: str(r.seo_description) },
    }));
  } catch {
    return regularClasses;
  }
}

/**
 * 정규 클래스 상세 — slug 단건 조회 (백로그 02 release gate G1).
 *
 * 목록(`getPublicRegularClasses`)은 `detail_html`을 일부러 뺀다 — 행마다
 * 수백 KB일 수 있는데 목록에서는 쓰지 않기 때문이다. 상세 페이지는 slug 하나만
 * 알면 되므로 목록을 통째로 읽어 find 하지 않고 여기서 단건으로 읽는다.
 *
 * 없거나 비공개면 null — 호출부가 notFound()를 부른다.
 */
export async function getPublicRegularClassBySlug(
  slug: string,
): Promise<RegularClassDetail | null> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("education_regular_classes")
      // 목록과 같은 컬럼 목록에 상세 전용 두 개만 더한다. 상수를 재사용해
      // 조합해야 목록에 컬럼이 늘어날 때 상세만 빠뜨리는 실수를 막을 수 있다.
      // 번들 경로를 공통 상수에 넣지 않는 이유는 detail_html과 같다 — 목록이
      // 쓰지도 않는 컬럼 때문에 /education까지 같이 깨질 이유가 없다.
      .select(`${REGULAR_CLASS_PUBLIC_COLUMNS},detail_html,detail_bundle_path`)
      .eq("slug", slug)
      .maybeSingle();
    // 조회는 됐는데 행이 없다 = 관리자가 지웠거나 비공개다(RLS). 이건 진짜 404다.
    if (!error && !data) return null;
    // 조회 자체가 실패했다 = 장애다. 목록은 이때 정적 4행으로 폴백하므로
    // 여기서 404를 내면 목록에는 있는 카드가 전부 깨진 링크가 된다(03-데이터흐름 §3).
    if (error) return fallbackRegularClassBySlug(slug);
    // supabase-js는 select()에 리터럴이 아닌 string이 오면 컬럼 타입 추론을
    // 포기하고 GenericStringError로 떨어뜨린다. 런타임 모양은 평범한 행이라
    // getPublicRegularClasses()와 같은 방식으로 unknown을 거쳐 좁힌다.
    const r = data as unknown as Row;
    /*
     * 번들 폴더 경로만 저장돼 있고 URL은 여기서 조립한다.
     *
     * **Storage 공개 URL이 아니라 우리 라우트(`/course-assets/...`)를 가리킨다.**
     * Supabase Storage가 HTML을 의도적으로 `text/plain`으로 내려서, 공개 URL을
     * 그대로 열면 페이지가 아니라 소스 코드가 보이기 때문이다. 그 라우트가
     * 올바른 Content-Type과 `CSP: sandbox`를 붙여 다시 내보낸다 —
     * 판단 근거는 `src/app/course-assets/[...path]/route.ts` 머리 주석과
     * 백로그 06 03-화면구조-결정.md D2-정정.
     */
    const bundleUrl = opt(r.detail_bundle_path)
      ? `${route.courseAssets}/${opt(r.detail_bundle_path)}index.html`
      : undefined;
    return {
      slug: str(r.slug),
      index: str(r.index_label),
      name: str(r.name),
      subtitle: str(r.subtitle),
      description: str(r.description),
      duration: str(r.duration),
      level: str(r.level),
      scheduleType: (str(r.schedule_type) ||
        "multi") as RegularClass["scheduleType"],
      ...(opt(r.start_date) ? { startDate: opt(r.start_date) } : {}),
      ...(opt(r.end_date) ? { endDate: opt(r.end_date) } : {}),
      tracks: strArray(r.tracks) as RegularClass["tracks"],
      accent: str(r.accent) as Accent,
      ...(toImage(r.image_url, r.image_alt, r.image_caption)
        ? { image: toImage(r.image_url, r.image_alt, r.image_caption) }
        : {}),
      curriculum: strArray(r.curriculum),
      detailHref: str(r.detail_href),
      seo: { title: str(r.seo_title), description: str(r.seo_description) },
      ...(opt(r.detail_html) ? { detailHtml: opt(r.detail_html) } : {}),
      ...(bundleUrl ? { bundleUrl } : {}),
    };
  } catch {
    // createSupabasePublicClient()가 env 없이 던지는 경우 등 — 장애로 본다.
    return fallbackRegularClassBySlug(slug);
  }
}

/**
 * 장애 시에만 쓰는 정적 폴백. **행이 없어서 404인 경우에는 절대 부르지 않는다** —
 * 그러면 관리자가 지운 과정의 상세 페이지가 계속 살아 있게 된다.
 *
 * 폴백에는 `detailHtml`이 없다. 정적 데이터에 본문이 없기도 하고, 장애 중에
 * 오래된 본문을 보여주느니 커리큘럼 기반 기본 레이아웃이 낫다. `bundleUrl`도
 * 같은 이유로 없다 — 장애 중에 정적 데이터로 없는 링크를 지어낼 수 없다.
 */
function fallbackRegularClassBySlug(slug: string): RegularClassDetail | null {
  return regularClasses.find((c) => c.slug === slug) ?? null;
}

/**
 * 상세 페이지 하단 "다른 과정" 블록이 쓰는 형제 과정 목록
 * (백로그 06 [03-화면구조-결정.md](../../backlogs/06-course-detail-page-redesign/03-화면구조-결정.md) D6).
 *
 * 목록 리더를 그대로 재사용한다 — 상세 전용 쿼리를 또 만들면 공개 컬럼이
 * 늘어날 때 여기만 빠뜨린다. 목록 리더가 이미 장애 시 정적 폴백으로
 * 떨어지므로, 이 함수는 **결과가 비어도 그냥 빈 배열을 돌려준다.**
 * 다른 과정 블록이 없다고 상세 페이지가 깨질 이유는 없다 — 그래서 여기서는
 * 404도 폴백도 판단하지 않는다.
 */
export async function getPublicRegularClassSiblings(
  slug: string,
  limit = 3,
): Promise<RegularClass[]> {
  try {
    const all = await getPublicRegularClasses();
    return all.filter((c) => c.slug !== slug).slice(0, limit);
  } catch {
    return [];
  }
}

/** 03. 커뮤니티 클럽 — 기수. */
export async function getPublicClubCohorts(): Promise<ClubCohort[]> {
  return read(
    "education_club_cohorts",
    (rows) =>
      rows.map((r) => ({
        id: str(r.id),
        label: str(r.label),
        status: str(r.status) as ClubCohort["status"],
        recruitPeriod: str(r.recruit_period),
        runPeriod: str(r.run_period),
        ...(opt(r.price) ? { price: opt(r.price) } : {}),
        ...(opt(r.list_price) ? { listPrice: opt(r.list_price) } : {}),
        ...(opt(r.capacity) ? { capacity: opt(r.capacity) } : {}),
        ...(opt(r.note) ? { note: opt(r.note) } : {}),
        ctaDisabled: Boolean(r.cta_disabled),
        show: {
          price: Boolean(r.show_price),
          capacity: Boolean(r.show_capacity),
          schedule: Boolean(r.show_schedule),
          cta: Boolean(r.show_cta),
        },
      })),
    clubCohorts,
  );
}

/** 03. 커뮤니티 클럽 — 참여 유형. */
export async function getPublicClubTiers(): Promise<ClubTier[]> {
  return read(
    "education_club_tiers",
    (rows) =>
      rows.map((r) => ({
        name: str(r.name),
        role: str(r.role),
        points: strArray(r.points),
        accent: str(r.accent) as Accent,
        character: {
          src: str(r.character_src),
          width: Number(r.character_width) || 0,
          height: Number(r.character_height) || 0,
        },
      })),
    clubTiers,
  );
}

/**
 * 지난 프로그램 — 갤러리 이미지를 함께 읽어 붙인다.
 * 카드 배지 숫자가 대표 1장 + 갤러리 길이로 계산되므로 두 번 조회해서라도
 * 한 덩어리로 돌려준다(컴포넌트가 다시 조회하지 않게).
 */
export async function getPublicPastPrograms(): Promise<PastProgram[]> {
  try {
    const db = createSupabasePublicClient();
    const { data, error } = await db
      .from("education_past_programs")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return pastPrograms;

    const { data: images } = await db
      .from("education_past_program_images")
      .select("*")
      .order("sort_order", { ascending: true });

    const galleryByProgram = new Map<string, EduImage[]>();
    for (const image of (images ?? []) as Row[]) {
      const list = galleryByProgram.get(str(image.program_id)) ?? [];
      const mapped = toImage(image.image_url, image.alt, image.caption);
      if (mapped) list.push(mapped);
      galleryByProgram.set(str(image.program_id), list);
    }

    return (data as Row[]).map((r) => {
      const gallery = galleryByProgram.get(str(r.id)) ?? [];
      const cover = toImage(r.cover_image_url, r.cover_image_alt, r.cover_image_caption);
      return {
        slug: str(r.slug),
        title: str(r.title),
        category: str(r.category) as PastProgram["category"],
        period: str(r.period),
        audience: str(r.audience),
        duration: str(r.duration),
        summary: str(r.summary),
        outcome: str(r.outcome),
        accent: str(r.accent) as Accent,
        coverImage: {
          ...(cover ?? { src: "", alt: "" }),
          ...(r.cover_unoptimized ? { unoptimized: true } : {}),
        },
        ...(gallery.length > 0 ? { galleryImages: gallery } : {}),
      };
    });
  } catch {
    return pastPrograms;
  }
}

/** 후기 — 평균 별점은 저장하지 않고 목록에서 계산한다. */
export async function getPublicEducationReviews(): Promise<EduReview[]> {
  return read(
    "education_reviews",
    (rows) =>
      rows.map((r) => ({
        id: str(r.key),
        rating: Number(r.rating) || 0,
        body: str(r.body),
        author: str(r.author),
        program: str(r.program),
        date: str(r.date_label),
        accent: str(r.accent) as Accent,
      })),
    eduReviews,
  );
}

/** FAQ — ver3에서 개인/기업 구분이 없어져 단일 목록이다. */
export async function getPublicEducationFaqs(): Promise<FaqItem[]> {
  return read(
    "education_faqs",
    (rows) =>
      rows.map((r) => ({
        id: str(r.key),
        question: str(r.question),
        answer: str(r.answer),
      })),
    eduFaqs,
  );
}

/** 교육 성과 수치 — 홈의 stats와 다른 항목이라 테이블도 다르다. */
export async function getPublicEducationStats(): Promise<EduStat[]> {
  return read(
    "education_stats",
    (rows) => rows.map((r) => ({ value: str(r.value), label: str(r.label) })),
    eduStats,
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 핵심 비즈니스 (What We Do) — 카드 3장과 사례 슬라이드.
//
// 카드의 **동작**(사례 모달을 여는가, /education으로 보내는가)과 도형 아이콘은
// DB에 두지 않는다. 그것들은 콘텐츠가 아니라 화면 구조라 바꾸려면 코드가
// 함께 바뀌어야 한다. DB가 갖는 것은 문구·태그·이미지·색이다.
// ─────────────────────────────────────────────────────────────────────────

export type PublicPillar = {
  key: PillarKey;
  title: string;
  description: string;
  tags: string[];
  imageUrl?: string;
  imageAlt: string;
  accent: Accent;
};

export type PublicPillarExample = PillarExample & { pillarKey: PillarKey };

/** 정적 폴백 — DB가 비었거나 조회가 실패해도 홈은 지금 모습 그대로 나온다. */
const fallbackPillars: PublicPillar[] = [
  {
    key: "software",
    title: "Software",
    description: "웹·앱 서비스와 업무 시스템을 기획하고 개발합니다.",
    tags: ["웹 서비스", "모바일 앱", "관리자 시스템", "내부 운영 도구"],
    imageUrl: "/work/software-overview-v2.png",
    imageAlt:
      "소프트웨어 제작 범위 — 웹, 모바일 앱, 관리자 시스템, 내부 운영 도구 화면 모음",
    accent: "blue",
  },
  {
    key: "ai",
    title: "AI Solutions",
    description:
      "반복 업무를 줄이고 의사결정을 돕는 맞춤형 AI 솔루션을 구축합니다.",
    tags: ["AI 챗봇", "AI 에이전트", "업무 자동화", "사내 AI Tool"],
    imageUrl: "/work/ai-solutions-overview.png",
    imageAlt:
      "AI 솔루션 화면 — 매출 리포트를 요약하는 어시스턴트와 자동화된 작업 목록",
    accent: "red",
  },
  {
    key: "education",
    title: "Education",
    description: "AI를 실제 업무에 활용할 수 있도록 실습 중심의 교육을 제공합니다.",
    tags: ["조직·기업 맞춤 교육", "정규 클래스", "지식 공유 커뮤니티 클럽"],
    imageUrl: "/education/education-lecture-01.jpg",
    imageAlt:
      "교육 현장 — 강사가 화면을 가리키며 설명하고 수강생들이 각자 노트북으로 따라 하는 강의실",
    accent: "mint",
  },
];

const fallbackPillarExamples: PublicPillarExample[] = [
  ...softwareExamples.map((e) => ({ ...e, pillarKey: "software" as PillarKey })),
  ...aiExamples.map((e) => ({ ...e, pillarKey: "ai" as PillarKey })),
];

export async function getPublicPillars(): Promise<PublicPillar[]> {
  return read(
    "home_pillars",
    (rows) =>
      rows.map((r) => ({
        key: str(r.key) as PillarKey,
        title: str(r.title),
        description: str(r.description),
        tags: strArray(r.tags),
        ...(str(r.image_url) ? { imageUrl: str(r.image_url) } : {}),
        imageAlt: str(r.image_alt),
        accent: str(r.accent) as Accent,
      })),
    fallbackPillars,
  );
}

export async function getPublicPillarExamples(): Promise<PublicPillarExample[]> {
  return read(
    "home_pillar_examples",
    (rows) =>
      rows.map((r) => ({
        pillarKey: str(r.pillar_key) as PillarKey,
        id: str(r.key),
        name: str(r.name),
        ...(str(r.client) ? { client: str(r.client) } : {}),
        headline: str(r.headline),
        description: str(r.description),
        highlights: strArray(r.highlights),
        image: { src: str(r.image_url), alt: str(r.image_alt) },
        accent: str(r.accent) as Accent,
      })),
    fallbackPillarExamples,
  );
}
