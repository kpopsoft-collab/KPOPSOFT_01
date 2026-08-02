# CSS 스코프 설계

[08-HTML정제-설계.md](08-HTML정제-설계.md)의 파이프라인 3단계(`scopeCss`) 상세다.
D5가 `<style>` 유지를 택해 필요해졌고, **이 작업 리스크의 대부분이 여기 몰려 있다.**

섹션 번호는 08과 이어진다(§3, §5).

## 3. CSS 스코프 규칙 (`scopeCss`)

postcss로 파싱한 뒤 아래를 적용한다. 파싱 자체가 실패하면 **CSS 전체를 버린다**(fail closed).

### 3-1. 셀렉터

- `rule.selectors`로 콤마 분할한다. postcss의 `list.comma`는 괄호·따옴표를
  인식하므로 `:is(a,b)`나 `content:"a,b"`에서 오분할하지 않는다.
- 각 항목 앞에 `.course-html `를 붙인다.
- `:root` / `html` / `body`는 `.course-html` **자체로 치환**한다
  (`.course-html body`는 매치될 리가 없어 스타일이 통째로 사라진다).
- **`@keyframes` 안쪽 규칙은 건드리지 않는다.**
  `rule.parent.type === "atrule" && /keyframes$/i.test(rule.parent.name)`이면 건너뛴다.
  `/(-)?keyframes$/`처럼 쓰면 **`@-webkit-keyframes`를 놓쳐** `from`·`0%`에 접두가
  붙고 애니메이션이 통째로 깨진다(§5에서 실측).

### 3-2. at-rule 허용목록

**`media`와 `supports`만 남기고 나머지는 전부 제거한다.** `@import`는 외부 CSS를
끌어오므로 당연히 제거 대상이다.

`@keyframes`·`@font-face`도 **v1에서는 제거한다.** 셀렉터 접두는 이 둘의 **이름**을
스코프하지 못하기 때문이다. 우리 전역 CSS에 이미
`@keyframes kps-reveal`(`src/app/globals.css:255`)이 있고 `:249`가 그 이름을 쓴다.
업로드 CSS가 같은 이름을 나중에 정의하면 **문서 순서상 마지막 정의가 이긴다**:

```css
@keyframes kps-reveal { from, to { opacity: 0 } }   /* 사이트 섹션들이 사라진다 */
```

살리려면 이름과 `animation`/`font-family` **참조까지 같이** 고유 접두로 재작성해야
하는데, `animation` 단축 속성 파싱이 얽혀 v1 범위를 넘는다.

### 3-3. 선언 값 — **보조 방어일 뿐이다**

속성 이름 블록리스트는 **원리적으로 못 이긴다.** postcss는 이스케이프를 풀지 않고
브라우저는 푼다(§5 실측):

```css
.x { pos\69 tion: fixed }        /* postcss decl.prop = "pos\69 tion" */
.y { --p: fixed; position: var(--p) }
```

그래서 **경계는 §3-5의 컨테인먼트가 잡는다.** 아래는 그 위에 얹는 두 번째 층이다.

- `decl.prop`의 CSS 이스케이프(`\XX ` / `\XXXXXX`)를 **먼저 정규화**한 뒤 검사한다.
- `url()` 안의 스킴은 `http`/`https`/`data:image/`만 허용. 나머지는 그 선언 제거.
- `expression(`, `behavior:`, `-moz-binding` → 그 선언 제거.
- 정규화 후 `position` 선언 제거. 값에 `var()`가 있으면 무엇으로 치환될지 알 수
  없으므로 이 검사가 무의미해진다는 점을 알고 쓴다.

### 3-4. `</style>` 탈출 차단 (놓치기 쉬움)

CSS 문자열 안에 `</style>`을 넣으면 브라우저 파서가 거기서 `<style>`을 닫는다.

```css
.x::after { content: "</style><img src=x onerror=alert(1)>"; }
```

정제된 HTML을 아무리 잘 만들어도 여기서 뚫린다. postcss 직렬화 **결과 문자열의
`<`를 전부 `\3c `로 치환**한다. CSS 문자열·식별자에서 유효한 이스케이프이고,
그 밖의 위치에서 `<`는 원래 유효하지 않으므로 치환해도 잃는 게 없다.

### 3-5. 컨테인먼트 — **이것이 실제 경계다**

정제 결과를 **두 겹**으로 감싼다.

```html
<div class="course-html-shell">   <!-- 업로드 CSS가 선택할 수 없는 바깥 껍데기 -->
  <div class="course-html"> …<style>…</style> 본문… </div>
</div>
```

```css
.course-html-shell { contain: paint; }   /* = 클리핑 + 컨테이닝 블록 */
```

**`contain: layout`으로는 안 된다.** 레이아웃 컨테인먼트는 컨테이닝 블록을 만들
뿐 **바깥으로 그려지는 것을 자르지 않는다.** 그래서 `position: fixed`를 막아도
아래 한 방에 뚫린다.

```css
.x { position: absolute; inset: -100vmax; z-index: 2147483647; background: #fff }
```

`contain: paint`는 자손의 페인트를 패딩 박스로 **자르고**, 동시에 `absolute`·
`fixed` 자손의 컨테이닝 블록이 된다. 업로드 CSS의 `position`(3-3)과 번들에 이미
있는 Tailwind `fixed inset-0 z-50` 류(D5로 `class`를 허용했다) **양쪽 다** 본문
영역 밖으로 못 나간다.

껍데기가 안전한 이유 — 업로드 셀렉터는 전부 `.course-html `이 앞에 붙고
`:root`/`html`/`body`도 `.course-html`로 바뀐다. 즉 업로드 CSS가 만들 수 있는
가장 바깥 선택 대상이 `.course-html`이고, 껍데기는 그 **조상**이라 어떤 조합으로도
매치되지 않는다. `.course-html-shell`이라고 써도 `.course-html .course-html-shell`이
되어 매치되지 않는다.

대가: **본문 경계를 넘는 표현이 잘린다**(의도적인 음수 마진 장식 등). 자르는 것이
목적이므로 수용한다.

### 3-6. 크기

스코프 후 CSS가 **64KB를 넘으면 CSS 전체를 버린다.** 본문과 합쳐 `detail_html`이
무한정 커지는 것을 막는다. 512KB 상한(07 §3 5단계)은 raw 기준이라 별개다.

## 4-1. CSS 테스트 케이스

`node --test`. 경로 별칭이 안 먹으므로 상대 경로로 import한다.

- `h2{color:red}` → `.course-html h2` 로 시작한다
- `@media (max-width:600px){h2{…}}` → `@media`는 남고 안쪽만 접두된다
- `@keyframes spin{0%{opacity:0}}` → **at-rule 통째로 제거된다**(§3-2).
  `@-webkit-keyframes`도 마찬가지. 남기는 구현으로 바꾸더라도 `0%`/`from`에
  접두가 **붙지 않아야** 한다
- `@keyframes kps-reveal{from,to{opacity:0}}` → 결과에 `kps-reveal`이 **없다**
  (전역 애니메이션 이름 탈취 회귀)
- `@font-face{font-family:Pretendard;src:url(//evil/x.woff2)}` → **제거된다**
- `.x{pos\69 tion:fixed}` → 이스케이프 정규화 후 제거된다
- `.a,.b>.c` → 두 항목 모두 접두되고 `>` 결합자가 살아 있다
- `body{font-family:x}` → `.course-html{font-family:x}` (자손 셀렉터가 아니다)
- `@import url("//evil.com/x.css")` → 결과에 `@import`가 **없다**
- `content:"</style><script>alert(1)</script>"` → 결과에 `</style`가 **없다**
- `background:url(javascript:alert(1))` → 그 선언이 **없다**
- `.x{position:fixed}` → `position:fixed`가 **없다**
- 깨진 CSS(`h2{color:`) → CSS 전체가 버려지고 **본문은 남는다**
- 64KB 초과 CSS → CSS만 버려진다

## 5. postcss 동작 실측 (2026-08-03)

§3(이 문서)의 전제를 `postcss@8.5.16`(이미 전이 의존으로 설치돼 있다)으로 **직접 실행해
확인했다.** 추측이 아니다.

| 확인한 것 | 결과 |
|-----------|------|
| `:is(.a, .b) h2` | `selectors`가 **분할하지 않는다** — 1개. 안전 |
| `[data-x="a,b"], .q` | `["[data-x=\"a,b\"]", ".q"]` — 문자열 안 콤마로 오분할 **안 함** |
| `@keyframes`·`@-webkit-keyframes` | `walkRules`가 `0%`/`100%`/`from`을 **방문한다** → 반드시 건너뛰어야 함 |
| 부모 판별 | `parent.type === "atrule"`, `parent.name`이 `keyframes`/`-webkit-keyframes` |
| `@media`·`@supports` 중첩 | 안쪽 규칙이 정상 방문됨 → 접두 대상이 맞다 |
| `<` → `\3c ` 치환 | 재파싱 통과, 값 보존, 결과에 `</style` **없음** |
| 깨진 CSS (`h2{color:`) | `CssSyntaxError`를 **throw 한다** → fail-closed 구현 가능 |
| `pos\69 tion: fixed` | `decl.prop`이 `"pos\69 tion"` 그대로 → **문자열 비교 우회됨** |
| `--p:fixed; position:var(--p)` | `value`가 `"var(--p)"` → 값 검사로 못 잡는다 |

이 실측이 초안 3곳을 뒤집었다.

1. `/(-)?keyframes$/`는 `-webkit-keyframes`를 못 잡아 애니메이션을 깨뜨린다 → `/keyframes$/i`
2. 속성 이름 블록리스트는 이스케이프·`var()`로 우회된다 → 경계를 컨테인먼트로 옮김(§3-5)
3. `contain: layout`은 바깥 페인트를 자르지 않는다 → `contain: paint` + 바깥 껍데기

`parse5`·`sanitize-html`은 아직 미설치라 실측하지 않았다. **07 3단계에서 설치
직후 같은 방식으로 먼저 확인한 뒤 구현한다** — 특히 `<body>`만 직렬화하는 접근과
`nonTextTags` 동작.
