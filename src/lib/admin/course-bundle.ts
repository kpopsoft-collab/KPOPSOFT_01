/**
 * 과정 상세 번들(zip) 검증 유틸 — 순수 함수만.
 *
 * DOM도 Supabase도 fflate도 모른다. 그래야 `node --test`로 그대로 돌릴 수 있고
 * (course-bundle.test.ts), 업로드 위젯·서버 액션 양쪽에서 같이 쓸 수 있다.
 *
 * 근거 문서:
 *   docs/08-decisions/05-course-bundle-storage/03-보안판단.md §3-1(경로 거부),
 *   §3-2(파일명 인코딩), §4(확장자 허용목록), §4-1(Content-Type)
 *   docs/08-decisions/05-course-bundle-storage/04-데이터모델-DDL.md §2(버킷 정의)
 *   docs/08-decisions/05-course-bundle-storage/05-구현계획.md §3
 */

/**
 * 확장자 → Content-Type (03 §4, §4-1).
 *
 * Storage는 업로드 때 준 contentType을 그대로 되돌려준다. 안 주면
 * `application/octet-stream`이 되어 브라우저가 렌더 대신 다운로드한다.
 *
 * **값 집합(중복 제거)이 마이그레이션의 `allowed_mime_types`(04 §2, 15종)와
 * 정확히 같아야 한다.** 한쪽만 고치면 업로드가 원인 모를 오류로 실패한다 —
 * course-bundle.test.ts가 이 일치를 테스트로 박아 둔다.
 *
 * `.htm`→`text/html`, `.jpg`/`.jpeg`→`image/jpeg`, `.mjs`→`text/javascript`처럼
 * 여러 확장자가 한 MIME을 공유하므로 키는 18개, 값은 15종이다.
 */
export const EXT_MIME: Record<string, string> = {
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  js: "text/javascript",
  mjs: "text/javascript",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  avif: "image/avif",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
};

/**
 * 번들을 올리는 버킷 — 과정 이미지와 **같은 버킷**이다. 새로 파지 않은 이유는
 * public 여부와 정책 4건이 이미 필요한 모양 그대로여서다. 키가 겹치지 않는다:
 * 이미지는 `<uuid>.<ext>`(루트), 번들은 `<uuid>/…`(폴더).
 * 이름이 여러 층에 흩어지지 않도록 여기 한 곳에만 둔다.
 */
export const BUNDLE_BUCKET = "education";

/** 번들 하나의 파일 개수 상한. */
export const MAX_FILES = 300;
/** 압축을 푼 총 용량 상한 — zip bomb 방어(03 §3). */
export const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
/**
 * 파일 하나의 상한. 버킷 `file_size_limit`(5242880)과 **같은 값이어야 한다.**
 * 버킷을 이미지와 공유하므로 번들 때문에 그쪽 제약을 풀지 않고 이쪽을 맞췄다 —
 * 총량 상한이 20MB라 실질적인 제약은 아니다.
 */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * 번들 폴더 경로 모양 — `<uuid>/` 한 세그먼트.
 * DB CHECK(04 §2)와 같은 정규식이다. 삭제 루틴이 임의 prefix를 지우지 못하게
 * 하는 것이 목적이다(03 §3-1).
 */
export const BUNDLE_PATH_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/$/;

const INDEX_HTML = "index.html";

/** `a/b/c.png` → `c.png` */
function basenameOf(name: string): string {
  const i = name.lastIndexOf("/");
  return i === -1 ? name : name.slice(i + 1);
}

/**
 * 확장자를 소문자로. 없으면 빈 문자열.
 *
 * export하는 이유 — 자료를 되돌려 주는 라우트(`/course-assets`)가 응답의
 * Content-Type을 여기 `EXT_MIME`으로 정한다. 업로드 때 허용한 확장자 목록과
 * 내보낼 때 붙이는 MIME이 **같은 함수·같은 표**에서 나와야 한쪽만 늘어나
 * 어긋나는 일이 없다.
 */
export function extensionOf(name: string): string {
  const base = basenameOf(name);
  const i = base.lastIndexOf(".");
  if (i <= 0) return ""; // 확장자 없음. `.DS_Store`처럼 점으로 시작만 하는 것도 없음 취급
  return base.slice(i + 1).toLowerCase();
}

/**
 * 압축 프로그램이 끼워 넣는 것들 — 조용히 버린다(03 §3-1의 "무시" 목록).
 * `__MACOSX/` 하위, `.DS_Store`, `Thumbs.db`, `.` 로 시작하는 디렉터리.
 */
export function isJunkEntry(name: string): boolean {
  const segments = name.split("/");
  for (let i = 0; i < segments.length - 1; i += 1) {
    const seg = segments[i];
    if (seg === "__MACOSX") return true;
    // `.` 로 시작하는 디렉터리(.git/, .vscode/ …). `.`/`..` 자체는 junk가 아니라
    // checkEntryName이 거부해야 할 대상이므로 여기서 걸러 내지 않는다.
    if (seg.startsWith(".") && seg !== "." && seg !== "..") return true;
  }
  const base = basenameOf(name).toLowerCase();
  return base === ".ds_store" || base === "thumbs.db";
}

/**
 * 03 §3-1의 거부 규칙. 통과하면 null, 아니면 사람이 읽는 한국어 이유.
 *
 * zip 엔트리 이름은 파일 안에 적힌 임의 문자열이라 신뢰할 수 없다. 그대로
 * Storage 키에 붙이면 `../../other/index.html`이 의도한 prefix 밖으로 쓴다.
 *
 * `./index.html`은 **정규화하지 않고 거부한다** — 정규화는 "무엇이 안전한가"의
 * 판단을 한 겹 늘린다. 정상적인 zip은 이런 이름을 만들지 않는다.
 */
export function checkEntryName(name: string): string | null {
  if (name === "") return "파일 이름이 비어 있습니다.";
  if (name.includes("\0")) return "파일 이름에 널바이트가 들어 있습니다.";
  if (name.includes("\\")) return "파일 이름에 역슬래시(\\)가 들어 있습니다.";
  if (name.startsWith("/")) return "절대경로는 올릴 수 없습니다.";

  // supabase-js는 업로드 경로를 인코딩하지 않고 URL에 그대로 붙인다
  // (storage-js `_getFinalPath`). `#` 뒤는 프래그먼트로, `?` 뒤는 쿼리로 잘려
  // **다른 키로 조용히 올라간다** — 위젯은 성공을 띄우고 이미지만 404가 난다.
  // `%`는 서버가 디코드할 여지를 남기므로 같이 막는다. HTML 안의
  // `<img src="a #2.png">`도 어차피 프래그먼트로 잘리니 잃는 것이 없다.
  if (/[#?%]/.test(name)) return "파일 이름에 # ? % 는 쓸 수 없습니다.";

  const segments = name.split("/");
  for (const seg of segments) {
    if (seg === "") return "빈 경로 세그먼트가 있습니다.";
    if (seg === "..") return "상위 디렉터리 참조(..)는 올릴 수 없습니다.";
    if (seg === ".") return "현재 디렉터리 참조(.)는 올릴 수 없습니다.";
    if (/^[A-Za-z]:/.test(seg)) return "드라이브 문자가 들어 있습니다.";
  }
  return null;
}

export type BundleFile = { from: string; to: string; mime: string };
export type BundlePlan =
  | { ok: true; files: BundleFile[]; warnings: string[] }
  | { ok: false; error: string };

/**
 * 엔트리 목록을 Storage에 올릴 모양으로 정규화한다.
 *
 * - 디렉터리 엔트리(`/`로 끝나는 것)와 junk(03 §3-1)는 버린다
 * - 가장 얕은 `index.html`이 있는 디렉터리를 루트로 잡아 공통 접두사를 벗긴다
 *   (zip이 폴더 하나로 감싸인 흔한 경우). `index.html`이 없으면 실패
 * - 확장자·개수·용량 한도를 본다. 위반은 실패 + 파일명을 포함한 메시지
 * - ASCII 밖 파일명은 막지 않고 warnings에 담는다(03 §3-2)
 *
 * **부분 성공은 없다.** 하나라도 걸리면 아무것도 반환하지 않는다 — 빠진 파일
 * 때문에 화면이 깨졌을 때 원인을 알 수 있어야 한다(03 §4).
 */
export function planBundle(entries: { name: string; size: number }[]): BundlePlan {
  // ① 디렉터리 엔트리를 뺀 전부에 경로 검증을 먼저 돌린다.
  //    junk보다 먼저 보는 이유 — 악의적인 이름은 버려지더라도 조용히 넘어가지 않는다.
  const named = entries.filter((e) => !e.name.endsWith("/"));
  for (const e of named) {
    const reason = checkEntryName(e.name);
    if (reason) return { ok: false, error: `${e.name} — ${reason}` };
  }

  // ② junk를 버린다.
  const files = named.filter((e) => !isJunkEntry(e.name));

  // ③ 가장 얕은 index.html이 루트다.
  const indexes = files.filter(
    (e) => e.name === INDEX_HTML || e.name.endsWith(`/${INDEX_HTML}`),
  );
  if (indexes.length === 0) {
    return {
      ok: false,
      error: "zip 안에 index.html이 없습니다. 진입 파일 이름을 index.html로 맞춰 주세요.",
    };
  }
  const depthOf = (n: string) => n.split("/").length;
  const entry = indexes.reduce((a, b) => {
    const d = depthOf(a.name) - depthOf(b.name);
    return d !== 0 ? (d < 0 ? a : b) : a.name <= b.name ? a : b;
  });
  const root = entry.name.slice(0, entry.name.length - INDEX_HTML.length); // "" 또는 "mysite/"

  // ④ 개수 한도.
  if (files.length > MAX_FILES) {
    return {
      ok: false,
      error: `파일이 너무 많습니다 — ${files.length}개(최대 ${MAX_FILES}개).`,
    };
  }

  // ⑤ 파일별 검사.
  const out: BundleFile[] = [];
  const warnings: string[] = [];
  let total = 0;

  for (const e of files) {
    if (!e.name.startsWith(root)) {
      return {
        ok: false,
        error: `루트 폴더(${root || "/"}) 밖의 파일이 있습니다: ${e.name}`,
      };
    }
    const to = e.name.slice(root.length);

    const ext = extensionOf(to);
    if (ext === "") {
      return { ok: false, error: `확장자가 없는 파일은 올릴 수 없습니다: ${e.name}` };
    }
    const mime = EXT_MIME[ext];
    if (!mime) {
      return {
        ok: false,
        error: `허용하지 않는 확장자입니다(.${ext}): ${e.name}`,
      };
    }

    if (e.size > MAX_FILE_BYTES) {
      return {
        ok: false,
        error: `파일 하나가 ${MAX_FILE_BYTES / 1024 / 1024}MB를 넘습니다: ${e.name}`,
      };
    }
    total += e.size;

    // 03 §3-2 — macOS zip의 NFD 한글, 윈도 압축의 CP949는 우리가 완전히 고칠 수
    // 없다. 막지 않고 알려만 준다.
    if (!/^[\x20-\x7e]*$/.test(to)) {
      warnings.push(
        `파일명에 영문·숫자 밖의 문자가 있습니다: ${to} — 이미지가 보이지 않으면 파일명을 영문으로 바꿔 다시 올려 주세요.`,
      );
    }

    out.push({ from: e.name, to, mime });
  }

  if (total > MAX_TOTAL_BYTES) {
    return {
      ok: false,
      error: `압축을 푼 총 용량이 ${MAX_TOTAL_BYTES / 1024 / 1024}MB를 넘습니다.`,
    };
  }

  return { ok: true, files: out, warnings };
}

export type BundleListEntry = { name: string; id: string | null };

/** 무한 순회 방어 — 번들 구조가 이보다 깊을 이유가 없다. */
const MAX_WALK_DEPTH = 10;

/**
 * Storage 폴더를 재귀 순회해 객체 전체 경로를 모은다(05 §5-1).
 *
 * Supabase Storage의 `list()`는 **재귀가 아니고**, 하위 폴더는 `id === null`인
 * 항목으로 온다. 번들에는 `images/` 같은 하위 폴더가 있으므로 한 번 호출로는
 * 다 못 지운다.
 *
 * lister를 주입받아 이 모듈이 Supabase를 모른 채로 둔다 — 그래야 테스트가 된다.
 * `prefix`는 BUNDLE_PATH_RE를 통과해야 한다. 아니면 빈 배열을 돌려준다
 * (삭제 루틴이 임의 prefix를 지우지 못하게 하는 방어선 — 03 §3-1).
 */
export async function walkBundle(
  prefix: string,
  list: (prefix: string) => Promise<BundleListEntry[]>,
): Promise<string[]> {
  if (!BUNDLE_PATH_RE.test(prefix)) return [];

  const paths: string[] = [];
  const seen = new Set<string>([prefix]);
  let level: string[] = [prefix];

  for (let depth = 0; depth < MAX_WALK_DEPTH && level.length > 0; depth += 1) {
    const next: string[] = [];
    for (const dir of level) {
      const entries = await list(dir);
      for (const item of entries) {
        // 이름은 한 세그먼트여야 한다. 이상하면 그냥 건너뛴다.
        if (!item.name || item.name.includes("/")) continue;
        const full = `${dir}${item.name}`;
        if (item.id === null) {
          const child = `${full}/`;
          if (!seen.has(child)) {
            seen.add(child);
            next.push(child);
          }
        } else {
          paths.push(full);
        }
      }
    }
    level = next;
  }

  return paths;
}
