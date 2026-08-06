import { createSupabasePublicClient } from "@/lib/supabase/public";
import {
  BUNDLE_BUCKET,
  BUNDLE_PATH_RE,
  EXT_MIME,
  extensionOf,
} from "@/lib/admin/course-bundle";

/**
 * 과정 상세 자료를 **원본 그대로 되돌려 주는** 라우트
 * (결정기록 06 [03-화면구조-결정.md] D2-정정).
 *
 * `/course-assets/<uuid>/index.html` → Storage `education/<uuid>/index.html`
 *
 * ## 왜 Storage 공개 URL을 직접 안 쓰나
 *
 * **Supabase Storage는 HTML을 의도적으로 `text/plain`으로 내려준다.**
 * 저장된 메타데이터가 `text/html`이어도 응답 헤더는 `text/plain`이라, 새 탭에
 * 열면 페이지가 아니라 **소스 코드가 그대로** 보인다. 남용·피싱 신고 대응을
 * 위한 플랫폼 정책이라 버킷 설정으로 못 바꾼다.
 *
 * 결정기록 05는 "Storage가 공개 `.html`을 그려 주는가"를 해소된 리스크로 적어
 * 뒀지만, 실제로 확인된 것은 **파일이 올라갔다**는 것뿐이었다. 2026-08-05에
 * 열어 보고 알았다 — 그래서 그때 올린 zip 번들도 같이 깨져 있었다.
 *
 * ## 그런데 결정기록 05 D4는 "우리 도메인 프록시 금지"였다
 *
 * 그 결정의 전제는 **Storage가 격리된 origin으로 동작한다**였다. 그 전제가
 * 성립하지 않으므로 결정을 다시 내렸다. D4가 지키려던 것(업로드된 JS가
 * kpopsoft.com의 세션·스토리지에 닿지 못하게)은 여기서
 * **`Content-Security-Policy: sandbox`** 로 지킨다 — `allow-same-origin`을
 * 주지 않으면 문서가 **불투명 origin(null)** 이 되어 same-origin 검사에 항상
 * 실패한다. `document.cookie`·`localStorage`·부모 창 DOM 어디에도 닿지 못한다.
 * 스크립트는 `allow-scripts`로 돌아가므로 자료는 만든 그대로 보인다.
 *
 * ## 무엇을 잠갔나
 *
 * | 항목 | 왜 |
 * |------|-----|
 * | `<uuid>/` 모양(`BUNDLE_PATH_RE`) 강제 | 버킷의 다른 키(과정 이미지)로 못 넘어간다 |
 * | **DB에 실제로 등록된 번들 경로만** 허용 | 우리 도메인이 임의 파일의 공개 프록시가 되지 않는다 |
 * | 확장자 허용목록(`EXT_MIME`) | 업로드 때 허용한 15종 밖은 안 내보낸다 |
 * | `X-Content-Type-Options: nosniff` | 우리가 정한 타입을 브라우저가 다시 추측하지 않게 |
 * | `X-Robots-Tag: noindex` | 자료가 상세 페이지 본체와 검색에서 경쟁하지 않게 |
 *
 * 경로 순회(`..`)는 세그먼트를 직접 검사한다 — Next가 이미 디코드해 주지만
 * 여기서 다시 막지 않으면 인코딩 변형에 기댈 곳이 없다.
 */
export const dynamic = "force-dynamic";

/** 자료는 업로드마다 새 UUID 폴더라 내용이 바뀌지 않는다 — 길게 캐시해도 안전하다. */
const CACHE = "public, max-age=3600, s-maxage=31536000";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  // ① 모양 검사 — `<uuid>/` + 그 아래 파일 하나.
  const folder = `${path[0] ?? ""}/`;
  const rest = path.slice(1).join("/");
  if (!BUNDLE_PATH_RE.test(folder) || rest.length === 0) {
    return new Response("Not found", { status: 404 });
  }
  // 경로 순회·빈 세그먼트·백슬래시를 막는다.
  if (
    path.slice(1).some((s) => s === "" || s === "." || s === ".." || s.includes("\\"))
  ) {
    return new Response("Not found", { status: 404 });
  }

  // ② 확장자 허용목록 — 업로드 때 쓴 표를 그대로 쓴다.
  const mime = EXT_MIME[extensionOf(rest)];
  if (!mime) return new Response("Not found", { status: 404 });

  const db = createSupabasePublicClient();

  // ③ 이 폴더가 **공개된 과정에 실제로 붙어 있는** 번들인지 확인한다.
  //    RLS가 비공개 행을 이미 걸러 주므로, 비공개로 돌린 과정의 자료는
  //    여기서도 같이 닫힌다 — 상세 페이지만 404가 되고 자료는 계속 열리는
  //    엇갈림이 생기지 않는다.
  const { data: owner, error } = await db
    .from("education_regular_classes")
    .select("slug")
    .eq("detail_bundle_path", folder)
    .maybeSingle();
  if (error || !owner) return new Response("Not found", { status: 404 });

  // ④ Storage에서 그대로 가져온다. Content-Type만 우리가 다시 정한다.
  const src = db.storage.from(BUNDLE_BUCKET).getPublicUrl(`${folder}${rest}`)
    .data.publicUrl;
  const upstream = await fetch(src, { cache: "no-store" });
  if (!upstream.ok) {
    // Storage는 없는 객체에 404가 아니라 400을 주기도 한다. 방문자 입장에서
    // 둘 다 "그 파일이 없다"이므로 4xx는 전부 404로 접는다 — 502로 내보내면
    // 자료 안의 깨진 이미지 하나가 **우리 서버 장애**처럼 보인다.
    // 5xx만 그대로 장애로 넘긴다.
    const status = upstream.status >= 500 ? 502 : 404;
    return new Response("Not found", { status });
  }

  const headers = new Headers({
    "Content-Type": mime,
    "Cache-Control": CACHE,
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex",
  });

  // ⑤ HTML만 sandbox를 건다. 이미지·CSS·폰트에는 의미가 없고, `sandbox`가
  //    걸린 하위 리소스는 캐시·CORS 동작만 복잡해진다.
  //
  //    `allow-same-origin`은 **주지 않는다** — 이 한 가지가 D4가 지키려던
  //    경계 전부다. 빼면 kpopsoft.com의 세션이 그대로 노출된다.
  if (mime === "text/html") {
    headers.set(
      "Content-Security-Policy",
      "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads",
    );
  }

  return new Response(upstream.body, { status: 200, headers });
}
