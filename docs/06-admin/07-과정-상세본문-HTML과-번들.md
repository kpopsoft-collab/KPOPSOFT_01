# 정규 클래스 상세 본문 — HTML 한 장과 zip 번들

> **위치** `docs/06-admin/07-과정-상세본문-HTML과-번들.md`
> **읽는 순서** ← 이전 [콘텐츠 폼 공용 셸](06-콘텐츠-폼-공용셸.md) · [00-START-HERE](00-START-HERE.md)
>
> **판단 근거 전문** [../07-dev/10-작업로그-2026-08-03.md](../07-dev/10-작업로그-2026-08-03.md)(정제·CSS 스코프) ·
> [../07-dev/11-작업로그-2026-08-04.md](../07-dev/11-작업로그-2026-08-04.md)(번들·origin)
> **공개 화면 쪽** [../03-education/13-공개-과정-상세페이지.md](../03-education/13-공개-과정-상세페이지.md)

---

`/education/programs/[slug]` 상세 페이지의 **본문을 어드민이 무엇으로 채우는가**에
대한 기준이다. 정규 클래스(`education_regular_classes`)에만 있는 기능이고,
2026-08-03(HTML)과 2026-08-04(번들) 두 번에 걸쳐 들어왔다. **DDL·코드 모두 적용됨.**

## 1. 본문은 셋 중 **하나**다

어드민 폼의 "상세 본문" 라디오가 진실이다. 두 위젯을 나란히 놓으면 어느 쪽이
화면에 나오는지 어드민이 알 수 없어서, 처음부터 택일로 만들었다.

| 방식 | 저장 위치 | 화면 |
|------|----------|------|
| **없음** | — | `curriculum` 배열 기반 고정 레이아웃(`CurriculumTimeline`) |
| **HTML 파일 1개** | `detail_html`(정제본) + 동반 테이블(원본) | 본문에 그대로 렌더 |
| **zip 번들** | `education` 버킷 `<uuid>/` 폴더 + `detail_bundle_path` | **새 탭 링크** 블록 |

방식을 바꿔 저장하면 안 고른 쪽은 비워진다. HTML은 `.html` **한 장**만 받으므로
이미지·CSS·서브 페이지가 딸린 자료는 zip을 쓴다 — 텍스트 컬럼 하나로는
`<img src="images/a.png">`가 가리킬 대상 자체가 없다.

## 2. 데이터가 어디에 있나

| 무엇 | 어디 | 비고 |
|------|------|------|
| 일정 유형 | `schedule_type` (`oneday`/`multi` 도메인) | 기본 `multi` |
| 일정 날짜 | `start_date` · `end_date` | CHECK — `oneday`면 종료일 null, 종료일만 있는 상태 금지 |
| 본문 HTML(**정제본**) | `detail_html` text | **렌더되는 값은 이것뿐이다** |
| 본문 HTML(**원본**) | `education_regular_class_html_sources` (PK `class_id`) | 관리자 전용 별도 테이블 |
| 번들 폴더 | `detail_bundle_path` — `'<uuid>/'` 또는 `''` | CHECK로 모양 고정 |
| 번들 원래 파일명 | `detail_bundle_name` | 표시 전용, 제약 없음 |
| 번들 파일 실체 | Storage `education` 버킷 `<uuid>/…` | 과정 이미지와 **같은 버킷** |

마이그레이션: `20260803090000_regular_class_schedule_and_html.sql`,
`20260804090000_course_bundle_storage.sql`, `20260804120000_html_raw_size_limit.sql`.

## 3. 깨뜨리면 안 되는 규칙

### 3-1. 원본과 정제본을 같은 테이블에 두지 않는다

RLS는 **행 단위**다. 원본을 `education_regular_classes` 컬럼으로 두면 게시된 행의
그 컬럼까지 anon에게 열린다 — 정제 전 스크립트가 공개 API로 그대로 내려간다.
앱 쿼리에서 빼는 것은 성능 최적화이지 접근통제가 아니다.
동반 테이블은 `is_admin()` 단일 정책이고, 2026-08-03에 카나리 행으로 실증했다.

### 3-2. 정제는 저장 때 한 번, 렌더 직전에 한 번 더

관리자는 RLS상 테이블을 직접 고칠 수 있어 서버 액션을 우회해 `detail_html`에
값을 넣는 경로가 남는다. 그래서 공개 화면이 `sanitizeCourseHtml()`을 **다시**
부른다([../03-education/13](../03-education/13-공개-과정-상세페이지.md) G2).
2회 정제는 **멱등이어야 한다** — 이미 스코프된 셀렉터에 접두를 또 붙이면
어드민에서는 저장되고 공개 페이지에서만 스타일이 통째로 사라진다(실제로 났던 일).

폼의 `Input` 타입은 `detailHtml`을 **Omit** 한다. 폼이 정제를 건너뛰는 값을
구조적으로 보낼 수 없게 한 것이다.

### 3-3. 폼이 보내는 건 문자열이 아니라 **의도**다

`HtmlIntent` / `BundleIntent` = `keep | replace | remove`, 기본값 `keep`.
`keep`이면 해당 키를 patch에서 아예 뺀다.

> **핵심 회귀 테스트** — HTML이나 번들이 있는 과정을 열어 **이름만 고쳐 저장해도
> 본문이 남아 있어야 한다.** 여기가 무너지면 어드민이 제목 하나 고치다 자료를
> 통째로 날린다. 라디오를 건드리지 않으면 양쪽 다 `keep`이라 이 성질이 성립한다.

### 3-4. 삭제 순서를 뒤집지 않는다

옛 경로 확보 → **DB update 성공 → 그 다음에** 옛 폴더 삭제.
먼저 지웠다가 update가 실패하면 화면에는 살아 있는 번들이 Storage에서만 사라진다.
이 순서면 최악이 고아 폴더이고, 그건 무해하다 — 그래서 삭제 실패는 **의도적으로
삼킨다**(사용자에게 "저장 실패"를 보여주면 실제로 저장된 것을 되돌리려 든다).

폴더 키는 클래스 id가 아니라 **업로드마다 새 UUID**다. 새로 만드는 화면에는
id가 아직 없고, 교체하면 새 폴더라 CDN 캐시 문제도 같이 사라진다.

### 3-5. 번들 URL을 우리 도메인으로 프록시하지 않는다

번들은 `*.supabase.co` **새 탭**으로 연다. 그 origin에는 훔칠 것이 없다 —
supabase-js는 세션을 앱 origin의 localStorage에 두고, Supabase는 쿠키가 아니라
Bearer 토큰을 쓴다. `kpopsoft.com/...`으로 감싸는 순간 이 판단이 통째로 뒤집힌다.
**링크 URL이 `*.supabase.co`인지가 이 결정의 검증 항목이다.**

서명 URL도 안 된다 — `index.html` 안의 상대경로가 서명 토큰을 물고 가지 못해
서브 리소스가 전부 깨진다.

### 3-6. 경로 CHECK는 이미지까지 지키는 제약이다

번들이 과정 이미지와 **같은 버킷**을 쓴다(키는 안 겹친다 — 이미지는 루트
`<uuid>.<ext>`, 번들은 `<uuid>/` 폴더). 삭제 prefix가 어긋나면 같은 버킷의
이미지가 사정권에 들어오므로, `detail_bundle_path`의 UUID 한 세그먼트 CHECK를
느슨하게 바꾸지 않는다. 앱에도 같은 정규식(`BUNDLE_PATH_RE`)이 있다.

## 4. 같은 값이 여러 곳에 있다 — 하나만 고치면 안 된다

| 값 | 어디 |
|---|---|
| HTML 상한 **5MB** | `html-upload.tsx` `MAX_BYTES` · `actions.ts` `MAX_RAW_BYTES` · 동반 테이블 CHECK(`20260804120000`) · `next.config.ts` `bodySizeLimit: "8mb"` |
| 번들 파일당 **5MB** | `course-bundle.ts` `MAX_FILE_BYTES` = `education` 버킷 `file_size_limit` |
| 허용 MIME **15종** | `course-bundle.ts` `EXT_MIME` = 버킷 `allowed_mime_types` |
| 버킷 이름 | `course-bundle.ts` `BUNDLE_BUCKET`(위젯·리포·공개 리더가 공유) |

`bodySizeLimit`이 진짜 병목이다. 원본 HTML은 Storage를 거치지 않고 **서버 액션
인자로 실려 오므로**, 이 값이 작으면 서버 검사에 닿기도 전에 요청이 잘린다.
그리고 이 한도는 **모든 서버 액션에 걸린다**(공개 문의 폼 포함) — Next에 액션별
한도가 없어서다. 더 올릴 일이 생기면 그 업로드를 Storage 직접 업로드로 빼는
쪽을 먼저 본다(번들이 이미 그 방식이다).

## 5. 컬럼을 늘릴 때 함께 움직이는 곳

어드민 select 컬럼이 `FIELDS`에서 **자동 파생**되므로, 컬럼 없는 DB에 코드를
먼저 내보내면 **어드민 목록이 500, 저장이 `PGRST204`** 로 죽는다. 공개 상세는
조용히 정적 폴백으로 떨어져 옛 데이터가 그대로 보인다 — 이쪽이 더 알아채기 어렵다.
**로컬이 곧 운영이므로 항상 `DDL 적용 → 확인 쿼리 → 배포` 순서다.**

상세 전용 컬럼(`detail_html`·`detail_bundle_path`)은 공통 컬럼 상수에 넣지 않고
**상세 단건 쿼리에만** 붙인다. 목록이 쓰지도 않는 컬럼 때문에 `/education`까지
같이 폴백으로 떨어질 이유가 없다.

닿는 파일은 [../../backlogs/00-START-HERE.md](../../backlogs/00-START-HERE.md)
"공통 배경" 표가 기준이다(필드 하나에 7~8곳).

---

← 이전 [콘텐츠 폼 공용 셸](06-콘텐츠-폼-공용셸.md) · [00-START-HERE](00-START-HERE.md)
