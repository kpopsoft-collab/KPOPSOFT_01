/**
 * course-bundle.ts 테스트.
 *
 * `node --test`로 돌린다. 경로 별칭(`@/`)이 안 먹으므로 상대 경로로
 * import한다. 케이스는
 * docs/08-decisions/05-course-bundle-storage/06-검증체크리스트.md §1 전부.
 *
 * import에 `.ts` 확장자를 그대로 쓴다 — `node --test`가 이 파일을 직접 실행하므로
 * 특정자에 실제 확장자가 있어야 모듈을 찾는다. tsconfig의
 * `allowImportingTsExtensions`가 이를 허용한다(noEmit이라 부작용 없음).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  BUNDLE_PATH_RE,
  EXT_MIME,
  MAX_FILES,
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES,
  checkEntryName,
  isJunkEntry,
  planBundle,
  walkBundle,
  type BundleListEntry,
} from "./course-bundle.ts";

/** 실패 이유를 꺼내 쓰기 위한 헬퍼. */
function planError(entries: { name: string; size: number }[]): string {
  const plan = planBundle(entries);
  assert.equal(plan.ok, false, "실패해야 하는 입력이 통과했다");
  return plan.ok ? "" : plan.error;
}

function planOk(entries: { name: string; size: number }[]) {
  const plan = planBundle(entries);
  assert.equal(plan.ok, true, plan.ok ? "" : `실패하면 안 되는 입력이 거부됐다: ${plan.error}`);
  if (!plan.ok) throw new Error("unreachable");
  return plan;
}

const f = (name: string, size = 10) => ({ name, size });

// ---- 06 §1: 경로 거부 (03 §3-1) --------------------------------------------

test("`../../evil.html` — 상위 디렉터리 참조는 거부", () => {
  assert.ok(checkEntryName("../../evil.html"));
  assert.match(planError([f("index.html"), f("../../evil.html")]), /evil\.html/);
});

test("`a/../../evil.html` — 중간 세그먼트의 ..도 거부", () => {
  assert.ok(checkEntryName("a/../../evil.html"));
  assert.match(planError([f("index.html"), f("a/../../evil.html")]), /evil\.html/);
});

test("`/etc/passwd` — 절대경로는 거부", () => {
  const reason = checkEntryName("/etc/passwd");
  assert.ok(reason);
  assert.match(reason, /절대경로/);
});

test("`C:\\x\\index.html` — 드라이브 문자·역슬래시는 거부", () => {
  assert.ok(checkEntryName("C:\\x\\index.html"));
  // 역슬래시가 없어도 드라이브 문자만으로 거부된다
  const reason = checkEntryName("C:/x/index.html");
  assert.ok(reason);
  assert.match(reason, /드라이브/);
});

test("`a//b.png` — 빈 세그먼트는 거부", () => {
  const reason = checkEntryName("a//b.png");
  assert.ok(reason);
  assert.match(reason, /빈 경로 세그먼트/);
});

test("`a\\0b.png` — 널바이트는 거부", () => {
  const reason = checkEntryName("a\0b.png");
  assert.ok(reason);
  assert.match(reason, /널바이트/);
});

test("`#`·`?`·`%` — URL에서 잘리는 문자는 거부 (교차검증 M1)", () => {
  // supabase-js가 경로를 인코딩하지 않아 `#` 뒤가 프래그먼트로 잘린다.
  // 막지 않으면 다른 키로 조용히 올라가고 이미지만 404가 난다.
  for (const name of ["guide #2.png", "a?b.png", "a%2fb.png"]) {
    const reason = checkEntryName(name);
    assert.ok(reason, `${name}은 거부돼야 한다`);
    assert.match(reason, /# \? %/);
  }
  assert.match(planError([f("index.html"), f("guide #2.png")]), /guide #2\.png/);
});

test("`./index.html` — 정규화하지 않고 거부한다(둘 중 이쪽으로 정했다)", () => {
  const reason = checkEntryName("./index.html");
  assert.ok(reason, "정규화가 아니라 거부다");
  assert.match(reason, /현재 디렉터리/);
  assert.match(planError([f("./index.html")]), /index\.html/);
});

test("정상 이름은 통과한다", () => {
  assert.equal(checkEntryName("index.html"), null);
  assert.equal(checkEntryName("images/a.png"), null);
  assert.equal(checkEntryName("assets/css/main.css"), null);
  assert.equal(checkEntryName("a.b/c.png"), null, "점이 든 폴더 이름은 `.`/`..`이 아니다");
});

// ---- 06 §1: 무시 항목 -------------------------------------------------------

test("__MACOSX 하위 · .DS_Store · Thumbs.db는 조용히 제외된다", () => {
  assert.ok(isJunkEntry("__MACOSX/._index.html"));
  assert.ok(isJunkEntry(".DS_Store"));
  assert.ok(isJunkEntry("images/.DS_Store"));
  assert.ok(isJunkEntry("Thumbs.db"));
  assert.ok(isJunkEntry("images/Thumbs.db"));
  assert.ok(isJunkEntry(".git/config"), "`.`으로 시작하는 디렉터리");
  assert.ok(!isJunkEntry("index.html"));
  assert.ok(!isJunkEntry("images/a.png"));

  const plan = planOk([
    f("index.html"),
    f("__MACOSX/._index.html"),
    f(".DS_Store"),
    f("images/Thumbs.db"),
    f("images/a.png"),
  ]);
  assert.deepEqual(
    plan.files.map((x) => x.to),
    ["index.html", "images/a.png"],
  );
});

test("무시 항목만 있는 zip은 `index.html이 없다`로 실패한다(빈 번들이 만들어지지 않는다)", () => {
  const error = planError([f("__MACOSX/._index.html"), f(".DS_Store"), f("Thumbs.db")]);
  assert.match(error, /index\.html/);
});

test("디렉터리 엔트리(`/`로 끝나는 것)는 파일로 세지 않는다", () => {
  const plan = planOk([f("mysite/", 0), f("mysite/images/", 0), f("mysite/index.html")]);
  assert.deepEqual(
    plan.files.map((x) => x.to),
    ["index.html"],
  );
});

// ---- 06 §1: 정규화 ----------------------------------------------------------

test("폴더 하나로 감싸인 zip은 공통 접두사가 벗겨진다", () => {
  const plan = planOk([f("mysite/index.html"), f("mysite/images/a.png")]);
  assert.deepEqual(plan.files, [
    { from: "mysite/index.html", to: "index.html", mime: "text/html" },
    { from: "mysite/images/a.png", to: "images/a.png", mime: "image/png" },
  ]);
});

test("index.html이 둘이면 얕은 쪽이 루트다", () => {
  const plan = planOk([f("sub/index.html"), f("index.html"), f("sub/a.css")]);
  assert.deepEqual(
    plan.files.map((x) => x.to).sort(),
    ["index.html", "sub/a.css", "sub/index.html"],
  );
});

test("같은 깊이에 index.html이 둘이면 엔트리 순서와 무관하게 같은 결과가 나온다", () => {
  // 루트가 둘일 수는 없으므로 이름순으로 앞선 `a/`를 루트로 잡고, 그 밖에 남는
  // `b/index.html`을 파일명과 함께 거부한다. 조용히 버리면 화면이 깨진 이유를
  // 알 수 없다(03 §4).
  const one = planError([f("a/index.html"), f("b/index.html")]);
  const other = planError([f("b/index.html"), f("a/index.html")]);
  assert.equal(one, other, "엔트리 순서가 결과를 바꾸면 안 된다");
  assert.match(one, /b\/index\.html/);
});

test("index.html이 없으면 실패하고 메시지에 그 사실이 나온다", () => {
  const error = planError([f("main.html"), f("images/a.png")]);
  assert.match(error, /index\.html/);
});

test("루트 폴더 밖의 파일은 파일명을 찍어 거부한다", () => {
  const error = planError([f("mysite/index.html"), f("other/a.png")]);
  assert.match(error, /other\/a\.png/);
});

// ---- 06 §1: 한도 · 확장자 ---------------------------------------------------

test("확장자 목록 밖(.exe, .php)은 파일명을 포함한 메시지로 거부한다", () => {
  const exe = planError([f("index.html"), f("bin/setup.exe")]);
  assert.match(exe, /bin\/setup\.exe/);
  const php = planError([f("index.html"), f("shell.php")]);
  assert.match(php, /shell\.php/);
});

test("확장자가 없는 파일도 파일명을 찍어 거부한다", () => {
  assert.match(planError([f("index.html"), f("LICENSE")]), /LICENSE/);
});

test("허용 확장자는 전부 통과하고 각자의 MIME이 붙는다", () => {
  const names = Object.keys(EXT_MIME).map((ext) => `a-${ext}.${ext}`);
  const plan = planOk([f("index.html"), ...names.map((n) => f(n))]);
  for (const file of plan.files) {
    const ext = file.to.slice(file.to.lastIndexOf(".") + 1);
    assert.equal(file.mime, EXT_MIME[ext], `${file.to}의 MIME`);
  }
});

test("대문자 확장자(.PNG)도 같은 MIME으로 받는다", () => {
  const plan = planOk([f("index.html"), f("images/A.PNG")]);
  assert.equal(plan.files[1].mime, "image/png");
});

test(`파일 ${MAX_FILES}개 초과는 거부한다`, () => {
  const many = Array.from({ length: MAX_FILES }, (_, i) => f(`img/${i}.png`));
  planOk([f("index.html"), ...many.slice(0, MAX_FILES - 1)]); // 정확히 300개는 통과
  assert.match(planError([f("index.html"), ...many]), /파일이 너무 많습니다/);
});

test("압축 해제 총합 20MB 초과는 거부한다(zip bomb 방어)", () => {
  const fourMb = 4 * 1024 * 1024;
  // 합 24MB. 개별은 전부 MAX_FILE_BYTES(5MB) 미만이라 개별 한도가 먼저 걸리지 않는다.
  const entries = [f("index.html", fourMb), ...Array.from({ length: 5 }, (_, i) => f(`a${i}.png`, fourMb))];
  assert.ok(entries.every((e) => e.size <= MAX_FILE_BYTES), "개별 한도에 먼저 걸리면 안 된다");
  assert.match(planError(entries), /총 용량/);
});

test("단일 파일 5MB 초과는 거부한다(버킷 file_size_limit과 같은 값)", () => {
  // education 버킷을 이미지와 공유하므로 그쪽 file_size_limit(5242880)에 맞췄다.
  assert.equal(MAX_FILE_BYTES, 5242880, "education 버킷의 file_size_limit과 같아야 한다");
  planOk([f("index.html"), f("big.png", MAX_FILE_BYTES)]); // 딱 5MB는 통과
  assert.match(planError([f("index.html"), f("big.png", MAX_FILE_BYTES + 1)]), /big\.png/);
});

test("MAX_TOTAL_BYTES / MAX_FILES 상수값이 05 §3과 같다", () => {
  assert.equal(MAX_FILES, 300);
  assert.equal(MAX_TOTAL_BYTES, 20 * 1024 * 1024);
});

// ---- 06 §1: EXT_MIME ↔ 버킷 allowed_mime_types -------------------------------

/**
 * 출처: 04-데이터모델-DDL.md §2 / 마이그레이션
 * `supabase/migrations/20260804090000_course_bundle_storage.sql`의
 * `allowed_mime_types`와 **같은 집합**이어야 한다.
 * 한쪽만 고치면 업로드가 원인 모를 오류로 실패한다(03 §4-1).
 */
const BUCKET_ALLOWED_MIME_TYPES = [
  "text/html",
  "text/css",
  "text/javascript",
  "application/json",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "image/x-icon",
  "font/woff",
  "font/woff2",
  "font/ttf",
  "font/otf",
];

test("EXT_MIME의 값 집합이 버킷 allowed_mime_types와 정확히 일치한다", () => {
  const values = [...new Set(Object.values(EXT_MIME))].sort();
  assert.deepEqual(values, [...BUCKET_ALLOWED_MIME_TYPES].sort());
  assert.equal(values.length, 15, "04 §2는 15종이다");
});

test("EXT_MIME의 키가 03 §4 허용목록 그대로다", () => {
  const allowed =
    "html htm css js mjs json png jpg jpeg webp gif svg ico avif woff woff2 ttf otf".split(" ");
  assert.deepEqual(Object.keys(EXT_MIME).sort(), allowed.sort());
});

test("마이그레이션 파일의 allowed_mime_types가 위 리터럴과 같다(드리프트 감지)", () => {
  // 마이그레이션이 아직 없으면(다른 단계와 동시 작업) 조용히 건너뛴다 —
  // 위 두 테스트가 EXT_MIME 쪽은 이미 고정해 둔다.
  const sql = readMigrationSql();
  if (sql === null) return;
  const m = /array\[([^\]]*)\]/.exec(sql);
  assert.ok(m, "마이그레이션에서 allowed_mime_types 배열을 찾지 못했다");
  const inSql = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  assert.deepEqual(inSql.sort(), [...BUCKET_ALLOWED_MIME_TYPES].sort());
});

function readMigrationSql(): string | null {
  const rel = "supabase/migrations/20260804090000_course_bundle_storage.sql";
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    const candidate = path.join(dir, rel);
    if (fs.existsSync(candidate)) return fs.readFileSync(candidate, "utf8");
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

// ---- 06 §1: 경고(막지 않음) — 03 §3-2 ---------------------------------------

test("한글·비ASCII 파일명은 warnings에 담기고 업로드는 진행된다", () => {
  const plan = planOk([f("index.html"), f("images/사진.png")]);
  assert.equal(plan.files.length, 2);
  assert.equal(plan.files[1].to, "images/사진.png");
  assert.equal(plan.warnings.length, 1);
  assert.match(plan.warnings[0], /사진\.png/);
});

test("ASCII만 있는 번들은 warnings가 비어 있다", () => {
  assert.deepEqual(planOk([f("index.html"), f("images/a.png")]).warnings, []);
});

// ---- BUNDLE_PATH_RE ---------------------------------------------------------

test("BUNDLE_PATH_RE는 `<uuid>/` 한 세그먼트만 통과시킨다", () => {
  assert.ok(BUNDLE_PATH_RE.test("11111111-2222-3333-4444-555555555555/"));
  assert.ok(!BUNDLE_PATH_RE.test("11111111-2222-3333-4444-555555555555"), "끝 / 없음");
  assert.ok(!BUNDLE_PATH_RE.test("11111111-2222-3333-4444-555555555555/x/"), "세그먼트 2개");
  assert.ok(!BUNDLE_PATH_RE.test("../other/"), "경로 탈출");
  assert.ok(!BUNDLE_PATH_RE.test("abc"), "UUID 아님");
  assert.ok(!BUNDLE_PATH_RE.test(""), "빈 문자열");
  assert.ok(BUNDLE_PATH_RE.test("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/"));
  assert.ok(
    !BUNDLE_PATH_RE.test("AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE/"),
    "대문자 UUID는 crypto.randomUUID()가 만들지 않는다 — DB CHECK와 같은 정규식이다",
  );
});

// ---- walkBundle (05 §5-1) ---------------------------------------------------

const UUID = "11111111-2222-3333-4444-555555555555";

/** 전체 경로 목록으로 Supabase list()를 흉내 낸다 — 하위 폴더는 id === null. */
function fakeLister(objects: string[]) {
  const calls: string[] = [];
  const list = async (prefix: string): Promise<BundleListEntry[]> => {
    calls.push(prefix);
    const seen = new Map<string, BundleListEntry>();
    for (const obj of objects) {
      if (!obj.startsWith(prefix)) continue;
      const rest = obj.slice(prefix.length);
      const slash = rest.indexOf("/");
      if (slash === -1) seen.set(rest, { name: rest, id: `id-${obj}` });
      else seen.set(rest.slice(0, slash), { name: rest.slice(0, slash), id: null });
    }
    return [...seen.values()];
  };
  return { list, calls };
}

test("walkBundle은 하위 폴더 2단계까지 재귀해 전체 경로를 모은다", async () => {
  const objects = [
    `${UUID}/index.html`,
    `${UUID}/style.css`,
    `${UUID}/images/a.png`,
    `${UUID}/images/icons/b.svg`,
  ];
  const { list, calls } = fakeLister(objects);
  const found = await walkBundle(`${UUID}/`, list);
  assert.deepEqual(found.sort(), [...objects].sort());
  assert.deepEqual(calls.sort(), [
    `${UUID}/`,
    `${UUID}/images/`,
    `${UUID}/images/icons/`,
  ].sort());
});

test("walkBundle은 BUNDLE_PATH_RE 밖 prefix면 아무것도 조회하지 않고 빈 배열을 준다", async () => {
  for (const bad of ["", "../", "class-bundles/", `${UUID}`, `${UUID}/images/`, "a/b/"]) {
    const { list, calls } = fakeLister([`${UUID}/index.html`]);
    assert.deepEqual(await walkBundle(bad, list), [], `prefix: ${bad}`);
    assert.equal(calls.length, 0, `prefix ${bad}로 list()가 불리면 안 된다`);
  }
});

test("walkBundle은 빈 폴더에서 빈 배열을 준다", async () => {
  const { list } = fakeLister([]);
  assert.deepEqual(await walkBundle(`${UUID}/`, list), []);
});

test("walkBundle은 이상한 항목 이름을 건너뛴다", async () => {
  const list = async (prefix: string): Promise<BundleListEntry[]> =>
    prefix === `${UUID}/`
      ? [
          { name: "", id: "x" },
          { name: "a/b.png", id: "y" },
          { name: "index.html", id: "z" },
        ]
      : [];
  assert.deepEqual(await walkBundle(`${UUID}/`, list), [`${UUID}/index.html`]);
});
