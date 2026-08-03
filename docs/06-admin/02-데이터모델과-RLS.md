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
- 관리자 화면의 쓰기 작업은 **Server Action / Route Handler**에서 처리하고, 필요 시 service-role 키는 **서버에서만** 사용(절대 클라이언트 번들에 넣지 않음).

---

---

← 이전 [목적 · 범위 · 정보구조와 라우트](01-목적-범위-라우트.md) · [00-START-HERE](00-START-HERE.md) · 다음 [화면별 설계 · 공개 사이트 변경점 · 기술 메모](03-화면설계와-공개사이트-영향.md) →
