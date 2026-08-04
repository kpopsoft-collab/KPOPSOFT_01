/**
 * sanitize-html.ts 테스트.
 *
 * `node --test`로 돌린다. 경로 별칭(`@/`)이 안 먹으므로 상대 경로로
 * import한다. 케이스는
 * backlogs/01-regular-class-schedule-and-html/08-HTML정제-설계.md §4 +
 * 09-CSS스코프-설계.md §4-1 전부.
 *
 * import에 `.ts` 확장자를 그대로 쓴다 — `node --test`가 이 파일을 직접 실행하므로
 * 특정자에 실제 확장자가 있어야 모듈을 찾는다. tsconfig의
 * `allowImportingTsExtensions`가 이를 허용한다(noEmit이라 부작용 없음).
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { sanitizeCourseHtml } from "./sanitize-html.ts";

// ---- 08 §4: HTML 정제 케이스 ----------------------------------------------

test("통짜 문서 — title 텍스트가 본문에 섞이지 않고, head의 style은 수집된다", () => {
  const raw = `<!doctype html><html><head><title>T</title><style>h2{color:red}</style></head><body><p>본문</p></body></html>`;
  const out = sanitizeCourseHtml(raw);
  assert.ok(!out.includes(">T<"), "title 텍스트가 본문에 섞이면 안 된다");
  assert.ok(!out.includes("T</"), "title 텍스트가 본문에 섞이면 안 된다");
  assert.ok(out.includes(".course-html h2"), "head의 style이 수집·스코프돼야 한다");
  assert.ok(out.includes("<p>본문</p>"));
});

test("onclick 속성은 지워지고 본문은 남는다(과잉 정제 방지)", () => {
  const out = sanitizeCourseHtml(`<p onclick="alert(1)">클릭</p>`);
  assert.ok(out.includes("<p>클릭</p>"));
  assert.ok(!out.includes("onclick"));
});

test("javascript: href는 사라지고, target=_blank에는 rel이 붙는다", () => {
  const out = sanitizeCourseHtml(
    `<a href="javascript:alert(1)">a</a><a href="https://x.com" target="_blank">b</a>`,
  );
  assert.ok(!out.includes("javascript:"));
  assert.match(out, /<a href="https:\/\/x\.com" target="_blank" rel="noopener noreferrer">b<\/a>/);
});

test("style 속성(인라인)은 사라진다", () => {
  const out = sanitizeCourseHtml(`<div style="position:fixed">x</div>`);
  assert.ok(!out.includes("style="));
});

test("class 속성은 남는다(D5)", () => {
  const out = sanitizeCourseHtml(`<div class="course-box">x</div>`);
  assert.ok(out.includes('class="course-box"'));
});

test("빈 문자열·공백만 입력하면 빈 문자열을 돌려준다(컨테이너 div도 없다)", () => {
  assert.equal(sanitizeCourseHtml(""), "");
  assert.equal(sanitizeCourseHtml("   \n  "), "");
});

test("결과는 .course-html-shell > .course-html 두 겹으로 감싸인다", () => {
  const out = sanitizeCourseHtml(`<p>x</p>`);
  assert.match(
    out,
    /^<div class="course-html-shell"><div class="course-html">[\s\S]*<\/div><\/div>$/,
  );
});

// ---- 05 §3-1: XSS 페이로드 전부 --------------------------------------------

test("05 §3-1 XSS 페이로드 — 위험 요소는 전부 빠지고 본문은 남는다", () => {
  const raw = `
<h2>과정 소개</h2>
<p onclick="alert('xss')">클릭</p>
<script>alert('xss')</script>
<img src=x onerror="alert('xss')">
<iframe src="https://example.com"></iframe>
<a href="javascript:alert('xss')">링크</a>
<style>h2 { color: red }</style>
`;
  const out = sanitizeCourseHtml(raw);
  assert.ok(!out.includes("<script"));
  assert.ok(!out.includes("onclick"));
  assert.ok(!out.includes("onerror"));
  assert.ok(!out.includes("<iframe"));
  assert.ok(!out.includes('href="javascript:'));
  assert.ok(out.includes("<h2>과정 소개</h2>"));
  assert.ok(out.includes("<p>클릭</p>"));
  assert.match(out, /\.course-html h2\s*\{\s*color:\s*red/);
});

// ---- 09 §4-1: CSS 스코프 케이스 --------------------------------------------
// sanitizeCourseHtml만 export돼 있으므로 <style>을 담은 HTML을 통째로 넣고
// 출력 문자열에서 스코프 결과를 확인한다. 본문이 비면 결과 자체가 ""가 되므로
// 모든 케이스에 <p>x</p>를 같이 넣는다.

function scopedStyleOf(css: string): string {
  return sanitizeCourseHtml(`<style>${css}</style><p>x</p>`);
}

test("단순 셀렉터는 .course-html 이 접두된다", () => {
  const out = scopedStyleOf("h2{color:red}");
  assert.ok(out.includes(".course-html h2{color:red}"));
});

test("@media는 남고 안쪽 셀렉터만 접두된다", () => {
  const out = scopedStyleOf("@media (max-width:600px){h2{color:red}}");
  assert.ok(out.includes("@media (max-width:600px)"));
  assert.ok(out.includes(".course-html h2{color:red}"));
});

test("@keyframes는 통째로 제거된다(0%에 접두가 붙지 않는다)", () => {
  const out = scopedStyleOf("@keyframes spin{0%{opacity:0}}");
  assert.ok(!out.includes("spin"));
  assert.ok(!out.includes(".course-html 0%"));
  assert.ok(!out.includes("@keyframes"));
});

test("@-webkit-keyframes도 통째로 제거된다", () => {
  const out = scopedStyleOf("@-webkit-keyframes spin{from{opacity:0}}");
  assert.ok(!out.includes("spin"));
  assert.ok(!out.includes(".course-html from"));
});

test("전역 애니메이션 이름(kps-reveal)을 탈취하지 못한다", () => {
  const out = scopedStyleOf("@keyframes kps-reveal{from,to{opacity:0}}");
  assert.ok(!out.includes("kps-reveal"));
});

test("@font-face는 제거된다", () => {
  const out = scopedStyleOf('@font-face{font-family:Pretendard;src:url(//evil/x.woff2)}');
  assert.ok(!out.includes("@font-face"));
  assert.ok(!out.includes("evil"));
});

test("이스케이프된 속성 이름(pos\\69 tion)도 정규화 후 제거된다", () => {
  const out = scopedStyleOf(".x{pos\\69 tion:fixed}");
  assert.ok(!out.includes("fixed"));
});

test("콤마로 나눈 셀렉터는 각각 접두되고 결합자는 살아있다", () => {
  const out = scopedStyleOf(".a,.b>.c{color:red}");
  assert.ok(out.includes(".course-html .a"));
  assert.ok(out.includes(".course-html .b>.c"));
});

test("body 셀렉터는 자손이 아니라 .course-html 자체로 치환된다", () => {
  const out = scopedStyleOf("body{font-family:x}");
  assert.ok(out.includes(".course-html{font-family:x}"));
  assert.ok(!out.includes(".course-html body"));
});

test("@import는 제거된다", () => {
  const out = scopedStyleOf('@import url("//evil.com/x.css")');
  assert.ok(!out.includes("@import"));
});

test("</style> 탈출 페이로드를 그대로 올려도 최종 결과는 안전하다", () => {
  // <style>은 raw-text 요소라 parse5(=브라우저와 동일한 HTML5 규칙)가 CSS
  // 문자열 안이든 밖이든 상관없이 최초로 나오는 리터럴 `</style`에서 태그를
  // 끊는다. 그래서 이 페이로드는 collectAndRemoveStyles 단계에서 이미
  // `content:"` 까지만 잘려 깨진 CSS가 되고(→ scopeCss가 fail-closed로 버림),
  // 잘리고 남은 `</script>` 뒤쪽 텍스트는 평범한 본문으로 sanitizeHtml을
  // 통과한다 — 즉 <script> 자체는 sanitizeHtml이 잡는다.
  const raw = `<style>.x::after{content:"</style><script>alert(1)</script>"}</style><p>x</p>`;
  const out = sanitizeCourseHtml(raw);
  assert.ok(!out.includes("<script"));
  assert.ok(!out.includes("<style>"), "깨진 CSS라 style 태그 자체가 안 남는다");
  assert.ok(out.includes("<p>x</p>"));
});

test("scopeCss의 < 이스케이프 — HTML 파서를 우회해 CSS까지 도달한 </style도 이스케이프된다", () => {
  // `<\/style>` 처럼 `<`와 `/` 사이에 CSS 이스케이프용 백슬래시를 끼우면
  // parse5의 raw-text 스캐너가 `</style`로 인식하지 못해 CSS 문자열이 안
  // 잘리고 그대로 scopeCss까지 들어온다(09 §3-4가 방어하는 실제 지점).
  const raw = '<style>.x::after{content:"<\\/style><script>alert(1)</script>"}</style><p>x</p>';
  const out = sanitizeCourseHtml(raw);
  assert.ok(out.includes("<style>"), "이번엔 CSS가 안 깨져서 style 태그가 남아야 한다");
  assert.ok(!out.includes("</style><script"), "재구성된 결과에 탈출 시퀀스가 없어야 한다");
  assert.ok(out.includes("\\3c "), "리터럴 <가 \\3c 로 치환됐어야 한다");
});

test("위험한 url() 스킴을 쓴 선언은 제거된다", () => {
  const out = scopedStyleOf(".x{background:url(javascript:alert(1))}");
  assert.ok(!out.includes("background"));
});

test("position 선언은 제거된다", () => {
  const out = scopedStyleOf(".x{position:fixed}");
  assert.ok(!out.includes("position:fixed"));
});

test("이스케이프로 위장한 position(pos\\69 tion)도 제거된다", () => {
  // postcss는 이스케이프를 풀지 않고 브라우저는 푼다. 정규화 없이 문자열만
  // 비교하면 여기서 뚫린다(09 §5 실측).
  const out = scopedStyleOf(String.raw`.x{pos\69 tion:fixed;inset:-100vmax}`);
  assert.ok(!/pos\\?69\s?tion/i.test(out), "이스케이프된 position이 남으면 안 된다");
  assert.ok(out.includes("inset"), "나머지 선언까지 지우면 안 된다");
});

test("behavior·-moz-binding은 값이 아니라 속성이라 속성 이름으로 잡는다", () => {
  // 값에서 찾으면 영원히 매치되지 않는다 — 실제로 그렇게 짜여 있었다.
  assert.ok(!scopedStyleOf(".x{behavior:url(#default#time2)}").includes("behavior"));
  assert.ok(
    !scopedStyleOf(".x{-moz-binding:url(http://e/x.xml#e)}").includes("binding"),
  );
});

test("유니코드 범위를 넘는 이스케이프에도 터지지 않는다", () => {
  // CSS는 hex 6자리를 허용해 \ffffff 같은 값이 문법상 정상으로 들어온다.
  // String.fromCodePoint가 RangeError를 던지면 정제기가 통째로 죽는다 —
  // 백로그 02는 렌더 직전에도 이 함수를 부르므로 공개 페이지가 죽는다.
  for (const css of [String.raw`.x{\ffffff:red}`, String.raw`.x{p\110000osition:red}`]) {
    const out = sanitizeCourseHtml(`<style>${css}</style><p>본문</p>`);
    assert.ok(out.includes("<p>본문</p>"), "본문은 남아야 한다");
  }
});

test("url() 스킴 검사가 따옴표·괄호·함수명 이스케이프로 우회되지 않는다", () => {
  const leaks = [
    String.raw`.x{background:url("//evil.example/x.png?a=(1)")}`, // 괄호 든 따옴표 URL
    String.raw`.x{background:\75 rl(//evil.example/x.png)}`, // url 함수명 이스케이프
    String.raw`.x{background:url("javascript:alert(1)")}`, // 괄호 든 javascript:
  ];
  for (const css of leaks) {
    const out = scopedStyleOf(css);
    assert.ok(!out.includes("evil.example"), `외부 URL이 새면 안 된다: ${css}`);
    assert.ok(!out.includes("javascript:"), `javascript: 가 새면 안 된다: ${css}`);
  }
});

test("@media 범위 문법(width < 700px)이 살아남는다", () => {
  // `<`를 전부 이스케이프하면 미디어 쿼리가 파스 에러로 통째로 무시된다.
  // 업로드한 반응형 스타일시트가 조용히 죽는 실패다.
  const out = scopedStyleOf("@media (width < 700px){h2{color:red}}");
  assert.ok(out.includes("width < 700px"), "범위 문법이 보존돼야 한다");
  assert.ok(out.includes(".course-html h2"), "안쪽 규칙은 접두돼야 한다");
});

test("깨진 CSS는 전체가 버려지고 본문은 남는다", () => {
  const out = sanitizeCourseHtml("<style>h2{color:</style><p>본문</p>");
  assert.ok(!out.includes("<style>"));
  assert.ok(out.includes("<p>본문</p>"));
});

test("64KB를 넘는 CSS는 CSS만 버려진다", () => {
  const bigSelector = "a".repeat(70 * 1024);
  const out = sanitizeCourseHtml(`<style>.${bigSelector}{color:red}</style><p>본문</p>`);
  assert.ok(!out.includes("<style>"));
  assert.ok(out.includes("<p>본문</p>"));
});
