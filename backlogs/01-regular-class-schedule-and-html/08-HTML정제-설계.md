# HTML 정제 + CSS 스코프 설계

[07-실행계획-확정.md](07-실행계획-확정.md) 3단계의 상세 설계다.
D5가 **`<style>` 유지 + 셀렉터 스코프**로 확정돼 필요해졌다.

## 1. 왜 별도 문서인가

`<style>`을 살리기로 하면 정제기가 HTML만 다루면 끝나는 물건이 아니게 된다.
정규식으로 셀렉터 앞에 `.course-html `을 붙이는 방식은 아래에서 전부 깨진다.

| 입력 | 정규식이 만드는 결과 | 옳은 결과 |
|------|---------------------|-----------|
| `@media (max-width:600px){h2{…}}` | `.course-html @media …` | at-rule은 두고 **안쪽** `h2`만 |
| `@keyframes spin{0%{…}}` | `.course-html 0%{…}` (CSS 깨짐) | `0%`는 **건드리지 않는다** |
| `.a,.b>.c` | 첫 항목만 | 콤마 항목 **각각** |
| `content:"a,b"` | 문자열 안 콤마로 오분할 | 문자열은 분할 대상이 아니다 |

→ **실제 CSS 파서(`postcss`)를 쓴다.** HTML 쪽도 `<style>` 내용을 꺼내야 하므로
`parse5`로 파싱한다. 둘 다 이미 전이 의존이지만 **직접 의존성으로 올린다.**

## 2. 파이프라인

`src/lib/admin/sanitize-html.ts`

```
raw
 └─ 1. parse5.parse(raw)                     통짜 문서든 조각이든 트리로
      ├─ <style> 텍스트 전부 수집 (head·body 무관)하고 트리에서 제거
      └─ <body> 서브트리만 직렬화              ← 정규식 추출을 안 쓰는 이유
 ├─ 2. sanitizeHtml(bodyHtml, COURSE_HTML_OPTIONS)
 ├─ 3. scopeCss(collectedCss)                postcss. §3
 └─ 4. `<div class="course-html">` + `<style>`(있으면) + 본문 + `</div>`
```

`KEEP_STYLE` 상수를 파일 최상단에 둔다. `false`로 두면 1단계에서 CSS를 버리고
3단계를 건너뛴다 — **D5를 되돌리는 스위치**다. 되돌릴 때 지울 코드가 한 곳이 되게 한다.

1단계에서 `<body>`만 직렬화하므로 `<title>`·`<meta>` 같은 head 내용은 자동으로
빠진다(`<style>`만 따로 건져낸다). 06 §3이 지적한 "title 텍스트가 본문으로 새는"
문제가 파서 수준에서 해결된다.

### HTML 정제 옵션

```ts
export const COURSE_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [ /* p br strong em b i u s h2 h3 h4 ul ol li table thead tbody
     tr th td a img blockquote code pre hr div span section article figure figcaption */ ],
  allowedAttributes: {
    "*": ["class"],                    // D5. 업로드 CSS가 붙잡을 고리
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  nonTextTags: ["script","style","textarea","option","head","title","noscript","template"],
  transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
};
```

- `style` **속성**(인라인)은 허용하지 않는다. 스코프를 씌울 수 없고 `<style>`로
  같은 일을 할 수 있다.
- `id`도 허용하지 않는다. 페이지의 기존 앵커와 충돌한다.
- `<style>`은 `nonTextTags`에 그대로 둔다 — 1단계에서 이미 뺐고, 혹시 남았다면
  버리는 쪽이 맞다. **sanitize-html에 `<style>`을 통과시키면 안 된다**:
  텍스트로 취급돼 `>`가 `&gt;`로 이스케이프되면서 `.a > .b`가 깨진다.

## 3. CSS 스코프 규칙 (`scopeCss`)

postcss로 파싱한 뒤 아래를 적용한다. 파싱 자체가 실패하면 **CSS 전체를 버린다**(fail closed).

### 3-1. 셀렉터

- `rule.selectors`로 콤마 분할한다. postcss의 `list.comma`는 괄호·따옴표를
  인식하므로 `:is(a,b)`나 `content:"a,b"`에서 오분할하지 않는다.
- 각 항목 앞에 `.course-html `를 붙인다.
- `:root` / `html` / `body`는 `.course-html` **자체로 치환**한다
  (`.course-html body`는 매치될 리가 없어 스타일이 통째로 사라진다).
- **`@keyframes` 안쪽 규칙은 건드리지 않는다.**
  `rule.parent.type === "atrule" && /(-)?keyframes$/i.test(rule.parent.name)`이면 건너뛴다.

### 3-2. at-rule 허용목록

`media`, `supports`, `keyframes`(벤더 접두 포함), `font-face`만 남기고 **나머지는 제거**한다.
특히 `@import`는 외부 CSS를 끌어오므로 반드시 제거 대상이다.

### 3-3. 선언 값

- `url()` 안의 스킴은 `http`/`https`/`data:image/`만 허용. 나머지는 그 선언을 제거.
- `expression(`, `behavior:`, `-moz-binding`이 보이면 그 선언 제거.
- **`position: fixed` 제거.** 화면 전체를 덮는 가짜 UI를 만드는 가장 짧은 길이다.

### 3-4. `</style>` 탈출 차단 (놓치기 쉬움)

CSS 문자열 안에 `</style>`을 넣으면 브라우저 파서가 거기서 `<style>`을 닫는다.

```css
.x::after { content: "</style><img src=x onerror=alert(1)>"; }
```

정제된 HTML을 아무리 잘 만들어도 여기서 뚫린다. postcss 직렬화 **결과 문자열의
`<`를 전부 `\3c `로 치환**한다. CSS 문자열·식별자에서 유효한 이스케이프이고,
그 밖의 위치에서 `<`는 원래 유효하지 않으므로 치환해도 잃는 게 없다.

### 3-5. 컨테이너 쪽 방어

우리 전역 스타일에 다음을 둔다.

```css
.course-html { contain: layout; }
```

레이아웃 컨테인먼트는 이 요소를 **`position: fixed` 자손의 컨테이닝 블록으로**
만든다. 업로드 CSS의 `fixed`(3-3)와 번들에 이미 있는 Tailwind `fixed inset-0 z-50`
같은 클래스(D5로 `class`를 허용했으므로 쓸 수 있다) **양쪽 다** 본문 영역 밖으로
못 나가게 막는 이중 방어다. `contain: paint`는 쓰지 않는다 — 내용이 잘린다.

### 3-6. 크기

스코프 후 CSS가 **64KB를 넘으면 CSS 전체를 버린다.** 본문과 합쳐 `detail_html`이
무한정 커지는 것을 막는다. 512KB 상한(07 §3 6단계)은 raw 기준이라 별개다.

## 4. 테스트 케이스 (`sanitize-html.test.ts`)

`node --test`. 경로 별칭이 안 먹으므로 상대 경로로 import한다.

**CSS 스코프**

- `h2{color:red}` → `.course-html h2` 로 시작한다
- `@media (max-width:600px){h2{…}}` → `@media`는 남고 안쪽만 접두된다
- `@keyframes spin{0%{opacity:0}100%{opacity:1}}` → `0%`/`100%`가 **그대로다**
- `.a,.b>.c` → 두 항목 모두 접두되고 `>` 결합자가 살아 있다
- `body{font-family:x}` → `.course-html{font-family:x}` (자손 셀렉터가 아니다)
- `@import url("//evil.com/x.css")` → 결과에 `@import`가 **없다**
- `content:"</style><script>alert(1)</script>"` → 결과에 `</style`가 **없다**
- `background:url(javascript:alert(1))` → 그 선언이 **없다**
- `.x{position:fixed}` → `position:fixed`가 **없다**
- 깨진 CSS(`h2{color:`) → CSS 전체가 버려지고 **본문은 남는다**
- 64KB 초과 CSS → CSS만 버려진다

**HTML 정제** — 05 §3-1 페이로드 전부에 더해

- 통짜 문서(`<!doctype html>` + `<head><title>T</title><style>…</style></head>`)
  → `T`가 본문에 **없고**, head 안 `<style>`은 **수집된다**
- `<p onclick=…>클릭</p>` → `<p>클릭</p>`로 **남는다**(과잉 정제 방지)
- `<a href="javascript:…">` → `href`가 없다 / `<a target="_blank">` → `rel`이 붙는다
- `<div style="position:fixed">` → `style` 속성이 없다
- `<div class="course-box">` → `class`가 **남는다**(D5)
- 빈 문자열·공백만 → 빈 문자열(컨테이너 div도 만들지 않는다)

## 5. 남는 위험 (수용)

- **업로드 CSS는 본문 영역 안에서는 자유롭다.** `contain: layout`이 밖으로
  나가는 것만 막는다. 관리자가 올리는 파일이라는 전제에서 수용한다.
- **정제 규칙이 바뀌면 기존 행은 옛 규칙으로 정제된 상태로 남는다.** 그래서
  원본을 동반 테이블에 둔다(07 §2). 재정제 스크립트는 필요해질 때 만든다.
- **백로그 02가 렌더 직전에 다시 정제해야** 이 설계가 실제로 닫힌다(06 §P1-3).
  02의 release gate에 넣는다.
