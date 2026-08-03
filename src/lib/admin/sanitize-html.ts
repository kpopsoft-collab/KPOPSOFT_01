/**
 * 정규 클래스 상세 HTML 업로드 정제 파이프라인
 * (backlogs/01-regular-class-schedule-and-html/08-HTML정제-설계.md §2,
 *  09-CSS스코프-설계.md §3).
 *
 * `import "server-only"`을 붙이지 않는다 — 백로그 02(공개 페이지 렌더)가
 * 저장 시점뿐 아니라 **렌더 직전에도** 이 함수를 다시 호출해야 닫히는
 * 설계라서(08 §6), 서버 컴포넌트 렌더 경로에서도 자유롭게 import할 수 있어야
 * 한다.
 *
 * 파이프라인:
 *   1. parse5로 파싱 → <style> 텍스트를 전부 모아 트리에서 제거 → <body>만 직렬화
 *   2. sanitize-html로 body HTML 정제
 *   3. postcss로 모은 CSS를 스코프
 *   4. 두 겹 셸로 감싼다 (컨테인먼트 경계, globals.css `.course-html-shell`)
 */

import { parse, serialize, type DefaultTreeAdapterTypes } from "parse5";
import sanitizeHtml from "sanitize-html";
import postcss from "postcss";

/**
 * D5(<style> 유지 + 셀렉터 스코프)를 되돌리는 스위치.
 * false로 바꾸면 모은 CSS를 버리고 scopeCss 호출을 건너뛴다 — 되돌릴 때
 * 지울 코드가 아래 한 곳(`if (KEEP_STYLE)` 블록)이 되게 한다.
 */
const KEEP_STYLE = true;

/** 스코프 후 CSS 상한. 넘으면 CSS 전체를 버린다(09 §3-6). */
const MAX_SCOPED_CSS_BYTES = 64 * 1024;

/** CSS 스코프 후 남기는 at-rule. 그 외(@import·@font-face·@keyframes 등)는
 *  전부 제거한다(09 §3-2) — 셀렉터 접두로는 at-rule의 "이름"까지 스코프할
 *  수 없어서 전역 이름과 충돌할 수 있기 때문이다. */
const ALLOWED_AT_RULES = new Set(["media", "supports"]);

/**
 * 이스케이프 정규화 후 이름이 이것들이면 선언을 버린다(09 §3-3).
 * `position`은 경계 밖 오버레이를, 나머지 둘은 구형 브라우저의 스크립트 실행
 * 벡터를 막는다. 어차피 우회 가능한 보조 방어라 목록을 늘리지 않는다 —
 * 진짜 경계는 셸의 `contain: paint`다.
 */
const UNSAFE_PROPS = new Set(["position", "behavior", "-moz-binding"]);

export const COURSE_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "a",
    "img",
    "blockquote",
    "code",
    "pre",
    "hr",
    "div",
    "span",
    "section",
    "article",
    "figure",
    "figcaption",
  ],
  allowedAttributes: {
    "*": ["class"], // D5. 업로드 CSS가 붙잡을 고리
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  // style(인라인 속성)·id는 허용 목록에 없어 자동으로 빠진다. style 속성은
  // 스코프를 씌울 수 없고, id는 페이지의 기존 앵커와 충돌할 수 있다.
  nonTextTags: ["script", "style", "textarea", "option", "head", "title", "noscript", "template"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

/** node에 childNodes가 있는지(부모가 될 수 있는지) 본다. CommentNode·TextNode·
 *  DocumentType은 childNodes가 아예 없어서 이 체크로 걸러진다. */
function hasChildNodes(
  node: DefaultTreeAdapterTypes.Node,
): node is DefaultTreeAdapterTypes.Document | DefaultTreeAdapterTypes.Element {
  return "childNodes" in node;
}

function isElement(
  node: DefaultTreeAdapterTypes.Node,
): node is DefaultTreeAdapterTypes.Element {
  return "tagName" in node;
}

/**
 * head·body 어디에 있든 <style> 텍스트를 전부 모으고 트리에서 제거한다.
 * <body>만 직렬화하기 전에 실행해야 <style> 내용이 본문 텍스트로 섞이지 않는다
 * (08 §2). 트리를 직접 변형하는 이유 — parse5 기본 트리 어댑터는 평범한
 * 객체+배열이라 childNodes를 다시 대입하는 것만으로 충분하다.
 */
function collectAndRemoveStyles(node: DefaultTreeAdapterTypes.Node, out: string[]): void {
  if (!hasChildNodes(node)) return;

  const kept: DefaultTreeAdapterTypes.ChildNode[] = [];
  for (const child of node.childNodes) {
    if (isElement(child) && child.tagName === "style") {
      // style은 raw-text 요소라 자식이 텍스트 노드뿐이다.
      const text = child.childNodes
        .map((c) => ("value" in c ? c.value : ""))
        .join("");
      out.push(text);
      continue; // kept에 넣지 않는 것 자체가 트리에서의 제거다.
    }
    collectAndRemoveStyles(child, out);
    kept.push(child);
  }
  node.childNodes = kept;
}

/** 트리에서 <body> 요소를 찾는다. parse5.parse는 조각이든 통짜 문서든 항상
 *  html/head/body를 자동으로 만들어 넣는다(08 §5). */
function findBody(node: DefaultTreeAdapterTypes.Node): DefaultTreeAdapterTypes.Element | null {
  if (isElement(node) && node.tagName === "body") return node;
  if (!hasChildNodes(node)) return null;
  for (const child of node.childNodes) {
    const found = findBody(child);
    if (found) return found;
  }
  return null;
}

/** `\XX ` / `\XXXXXX` 형태의 CSS 이스케이프를 실제 문자로 정규화한다.
 *  postcss는 이스케이프를 풀지 않고 그대로 보존하므로(09 §3-3 실측), 속성
 *  이름 블록리스트를 문자열 그대로 비교하면 `pos\69 tion` 같은 우회에 뚫린다. */
function unescapeCssIdent(value: string): string {
  return value.replace(/\\([0-9a-fA-F]{1,6})\s?|\\(.)/g, (_match, hex: string, char: string) => {
    if (hex === undefined) return char;
    const code = parseInt(hex, 16);
    // CSS는 1~6자리 hex를 허용해서 `\ffffff`(16777215)처럼 유니코드 범위를
    // 넘는 값이 문법상 정상으로 들어온다. String.fromCodePoint는 여기서
    // RangeError를 던지는데, 그러면 정제기가 "실패 시 CSS를 버린다"가 아니라
    // **통째로 터진다**. 백로그 02가 렌더 직전에도 이 함수를 부르므로 공개
    // 페이지가 죽는다. CSS 명세대로 U+FFFD로 바꾼다(브라우저와 같은 동작).
    if (code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
      return "�";
    }
    return String.fromCodePoint(code);
  });
}

/**
 * url() 안 스킴이 http/https/data:image/가 아니면 그 선언을 버린다.
 *
 * **이스케이프를 먼저 푼 사본에서 찾는다.** `\75 rl(...)`은 CSS 토크나이저가
 * 진짜 `url(` 토큰으로 읽으므로, 원문만 훑으면 함수 이름 이스케이프 한 번에
 * 통째로 새어 나간다(속성 이름에는 이미 같은 방어를 하고 있었다).
 *
 * 따옴표 안쪽은 `)`를 포함할 수 있어(`url("x.png?a=(1)")`) 따옴표 형태를
 * 먼저 매치한다. `[^'")]*` 하나로 처리하면 괄호 든 URL에서 매치 자체가
 * 실패해 검사를 건너뛴다.
 */
const URL_TOKEN = /url\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^)'"]*))\s*\)/gi;

function hasDisallowedUrlScheme(value: string): boolean {
  const normalized = unescapeCssIdent(value);
  for (const match of normalized.matchAll(URL_TOKEN)) {
    const url = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    if (url === "") continue; // url()는 아무것도 안 불러온다
    if (!/^https?:\/\//i.test(url) && !/^data:image\//i.test(url)) {
      return true;
    }
  }
  return false;
}

/**
 * 선언 값 검사 — 보조 방어일 뿐이다(09 §3-3). 진짜 경계는 컨테인먼트
 * (globals.css `.course-html-shell`)다. 이스케이프·`var()` 우회는 여기서
 * 못 잡는다는 것을 알고 쓴다.
 */
function isDeclUnsafe(decl: postcss.Declaration): boolean {
  // behavior·-moz-binding은 **속성**이다. 값에서 찾으면 영원히 매치되지 않는다.
  const prop = unescapeCssIdent(decl.prop).trim().toLowerCase();
  if (UNSAFE_PROPS.has(prop)) return true;

  const value = decl.value;
  if (/expression\s*\(/i.test(value)) return true;
  if (hasDisallowedUrlScheme(value)) return true;

  return false;
}

/** `:root`/`html`/`body`는 `.course-html` 자체로 치환한다 — 자손 셀렉터로
 *  접두하면(`.course-html body`) 절대 매치되지 않아 스타일이 통째로 사라진다. */
function scopeSelector(selector: string): string {
  const trimmed = selector.trim();
  if (trimmed === ":root" || trimmed === "html" || trimmed === "body") {
    return ".course-html";
  }
  // 이미 스코프된 셀렉터는 그대로 둔다 — **이 함수는 멱등이어야 한다.**
  //
  // 저장 시 한 번, 렌더 직전에 한 번(백로그 02 G2) 정제하므로 같은 CSS가 두 번
  // 들어온다. 접두를 매번 덧붙이면 셀렉터가 패스마다 13바이트씩 길어지고,
  // §3-6의 64KB 상한에 **두 번째 패스에서만** 걸린다. 그러면 어드민에서는
  // 저장이 성공하고 값에도 <style>이 들어 있는데 공개 페이지에서만 스타일이
  // 통째로 사라진다 — 경고도 없이. 실제로 셀렉터 1800개짜리 CSS가 그랬다.
  //
  // 접두를 건너뛰어도 스코프는 뚫리지 않는다. 이 조건에 걸리려면 셀렉터가
  // 이미 `.course-html`로 시작해야 하고, 그건 곧 우리 컨테이너 안으로
  // 한정돼 있다는 뜻이다.
  if (trimmed === ".course-html" || trimmed.startsWith(".course-html ")) {
    return selector;
  }
  return `.course-html ${selector}`;
}

/**
 * 모은 CSS에 스코프를 씌운다(09 §3). 파싱이 실패하면 CSS 전체를 버린다
 * (fail closed) — 깨진 CSS를 부분적으로 살리려다 스코프를 우회하는 조각이
 * 남는 쪽이 더 위험하다.
 */
function scopeCss(css: string): string {
  try {
    return scopeCssUnsafe(css);
  } catch {
    // fail closed. 파싱뿐 아니라 순회·치환 중 어디서 터져도 CSS만 버리고
    // 본문은 살린다 — 이 함수는 백로그 02가 **렌더 직전에도** 부르므로,
    // 여기서 예외가 새면 저장이 아니라 공개 페이지가 죽는다.
    return "";
  }
}

function scopeCssUnsafe(css: string): string {
  const root = postcss.parse(css);

  root.walkRules((rule) => {
    // @keyframes 안쪽(0%/from 등)은 건드리지 않는다. 정규식은 /keyframes$/i —
    // `-webkit-`을 놓치면 접두가 붙어 애니메이션이 깨진다(09 §5 실측).
    // 현재는 @keyframes 자체를 아래에서 통째로 지우므로 이 가드는 실질적으로
    // 이중 방어지만, at-rule 허용 정책이 바뀌어도 안전하도록 남겨 둔다.
    const parent = rule.parent;
    if (parent && parent.type === "atrule" && /keyframes$/i.test(parent.name)) {
      return;
    }
    rule.selectors = rule.selectors.map(scopeSelector);
  });

  root.walkAtRules((atRule) => {
    if (!ALLOWED_AT_RULES.has(atRule.name.toLowerCase())) {
      atRule.remove();
    }
  });

  root.walkDecls((decl) => {
    if (isDeclUnsafe(decl)) {
      decl.remove();
    }
  });

  // </style> 탈출 차단(09 §3-4). content:"</style>…" 처럼 CSS 문자열 안에
  // 넣으면 HTML 파서가 거기서 <style>을 닫아 버린다.
  //
  // `<`를 전부 치환하면 안 된다 — `@media (width < 700px)`(Media Queries 4
  // 범위 문법)의 `<`까지 이스케이프돼 미디어 쿼리 전체가 파스 에러로 통째로
  // 무시된다. 업로드한 반응형 스타일시트가 조용히 죽는 셈이라, 이 기능에서
  // 가장 자주 밟을 실패다.
  //
  // HTML 종료 태그는 `</` + 태그명이라야 성립하므로 `</`만 끊으면 충분하다.
  // `\3c `의 공백은 이스케이프 종료 표시라 값에는 `<`만 남는다.
  const scoped = root.toString().replace(/<\//g, "\\3c /");

  if (Buffer.byteLength(scoped, "utf8") > MAX_SCOPED_CSS_BYTES) {
    return "";
  }
  return scoped;
}

/**
 * 정규 클래스 상세 HTML 업로드를 정제한다. 저장 시점과(백로그 02) 공개 페이지
 * 렌더 직전 양쪽에서 호출된다.
 */
const SHELL_OPEN = '<div class="course-html-shell"><div class="course-html">';
const SHELL_CLOSE = "</div></div>";

/**
 * 이미 우리 셸로 감싸인 결과가 다시 들어오면 껍데기를 벗긴다. 저장 시 한 번,
 * 렌더 직전에 한 번(백로그 02 G2) 정제하므로 안 벗기면 패스마다 div가 두 겹씩
 * 쌓인다. 벗겨도 안전하다 — 안쪽 내용은 어차피 아래에서 다시 전부 정제된다.
 */
function unwrapShell(html: string): string {
  const trimmed = html.trim();
  if (trimmed.startsWith(SHELL_OPEN) && trimmed.endsWith(SHELL_CLOSE)) {
    return trimmed.slice(SHELL_OPEN.length, -SHELL_CLOSE.length);
  }
  return html;
}

export function sanitizeCourseHtml(raw: string): string {
  const document = parse(raw);

  const collectedCss: string[] = [];
  collectAndRemoveStyles(document, collectedCss);

  const body = findBody(document);
  const bodyHtml = body ? serialize(body) : "";

  const sanitizedBody = unwrapShell(sanitizeHtml(bodyHtml, COURSE_HTML_OPTIONS));
  if (sanitizedBody.trim() === "") {
    return ""; // 본문이 없으면 컨테이너 div도 만들지 않는다.
  }

  let styleTag = "";
  if (KEEP_STYLE) {
    const rawCss = collectedCss.join("\n");
    if (rawCss.trim() !== "") {
      const scopedCss = scopeCss(rawCss);
      if (scopedCss.trim() !== "") {
        styleTag = `<style>${scopedCss}</style>`;
      }
    }
  }

  // 두 겹 셸(09 §3-5) — 업로드 셀렉터는 전부 .course-html이 앞에 붙거나
  // .course-html 자체로 치환되므로, 조상인 셸(.course-html-shell)은 어떤
  // 조합으로도 선택되지 않는다. globals.css의 contain: paint가 실제 경계다.
  return `<div class="course-html-shell"><div class="course-html">${styleTag}${sanitizedBody}</div></div>`;
}
