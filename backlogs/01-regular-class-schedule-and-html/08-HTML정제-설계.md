# HTML 정제 설계

[07-실행계획-확정.md](07-실행계획-확정.md) 3단계의 상세 설계다.
D5가 **`<style>` 유지 + 셀렉터 스코프**로 확정돼 필요해졌다.

## 1. 왜 파서를 쓰는가

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
 ├─ 3. scopeCss(collectedCss)                postcss. → 09
 └─ 4. `<div class="course-html-shell"><div class="course-html">`
       + `<style>`(있으면) + 본문 + `</div></div>`      ← 껍데기는 09 §3-5
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

## 3. CSS 스코프

분량이 커서 별도 문서로 뺐다 → **[09-CSS스코프-설계.md](09-CSS스코프-설계.md)**.
셀렉터 접두, at-rule 허용목록, `</style>` 탈출 차단, 컨테인먼트, postcss 실측이
거기 있다. 이 문서만 읽고 구현하면 **CSS 쪽이 통째로 빠진다.**

## 4. HTML 정제 테스트 케이스 (`sanitize-html.test.ts`)

`node --test`. CSS 쪽 케이스는 [09 §4-1](09-CSS스코프-설계.md).
아래는 05 §3-1의 XSS 페이로드 전부에 **더해서** 확인할 것들이다.

- 통짜 문서(`<!doctype html>` + `<head><title>T</title><style>…</style></head>`)
  → `T`가 본문에 **없고**, head 안 `<style>`은 **수집된다**
- `<p onclick=…>클릭</p>` → `<p>클릭</p>`로 **남는다**(과잉 정제 방지)
- `<a href="javascript:…">` → `href`가 없다 / `<a target="_blank">` → `rel`이 붙는다
- `<div style="position:fixed">` → `style` 속성이 없다
- `<div class="course-box">` → `class`가 **남는다**(D5)
- 빈 문자열·공백만 → 빈 문자열(컨테이너 div도 만들지 않는다)
- 결과가 `.course-html-shell` > `.course-html` **두 겹**으로 감싸여 있다

> 컨테인먼트([09 §3-5](09-CSS스코프-설계.md))는 단위 테스트로 확인할 수 없다. `.course-html-shell`에
> `contain: paint`가 실제로 적용됐는지는 `position:absolute; inset:-100vmax`
> 페이로드를 올린 뒤 **브라우저에서 눈으로** 확인한다(playwright 스크린샷).

## 5. 동작 실측 (2026-08-03, 설치 직후)

§2의 전제를 `parse5@8.0.1` / `sanitize-html@2.17.6`으로 **직접 실행해 확인했다.**

| 입력 | 결과 |
|------|------|
| 조각 `<h2>제목</h2><p>본문</p>` | body가 자동 생성되고 그대로 직렬화된다 |
| 통짜 문서 (`<head><title>새는제목</title><style>…`) | **`title` 텍스트가 body에 안 섞인다.** head의 `<style>`은 정상 수집 |
| body 안 `<style>` | 수집되고 트리에서 제거된다 |
| `sanitizeHtml("<title>x</title><p>본문</p>")` | `nonTextTags`에 `title`을 넣으면 내용까지 버려진다 |
| `<p>a</p><script>alert(1)</script>` | `<p>a</p>` — 스크립트는 태그·내용 모두 사라진다 |
| `<p onclick="x()">클릭</p>` | `<p>클릭</p>` — **본문은 살아남는다**(과잉 정제 아님) |
| `<div class="course-box">` | `class` 유지 (D5) |
| `<a href="javascript:alert(1)">` | `href`가 통째로 사라진다 |

**§2의 `<body>`만 직렬화하는 접근은 실제로 동작한다.** 정규식 추출이 필요 없다.

## 6. 남는 위험 (수용)

- **업로드 CSS는 본문 영역 안에서는 자유롭다.** 껍데기의 `contain: paint`가
  밖으로 나가는 것만 막는다. 관리자가 올리는 파일이라는 전제에서 수용한다.
- **정제 규칙이 바뀌면 기존 행은 옛 규칙으로 정제된 상태로 남는다.** 그래서
  원본을 동반 테이블에 둔다(07 §2). 재정제 스크립트는 필요해질 때 만든다.
- **백로그 02가 렌더 직전에 다시 정제해야** 이 설계가 실제로 닫힌다(06 §P1-3).
  02의 release gate에 넣는다.
