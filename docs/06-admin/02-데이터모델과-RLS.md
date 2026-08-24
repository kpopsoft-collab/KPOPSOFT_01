# 데이터 모델(Supabase)과 접근 제어(RLS)

> **위치** `docs/06-admin/02-데이터모델과-RLS.md` · **원본** `docs/어드민기획.md` L64–130
> **읽는 순서** ← 이전 [목적 · 범위 · 정보구조와 라우트](01-목적-범위-라우트.md) · [00-START-HERE](00-START-HERE.md) · 다음 [화면별 설계 · 공개 사이트 변경점 · 기술 메모](03-화면설계와-공개사이트-영향.md) →
>
> **함께 보기** 현재 구축 상태는 [../07-dev/02-개발상태.md](../07-dev/02-개발상태.md)

---

## 4. 데이터 모델 (Supabase / PostgreSQL)

### 4.1 `inquiries` — 문의 (P1)

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `type` | text | `프로젝트 문의` / `교육 문의` / `AI 솔루션 문의` — 옵션 label 스냅샷 |
| `subtype` | text | 세부 유형 label 스냅샷(예: `웹 프로젝트`). 폼이 type+subtype 둘 다 제출 |
| `sender` | text | 이름/회사 |
| `contact` | text | 연락처(이메일/전화) |
| `message` | text | 문의 내용 |
| `status` | text | `new` / `in_progress` / `done` (default `new`) |
| `memo` | text | 관리자 내부 메모 |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | 트리거로 갱신 |

- 인덱스: `status`, `created_at desc`.

### 4.2 콘텐츠 테이블 (P2) — site.ts 구조를 그대로 반영

공통 컬럼: `id uuid`, `sort_order int`(정렬), `is_published bool`(노출 토글), `created_at`, `updated_at`.

- `work_items` — client, title, category, accent, **`image_path` text**(커버 이미지, Storage. 없으면 도형 폴백)
- `insights` — tag, title, date, **`slug` text UNIQUE**(상세 URL), **`body` text**(본문·마크다운), **`image_path` text**(커버 이미지) — 목록 카드 + 블로그 상세 겸용(결정 §9)
- `testimonials` — quote, author, program, result
- `experts` — name, role, quote, tags(text[]), accent, **`image_url` text**(강사 사진 Storage 공개 URL. 없으면 이니셜/도형 폴백)
  - **현 코드 상태**: Storage 이관 완료. 강사 3명 모두 DB에 `is_published: true`로 들어가 있고 `image_url`은 Storage `experts` 버킷의 공개 URL을 가리킨다. 실제 컬럼명은 계획상의 `image_path`가 아니라 **`image_url`**(경로가 아닌 전체 URL)이며 [public-content.ts](../../src/lib/public-content.ts) `getPublicExperts`가 이 값을 읽는다.
  - [site.ts](../../src/lib/site.ts) `experts`는 이제 **폴백 전용** — DB 조회가 실패하거나 행이 없을 때만 쓰이고, 이때만 `public/experts/*.jpg` 정적 파일(`image` 필드, public 경로)을 참조한다. 폴백용 `an-younggeun.jpg`/`kim-sanghyuk.jpg`는 유지.
  - 이관 전 원본(김상혁.png/안영근.png/안영근02.png)은 정리 완료. 필요 시 git 히스토리에서 복구 가능.
- `stats` — value(int), suffix, label
- `programs`, `businesses`, `software_categories` 도 **DB화 확정**. 단 변경 빈도 낮으므로 **P2 후반**에 이관(그전까지 site.ts 유지). accent는 기존 `Accent` 타입 7색 CHECK.

**문의 폼 옵션 (`inquiry_types`, `inquiry_subtypes`) — 문의 폼의 유형/세부 유형 선택지 (P2).** 섹션 콘텐츠(programs·businesses)와 값이 겹쳐도 **독립 관리**(결정 §9-3). 하드코딩 금지.

- `inquiry_types` — id, label(text), sort_order(int), is_active(bool)
- `inquiry_subtypes` — id, type_id(FK → inquiry_types), label(text), **`placeholder` text**(문의 내용 입력칸 예시 문구 — 세부 유형별로 다름, 폼 UX 핵심), sort_order(int), is_active(bool)
- 접수된 문의(`inquiries.type` / `inquiries.subtype`)는 옵션 label을 **문자열로 스냅샷 저장**(옵션이 나중에 바뀌어도 과거 문의 내용 보존). FK 강제 아님.
- 현재 시드([site.ts](../../src/lib/site.ts) `inquiryOptions`)는 subtype당 `label` + `placeholder`를 가짐 → 스키마가 이 구조와 일치해야 무손실 이관. 세부 유형 6개 초과 시 폼이 드롭다운으로 전환(현 코드 `asDropdown = subtypes.length > 5`) — 어드민에서 개수 조절 시 이 임계값 인지.
- 현재 코드: [src/lib/site.ts](../../src/lib/site.ts)의 `inquiryOptions`가 시드이자 단일 소스. 공개 폼([final-cta.tsx](../../src/components/sections/final-cta.tsx))은 이미 이 배열만 읽도록 분리돼 있어, P2에서 **데이터 출처만 DB로 교체**하면 된다.

### 4.3 인증 / 권한

- **인증은 관리자 전용**(결정 §9). 스펙의 "회원가입/로그인 포함"은 이 프로젝트에서 **관리자 로그인**으로 해석 — 방문자용 일반 회원 개념 없음. 공개 회원가입 화면 만들지 않음.
- Supabase `auth.users` + `admin_users(user_id uuid PK, email text)` 테이블 + `is_admin()` SQL 함수.
- 관리자 계정은 **수동 부트스트랩**: 첫 계정은 Supabase 콘솔/시드로 생성 후 `admin_users`에 등록. 이후 추가는 어드민 초대 UI(P3).
- `auth.users`에는 관리자만 존재하므로, "일반 유저 vs 관리자" 분기 불필요 → RLS는 `is_admin()` 단일 게이트로 단순.

### 4.4 교육 콘텐츠 테이블 (P3~P5) — 원본 계획에 없던 실제 스키마

원본 문서(`docs/어드민기획.md`)는 P2까지만 적혀 있다. 아래는 그 뒤에 실제로 들어간
것이라 **여기가 유일한 기준**이다.

`20260802120000_p3_education_ver3.sql`이 8종을 만들었다 — `education_org_training`,
**`education_regular_classes`**, `education_club_tiers`, `education_club_cohorts`,
`education_past_programs`, `education_reviews`, `education_faqs`, `education_stats`.
공통 컬럼은 §4.2와 같다.

> ⚠️ **`education_club_cohorts`에는 `is_published`가 없다.** 실수가 아니라 의도다 —
> 기수는 숨길 행이 없고, 감출 기수는 `status='ended'`로 표현한다. 어드민 타입도
> 여기에 맞춰 `OrderedBase`(id+sortOrder)를 쓴다. 이 테이블에 `is_published`를
> 얹으면 `PGRST204`로 거부된다(2026-08-03 실측).

**`education_regular_classes` 확장 컬럼** (P4·P5, 둘 다 적용 완료)

| 컬럼 | 마이그레이션 | 비고 |
|---|---|---|
| `schedule_type` | `20260803090000` | 도메인 `education_schedule_type` = `oneday`/`multi`, 기본 `multi` |
| `start_date` · `end_date` | `20260803090000` | CHECK — `oneday`면 종료일 null, "종료일만 있는" 상태 금지 |
| `detail_html` | `20260803090000` | **정제본만** 들어온다. 화면이 렌더하는 값 |
| `detail_bundle_path` | `20260804090000` | `'<uuid>/'` 또는 `''`. CHECK로 모양 고정 |
| `detail_bundle_name` | `20260804090000` | 표시 전용 |

**`education_regular_class_html_sources`** — 업로드 **원본** 보관용 동반 테이블.
PK는 `id`가 아니라 `class_id`(FK, `on delete cascade`). `raw`, `file_name`,
`updated_at` + 크기 CHECK(5MB, `20260804120000`에서 512KB → 5MB).
원본을 본 테이블 컬럼으로 두지 않는 이유는 §5에 있다.

**Storage** — 번들은 새 버킷을 만들지 않고 기존 `education` 버킷을 쓴다.
키가 겹치지 않는다(이미지는 루트 `<uuid>.<ext>`, 번들은 `<uuid>/` 폴더).
`20260804090000`이 이 버킷의 `allowed_mime_types`를 이미지 4종 → **15종**으로
넓혔다. `file_size_limit`은 5MB 그대로다.

운영 규칙 전문은 [07-과정-상세본문-HTML과-번들.md](07-과정-상세본문-HTML과-번들.md).

### 4.5 콘텐츠 재사용 원칙

- 프로그램·강사·후기·사례는 페이지마다 복제하지 않고 **각 콘텐츠 테이블을 단일 소스**로 사용한다.
- 공개 사이트와 어드민은 같은 행을 읽고, 화면별 노출 차이는 관계와 `is_published`,
  `is_featured`, `sort_order` 같은 상태·정렬 필드로 표현한다.
- 홈·교육 등 여러 화면에 같은 콘텐츠가 필요하면 화면별 사본을 만들지 말고 관계 테이블이나
  조회 계층에서 재사용한다. 공개 화면에는 게시된 데이터만, 어드민에는 전체 데이터를 제공한다.

---

## 5. 접근 제어 (RLS) — 핵심

DB는 항상 RLS ON. 클라이언트 anon 키가 노출되는 전제로 정책을 짠다.

- **`inquiries`**
  - INSERT: `anon` 허용 (공개 폼이 직접 저장). 단, 컬럼 화이트리스트 + 서버 액션 경유 권장(스팸·검증).
  - SELECT / UPDATE / DELETE: `is_admin()` 인 경우만.
- **콘텐츠 테이블**
  - SELECT: `is_published = true` 는 anon 허용(공개 렌더), 전체는 admin.
  - INSERT / UPDATE / DELETE: admin만.
- **`inquiry_types` / `inquiry_subtypes`**
  - SELECT: `is_active = true` anon 허용(공개 폼 렌더), 전체는 admin.
  - INSERT / UPDATE / DELETE: admin만.
- **`education_regular_class_html_sources`** (업로드 원본)
  - SELECT / INSERT / UPDATE / DELETE: `is_admin()` **단일 정책**. anon에게 열지 않는다.
  - **왜 별도 테이블인가** — RLS는 행 단위다. 원본을 `education_regular_classes`
    컬럼으로 두면 게시된 행의 그 컬럼까지 anon에게 열린다. 즉 **정제 전 스크립트가
    공개 API에 그대로 놓인다.** 앱 쿼리에서 컬럼을 빼는 것은 성능 최적화이지
    접근통제가 아니다. 2026-08-03에 카나리 행으로 실증했다(service_role은 보이고
    anon은 0행 — 빈 테이블이라 0행인 것과 구분하려고 실제 행을 넣었다 지웠다).
- **Storage `education` 버킷** — `public read` + 쓰기 3종은 `is_admin()`
  (`20260802120000`). 번들이 같은 버킷을 쓰지만 정책을 새로 만들지 않았다 —
  기존 정책이 `bucket_id = 'education'` 전체에 걸려 있다.
  버킷이 공개인 것은 편의가 아니라 **요구사항**이다. 서명 URL이면 `index.html`
  안의 상대경로가 토큰을 물고 가지 못해 서브 리소스가 전부 깨진다.
- 관리자 화면의 쓰기 작업은 **Server Action / Route Handler**에서 처리하고, 필요 시 service-role 키는 **서버에서만** 사용(절대 클라이언트 번들에 넣지 않음).

---

---

← 이전 [목적 · 범위 · 정보구조와 라우트](01-목적-범위-라우트.md) · [00-START-HERE](00-START-HERE.md) · 다음 [화면별 설계 · 공개 사이트 변경점 · 기술 메모](03-화면설계와-공개사이트-영향.md) →
