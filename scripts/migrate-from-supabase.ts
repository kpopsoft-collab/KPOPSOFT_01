/**
 * Supabase → Neon(Postgres) + Vercel Blob 데이터 1회 이전.
 *
 *   bunx tsx scripts/migrate-from-supabase.ts            # 점검만(dry run, 아무것도 안 씀)
 *   bunx tsx scripts/migrate-from-supabase.ts --apply    # 실제 복사 (대상 테이블이 비어 있어야 함)
 *   bunx tsx scripts/migrate-from-supabase.ts --apply --reset   # 대상 테이블을 비우고 다시 복사
 *
 * - 원본: `.env`의 NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (REST·Storage API)
 * - 대상: `.env.local`의 DATABASE_URL_UNPOOLED(없으면 DATABASE_URL), BLOB_READ_WRITE_TOKEN
 *
 * 행은 `json_populate_recordset(NULL::<table>, $1)`로 넣는다 — 컬럼 타입(uuid·
 * text[]·timestamptz·bool)을 대상 테이블 정의에서 그대로 가져오므로 id와
 * created_at/updated_at이 원본 값 그대로 보존된다.
 *
 * Storage 파일은 `<bucket>/<path>`를 그대로 Blob pathname으로 올리고(src/lib/blob.ts
 * 규칙), 모든 행의 문자열 안 Supabase 공개 URL prefix를 Blob 공개 베이스 URL로
 * 바꾼다(detail_html 포함).
 *
 * 옛 `admin_users`(auth.users 참조, 비밀번호 없음)는 옮기지 않는다 —
 * scripts/admin-user.ts로 새로 만든다.
 */
import { config } from "dotenv";
import { put } from "@vercel/blob";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local" });
config({ path: ".env" });

const APPLY = process.argv.includes("--apply");
const RESET = process.argv.includes("--reset");

/** FK 순서(부모 먼저). admin_users는 일부러 뺐다. */
const TABLES = [
  "inquiries",
  "inquiry_types",
  "inquiry_subtypes",
  "work_items",
  "insights",
  "experts",
  "stats",
  "home_pillars",
  "home_pillar_examples",
  "education_org_training",
  "education_regular_classes",
  "education_regular_class_html_sources",
  "education_club_cohorts",
  "education_club_tiers",
  "education_past_programs",
  "education_past_program_images",
  "testimonials",
  "education_reviews",
  "education_faqs",
  "education_stats",
] as const;

const PAGE = 500;
const INSERT_CHUNK = 50;

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

const SUPABASE_URL = need("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
const SERVICE_KEY = need("SUPABASE_SERVICE_ROLE_KEY");
const DB_URL = process.env.DATABASE_URL_UNPOOLED ?? need("DATABASE_URL");
need("BLOB_READ_WRITE_TOKEN");

const SUPABASE_PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/`;
const sbHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

type Row = Record<string, unknown>;

// ── Supabase 읽기 ─────────────────────────────────────────────────────────

async function sbJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { ...sbHeaders, "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`Supabase ${path} → ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

/** PostgREST 루트의 OpenAPI 정의에서 노출된 테이블 목록을 얻는다. */
async function listSupabaseTables(): Promise<string[]> {
  const spec = await sbJson<{ definitions?: Record<string, unknown> }>("/rest/v1/");
  return Object.keys(spec.definitions ?? {}).sort();
}

/** 기본 키가 `id`가 아닌 테이블(페이지 정렬용). */
const ORDER_KEY: Record<string, string> = {
  education_regular_class_html_sources: "class_id",
};

async function readTable(table: string): Promise<Row[]> {
  const rows: Row[] = [];
  const order = ORDER_KEY[table] ?? "id";
  for (let offset = 0; ; offset += PAGE) {
    const page = await sbJson<Row[]>(
      `/rest/v1/${table}?select=*&order=${order}.asc&limit=${PAGE}&offset=${offset}`,
    );
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows;
}

type StorageItem = { name: string; id: string | null; metadata?: { mimetype?: string; size?: number } | null };

async function listBucket(bucket: string, prefix = ""): Promise<{ path: string; mimetype?: string }[]> {
  const out: { path: string; mimetype?: string }[] = [];
  for (let offset = 0; ; offset += 100) {
    const items = await sbJson<StorageItem[]>(`/storage/v1/object/list/${bucket}`, {
      method: "POST",
      body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: "name", order: "asc" } }),
    });
    for (const item of items) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        out.push(...(await listBucket(bucket, path))); // 폴더
      } else if (item.name !== ".emptyFolderPlaceholder") {
        out.push({ path, mimetype: item.metadata?.mimetype });
      }
    }
    if (items.length < 100) break;
  }
  return out;
}

// ── 메인 ─────────────────────────────────────────────────────────────────

async function main() {
  const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: DB_URL }) });
  console.log(APPLY ? "== APPLY 모드 ==" : "== DRY RUN (쓰기 없음, --apply로 실행) ==");

  try {
    // 1) 테이블 대조
    const sbTables = await listSupabaseTables();
    const missing = TABLES.filter((t) => !sbTables.includes(t));
    const extra = sbTables.filter((t) => !(TABLES as readonly string[]).includes(t) && t !== "admin_users");
    if (missing.length) console.log("⚠ Supabase에 없는 테이블(건너뜀):", missing.join(", "));
    if (extra.length) console.log("⚠ 이전 대상에 없는 Supabase 테이블:", extra.join(", "));

    // 2) 원본 읽기
    const data = new Map<string, Row[]>();
    for (const t of TABLES) {
      if (missing.includes(t)) continue;
      data.set(t, await readTable(t));
    }

    // 3) 대상 상태
    const targetCounts = new Map<string, number>();
    for (const t of TABLES) {
      const r = await db.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*)::bigint AS n FROM "${t}"`);
      targetCounts.set(t, Number(r[0].n));
    }
    const nonEmpty = TABLES.filter((t) => (targetCounts.get(t) ?? 0) > 0);

    // 4) Storage 목록
    const buckets = (await sbJson<{ id: string }[]>("/storage/v1/bucket")).map((b) => b.id).sort();
    const files: { bucket: string; path: string; mimetype?: string }[] = [];
    for (const b of buckets) {
      for (const f of await listBucket(b)) files.push({ bucket: b, ...f });
    }

    console.log("\n테이블                                   원본   대상(현재)");
    for (const t of TABLES) {
      console.log(`${t.padEnd(40)} ${String(data.get(t)?.length ?? "-").padStart(5)}  ${String(targetCounts.get(t)).padStart(5)}`);
    }
    console.log("\nStorage 버킷:", buckets.join(", ") || "(없음)");
    for (const b of buckets) console.log(`  ${b}: ${files.filter((f) => f.bucket === b).length}개`);

    if (!APPLY) return;

    if (nonEmpty.length && !RESET) {
      throw new Error(`대상 테이블이 비어 있지 않다: ${nonEmpty.join(", ")} — 다시 하려면 --reset`);
    }

    // 5) 파일 복사 → Blob 베이스 URL 확보
    let blobBase: string | null = null;
    let copied = 0;
    for (const f of files) {
      const res = await fetch(`${SUPABASE_PUBLIC_PREFIX}${f.bucket}/${encodeURI(f.path)}`);
      if (!res.ok) throw new Error(`다운로드 실패 ${f.bucket}/${f.path} → ${res.status}`);
      const body = Buffer.from(await res.arrayBuffer());
      const pathname = `${f.bucket}/${f.path}`;
      const blob = await put(pathname, body, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: f.mimetype ?? res.headers.get("content-type") ?? undefined,
      });
      blobBase ??= blob.url.slice(0, blob.url.length - encodeURI(pathname).length);
      copied += 1;
      if (copied % 25 === 0) console.log(`  파일 ${copied}/${files.length}`);
    }
    console.log(`파일 복사 ${copied}/${files.length}`);
    if (!blobBase && files.length) throw new Error("Blob 베이스 URL을 얻지 못했다");

    // 6) 행 복사 (URL 치환 포함)
    await db.$transaction(
      async (tx) => {
        if (RESET) {
          await tx.$executeRawUnsafe(
            `TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
          );
        }
        for (const t of TABLES) {
          const rows = data.get(t);
          if (!rows?.length) continue;
          for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
            let json = JSON.stringify(rows.slice(i, i + INSERT_CHUNK));
            if (blobBase) json = json.split(SUPABASE_PUBLIC_PREFIX).join(blobBase);
            await tx.$executeRawUnsafe(
              `INSERT INTO "${t}" SELECT * FROM json_populate_recordset(NULL::"${t}", $1::json)`,
              json,
            );
          }
        }
      },
      { timeout: 120_000, maxWait: 20_000 },
    );

    // 7) 검증
    let ok = true;
    console.log("\n검증                                     원본   대상");
    for (const t of TABLES) {
      const r = await db.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*)::bigint AS n FROM "${t}"`);
      const n = Number(r[0].n);
      const src = data.get(t)?.length ?? 0;
      if (n !== src) ok = false;
      console.log(`${t.padEnd(40)} ${String(src).padStart(5)}  ${String(n).padStart(5)} ${n === src ? "✓" : "✗"}`);
    }
    // 남은 Supabase URL이 있는지
    for (const t of TABLES) {
      const r = await db.$queryRawUnsafe<{ n: bigint }[]>(
        `SELECT count(*)::bigint AS n FROM "${t}" x WHERE row_to_json(x)::text LIKE '%' || $1 || '%'`,
        `${SUPABASE_URL.replace(/^https?:\/\//, "")}/storage/`,
      );
      if (Number(r[0].n) > 0) {
        ok = false;
        console.log(`⚠ ${t}: Supabase Storage URL이 남은 행 ${r[0].n}개`);
      }
    }
    console.log(ok ? "\n✅ 이전 완료" : "\n❌ 불일치가 있다 — 위 표 확인");
    if (!ok) process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e, e?.cause ?? "");
  process.exit(1);
});
