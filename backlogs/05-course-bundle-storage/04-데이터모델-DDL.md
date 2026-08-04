# 데이터 모델 · DDL

← [03-보안판단.md](03-보안판단.md) · → [05-구현계획.md](05-구현계획.md)

> ⚠️ **DDL은 사용자가 직접 실행한다.** 에이전트는 이 SQL을 작성만 하고
> 적용하지 않는다(`.claude/hooks/block-ddl.mjs`가 막는다).
> 로컬과 운영이 프로젝트 하나를 공유하므로 **실행 = 운영 반영**이다.

## 1. 컬럼

`public.education_regular_classes`에 **2개** 추가한다.

| 컬럼 | 타입 | 뜻 |
|---|---|---|
| `detail_bundle_path` | `text not null default ''` | `<uuid>/` — **`education` 버킷** 안 폴더. 빈 문자열이면 번들 없음 |
| `detail_bundle_name` | `text not null default ''` | 올린 zip의 원래 파일명. 어드민 화면 표시용 |

### 왜 새 버킷을 만들지 않는가 (2026-08-04 사용자 확정)

`education` 버킷이 이미 있고 **필요한 모양 그대로**다 — `public = true`,
정책 4건(read `anon, authenticated` / write `is_admin()`). 새로 파면 같은 것을
두 벌 관리하게 된다. 키도 겹치지 않는다: 과정 이미지는 루트에 `<uuid>.<ext>`,
번들은 `<uuid>/…` 폴더다.

두 가지가 따라온다.

- `allowed_mime_types`가 **이미지 4종뿐**이라 HTML·CSS·JS·폰트를 받도록 넓혀야
  한다. 이게 이 마이그레이션이 Storage에 하는 유일한 변경이다
- `file_size_limit`이 **5MB**다. 번들 때문에 이미지 쪽 제약을 풀지 않고,
  코드의 `MAX_FILE_BYTES`를 이 값에 맞췄다. 총량 상한이 20MB라 실질 제약이 아니다

### 왜 URL이 아니라 경로인가

URL을 저장하면 프로젝트 ref(`oxkxkqfwliobkyyexjtk`)가 모든 행에 박힌다.
프로젝트가 바뀌면 전 행이 죽고, 삭제할 때 URL에서 경로를 역파싱해야 한다.
공개 URL은 `getPublicUrl()`로 언제든 만들 수 있다.

### CHECK가 하는 일

`^<uuid>/$` 모양만 허용한다. **삭제 루틴이 임의 prefix를 지우지 못하게 하는
것이 목적**이다([03](03-보안판단.md) §3-1). 앱이 뚫려도 DB가 한 번 더 막는다.

### 컬럼 3개가 아닌 이유

진입 파일명(`index.html`)은 저장하지 않는다. 업로드할 때 공통 접두사를
벗겨 **`index.html`이 항상 폴더 최상단에 오도록 정규화**하기 때문이다
([05](05-구현계획.md) 3단계). 파일 개수·업로드 시각도 저장하지 않는다 —
개수는 `list()`로 세면 되고, 시각은 기존 `updated_at`이 있다.

## 2. SQL — `supabase/migrations/20260804090000_course_bundle_storage.sql`

```sql
-- P5: 정규 클래스 상세 번들(다중 파일) — 컬럼 + education 버킷 MIME 확장
-- 근거: backlogs/05-course-bundle-storage/03-보안판단.md, 04-데이터모델-DDL.md
--
-- 번들은 **기존 education 버킷**에 올린다. 새 버킷을 만들지 않는다 —
-- public=true와 정책 4건이 이미 필요한 모양 그대로다(§1 "왜 새 버킷을...").
-- 키도 겹치지 않는다: 이미지는 '<uuid>.<ext>'(루트), 번들은 '<uuid>/…'(폴더).
--
-- 기존 데이터는 수정하지 않는다. 기존 행은 detail_bundle_path='' 로 남는다.
-- 모든 문장이 if not exists / duplicate_object / 멱등 update라 재실행해도 안전하다.

-- ── 컬럼 ──────────────────────────────────────────────────────────────
alter table public.education_regular_classes
  add column if not exists detail_bundle_path text not null default '',
  add column if not exists detail_bundle_name text not null default '';

-- ── 무결성 ────────────────────────────────────────────────────────────
-- 앱의 삭제 루틴이 이 값을 prefix로 써서 Storage 객체를 지운다. 버킷을 과정
-- 이미지와 공유하므로, 임의 문자열이 들어오면 이미지까지 사정권에 들어온다.
do $$ begin
  alter table public.education_regular_classes
    add constraint education_regular_classes_bundle_path_ck check (
      detail_bundle_path = ''
      or detail_bundle_path ~
         '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/$'
    );
exception when duplicate_object then null; end $$;

-- ── Storage: education 버킷의 MIME 허용목록 확장 ───────────────────────
-- 원래 4종(20260802120000): image/jpeg, image/png, image/webp, image/svg+xml.
-- 아래 15종은 그 4종을 **포함하는 상위집합**이라 이미지 업로드는 그대로 동작한다.
-- src/lib/admin/course-bundle.ts 의 EXT_MIME 과 **같은 집합**이어야 한다.
-- file_size_limit(5242880 = 5MB)은 건드리지 않는다 — 코드가 이 값에 맞춘다.
update storage.buckets
   set allowed_mime_types = array[
     'text/html','text/css','text/javascript','application/json',
     'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
     'image/avif','image/x-icon',
     'font/woff','font/woff2','font/ttf','font/otf'
   ]
 where id = 'education';

-- 정책은 새로 만들지 않는다. education_bucket_*(20260802120000) 4건이
-- bucket_id = 'education' 전체에 걸려 있어 번들 객체에도 그대로 적용된다.

-- ── 되돌리기 (down) ───────────────────────────────────────────────────
--   -- 번들 객체만 지운다. 과정 이미지는 루트에 있어 이름에 '/'가 없다.
--   delete from storage.objects
--    where bucket_id = 'education' and name like '%/%';
--   update storage.buckets
--      set allowed_mime_types =
--          array['image/jpeg','image/png','image/webp','image/svg+xml']
--    where id = 'education';
--   alter table public.education_regular_classes
--     drop constraint if exists education_regular_classes_bundle_path_ck,
--     drop column if exists detail_bundle_path,
--     drop column if exists detail_bundle_name;
```

## 3. 실행 후 확인

```sql
-- 1) 컬럼 2개
select column_name, data_type, column_default
from information_schema.columns
where table_name = 'education_regular_classes'
  and column_name like 'detail_bundle%';

-- 2) CHECK가 실제로 막는가 — 한 줄씩 따로 돌린다.
--    각각 23514(check_violation)로 거부돼야 한다. 행이 실제로 매칭돼야
--    CHECK가 도므로 존재하는 slug를 쓴다.
update public.education_regular_classes
   set detail_bundle_path = '../other/' where slug = 'ai-tools';   -- 경로 탈출
update public.education_regular_classes
   set detail_bundle_path = 'abc'       where slug = 'ai-tools';   -- UUID 아님
update public.education_regular_classes
   set detail_bundle_path = '11111111-2222-3333-4444-555555555555'
 where slug = 'ai-tools';                                          -- 끝 '/' 없음
update public.education_regular_classes
   set detail_bundle_path = '11111111-2222-3333-4444-555555555555/x/'
 where slug = 'ai-tools';                                          -- 세그먼트 2개

-- 3) 버킷 — MIME이 15종으로 넓어졌는지. 정책은 이미 있던 것을 그대로 쓴다.
select id, public, file_size_limit, array_length(allowed_mime_types, 1)
from storage.buckets where id = 'education';

select policyname, cmd from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'education_bucket%';
```

**정상 상태**: 컬럼 2개 `text` `''`, 잘못된 경로 4종 전부 `23514`,
버킷 `public=t` `file_size_limit=5242880` **MIME 15종**, 정책 4건(기존 그대로).


## 4. 앱 쪽 타입

```ts
// content-types.ts — EducationRegularClass 에 추가
/** 'education' 버킷 안의 폴더('<uuid>/'). 빈 문자열이면 번들 없음. */
detailBundlePath: string;
/** 올린 zip의 원래 파일명 — 어드민 화면 표시 전용. */
detailBundleName: string;

// content-types.ts — HtmlIntent 바로 아래
export type BundleIntent =
  | { kind: "keep" }                                  // 기본값 — 손대지 않는다
  | { kind: "replace"; path: string; fileName: string }
  | { kind: "remove" };
```

`BundleIntent`가 `HtmlIntent`와 같은 모양인 이유는
[02-현황분석.md](02-현황분석.md) §1-3에 있다 — **이름만 고쳐 저장했을 때
번들이 조용히 지워지는 것을 막는 유일한 장치**다.
