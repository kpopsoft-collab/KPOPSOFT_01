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
