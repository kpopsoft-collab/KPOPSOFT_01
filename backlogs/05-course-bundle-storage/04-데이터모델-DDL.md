# 데이터 모델 · DDL

← [03-보안판단.md](03-보안판단.md) · → [05-구현계획.md](05-구현계획.md)

> ⚠️ **DDL은 사용자가 직접 실행한다.** 에이전트는 이 SQL을 작성만 하고
> 적용하지 않는다(`.claude/hooks/block-ddl.mjs`가 막는다).
> 로컬과 운영이 프로젝트 하나를 공유하므로 **실행 = 운영 반영**이다.

## 1. 컬럼

`public.education_regular_classes`에 **2개** 추가한다.

| 컬럼 | 타입 | 뜻 |
|---|---|---|
| `detail_bundle_path` | `text not null default ''` | `<uuid>/` — 버킷 안 폴더. 빈 문자열이면 번들 없음 |
| `detail_bundle_name` | `text not null default ''` | 올린 zip의 원래 파일명. 어드민 화면 표시용 |

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
-- P5: 정규 클래스 상세 번들(다중 파일) — 컬럼 + Storage 버킷
-- 근거: backlogs/05-course-bundle-storage/03-보안판단.md, 04-데이터모델-DDL.md
--
-- 기존 데이터는 수정하지 않는다. 기존 행은 detail_bundle_path='' 로 남는다
-- (번들 없음 = 정상 상태). detail_html 경로는 그대로 살아 있다(D6).
--
-- 모든 문장이 if not exists / duplicate_object / on conflict 처리라
-- 재실행해도 안전하다.
-- 적용 순서: ... → 20260803090000_regular_class_schedule_and_html.sql → 본 파일.

-- ── 컬럼 ──────────────────────────────────────────────────────────────
alter table public.education_regular_classes
  -- 'class-bundles' 버킷 안의 폴더. '<uuid>/' 형태이고 빈 문자열이면 번들 없음.
  add column if not exists detail_bundle_path text not null default '',
  -- 올린 zip의 원래 이름. 화면 표시 전용이라 무결성 제약을 걸지 않는다.
  add column if not exists detail_bundle_name text not null default '';

-- ── 무결성 ────────────────────────────────────────────────────────────
-- 경로 모양을 UUID 한 세그먼트로 고정한다. 앱의 삭제 루틴이 이 값을 prefix로
-- 써서 Storage 객체를 지우므로, 임의 문자열이 들어오면 남의 폴더를 지울 수 있다.
do $$ begin
  alter table public.education_regular_classes
    add constraint education_regular_classes_bundle_path_ck check (
      detail_bundle_path = ''
      or detail_bundle_path ~
         '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/$'
    );
exception when duplicate_object then null; end $$;

-- ── Storage: class-bundles 버킷 ───────────────────────────────────────
-- 20260802120000(education 버킷)과 같은 패턴. 기존 버킷 정책은 건드리지 않는다.
--
-- public=true 는 편의가 아니라 요구사항이다 — index.html 안의 상대경로
-- 참조가 서명 토큰을 물고 갈 수 없어서 서명 URL로는 서브 리소스가 전부 깨진다.
--
-- allowed_mime_types 는 클라이언트 확장자 허용목록의 2차 방어선이다.
-- src/lib/admin/course-bundle.ts 의 EXT_MIME 과 **같은 집합**이어야 한다.
-- 어긋나면 업로드가 원인 모를 오류로 실패한다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'class-bundles', 'class-bundles', true,
  10485760,                                    -- 객체 1개당 10MB
  array[
    'text/html','text/css','text/javascript','application/json',
    'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
    'image/avif','image/x-icon',
    'font/woff','font/woff2','font/ttf','font/otf'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists class_bundles_public_read on storage.objects;
create policy class_bundles_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'class-bundles');

drop policy if exists class_bundles_admin_insert on storage.objects;
create policy class_bundles_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'class-bundles' and public.is_admin());

drop policy if exists class_bundles_admin_update on storage.objects;
create policy class_bundles_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'class-bundles' and public.is_admin())
  with check (bucket_id = 'class-bundles' and public.is_admin());

drop policy if exists class_bundles_admin_delete on storage.objects;
create policy class_bundles_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'class-bundles' and public.is_admin());

-- ── 되돌리기 (down) ───────────────────────────────────────────────────
--   drop policy if exists class_bundles_public_read   on storage.objects;
--   drop policy if exists class_bundles_admin_insert  on storage.objects;
--   drop policy if exists class_bundles_admin_update  on storage.objects;
--   drop policy if exists class_bundles_admin_delete  on storage.objects;
--   delete from storage.objects where bucket_id = 'class-bundles';  -- 파일이 지워진다
--   delete from storage.buckets where id = 'class-bundles';
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

-- 3) 버킷과 정책
select id, public, file_size_limit, array_length(allowed_mime_types, 1)
from storage.buckets where id = 'class-bundles';

select policyname, cmd from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'class_bundles%';
```

**정상 상태**: 컬럼 2개 `text` `''`, 잘못된 경로 4종 전부 `23514`,
버킷 `public=t` `10485760` MIME 15종, 정책 4건.

## 4. 앱 쪽 타입

```ts
// content-types.ts — EducationRegularClass 에 추가
/** 'class-bundles' 버킷 안의 폴더('<uuid>/'). 빈 문자열이면 번들 없음. */
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
