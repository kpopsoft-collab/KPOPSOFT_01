-- P5: 정규 클래스 상세 번들(다중 파일) — 컬럼 + education 버킷 MIME 확장
-- 근거: backlogs/05-course-bundle-storage/03-보안판단.md, 04-데이터모델-DDL.md
--
-- 번들은 **기존 education 버킷**에 올린다. 새 버킷을 만들지 않는다 —
-- public=true와 정책 4건(read anon/authenticated, write는 is_admin())이
-- 이미 필요한 모양 그대로라, 새 버킷을 파면 같은 것을 두 벌 관리하게 된다.
-- 키도 겹치지 않는다: 이미지는 '<uuid>.<ext>'(루트), 번들은 '<uuid>/…'(폴더).
--
-- 기존 데이터는 수정하지 않는다. 기존 행은 detail_bundle_path='' 로 남는다
-- (번들 없음 = 정상 상태). detail_html 경로는 그대로 살아 있다(D6).
--
-- 모든 문장이 if not exists / duplicate_object / 멱등 update라 재실행해도 안전하다.
-- 적용 순서: ... → 20260803090000_regular_class_schedule_and_html.sql → 본 파일.

-- ── 컬럼 ──────────────────────────────────────────────────────────────
alter table public.education_regular_classes
  -- 'education' 버킷 안의 폴더. '<uuid>/' 형태이고 빈 문자열이면 번들 없음.
  add column if not exists detail_bundle_path text not null default '',
  -- 올린 zip의 원래 이름. 화면 표시 전용이라 무결성 제약을 걸지 않는다.
  add column if not exists detail_bundle_name text not null default '';

-- ── 무결성 ────────────────────────────────────────────────────────────
-- 경로 모양을 UUID 한 세그먼트로 고정한다. 앱의 삭제 루틴이 이 값을 prefix로
-- 써서 Storage 객체를 지우므로, 임의 문자열이 들어오면 남의 폴더를 지울 수 있다.
-- 버킷을 이미지와 공유하게 되면서 이 제약이 더 중요해졌다 — prefix가 어긋나면
-- 같은 버킷의 과정 이미지까지 사정권에 들어온다.
do $$ begin
  alter table public.education_regular_classes
    add constraint education_regular_classes_bundle_path_ck check (
      detail_bundle_path = ''
      or detail_bundle_path ~
         '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/$'
    );
exception when duplicate_object then null; end $$;

-- ── Storage: education 버킷의 MIME 허용목록 확장 ───────────────────────
-- 원래 4종이었다(20260802120000): image/jpeg, image/png, image/webp, image/svg+xml.
-- 아래 15종은 그 4종을 **포함하는 상위집합**이라 기존 이미지 업로드는 그대로 동작한다.
-- HTML·CSS·JS·폰트를 받지 못하면 번들 업로드가 통째로 막히므로 이 확장이 필요하다.
--
-- 이 목록은 클라이언트 확장자 허용목록의 2차 방어선이다.
-- src/lib/admin/course-bundle.ts 의 EXT_MIME 과 **같은 집합**이어야 한다.
-- 어긋나면 업로드가 원인 모를 오류로 실패한다.
--
-- file_size_limit(5242880 = 5MB)은 **건드리지 않는다.** 번들 때문에 이미지 쪽
-- 제약을 풀 이유가 없어서, 대신 코드의 MAX_FILE_BYTES를 이 값에 맞췄다.
update storage.buckets
   set allowed_mime_types = array[
     'text/html','text/css','text/javascript','application/json',
     'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
     'image/avif','image/x-icon',
     'font/woff','font/woff2','font/ttf','font/otf'
   ]
 where id = 'education';

-- 정책은 새로 만들지 않는다. education_bucket_{public_read,admin_insert,
-- admin_update,admin_delete}(20260802120000)가 bucket_id = 'education' 전체에
-- 걸려 있어 번들 객체에도 그대로 적용된다.

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
