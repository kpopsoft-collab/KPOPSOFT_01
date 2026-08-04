-- P5: 상세 HTML 원본 크기 상한을 512KB → 5MB로 올린다
-- 근거: 실제 상세 자료가 512KB로는 들어가지 않는다(2026-08-04 사용자 요청).
--
-- 같은 값이 4곳에 있다. 하나만 고치면 통과한 파일이 다음 층에서 거부돼
-- 원인을 알기 어렵다:
--   src/components/admin/content/html-upload.tsx  MAX_BYTES
--   src/app/admin/(shell)/content/education/regular-classes/actions.ts  MAX_RAW_BYTES
--   next.config.ts  serverActions.bodySizeLimit  (이보다 커야 한다 — 8mb)
--   본 파일의 CHECK
--
-- 정제본(education_regular_classes.detail_html)에는 크기 CHECK가 없다.
-- 원본을 막으면 정제본은 그보다 커질 수 없어서다.
--
-- drop 후 add라 재실행해도 안전하다.
-- 적용 순서: ... → 20260804090000_course_bundle_storage.sql → 본 파일.

alter table public.education_regular_class_html_sources
  drop constraint if exists education_regular_class_html_raw_size_ck;

alter table public.education_regular_class_html_sources
  add constraint education_regular_class_html_raw_size_ck
    check (octet_length(raw) <= 5242880);          -- 5MB. 서버 검사와 같은 값

-- ── 되돌리기 (down) ───────────────────────────────────────────────────
-- 되돌리기 전에 5MB를 넘는 행이 없는지 먼저 본다. 있으면 add가 실패한다.
--   select class_id, octet_length(raw) from public.education_regular_class_html_sources
--    where octet_length(raw) > 524288;
--
--   alter table public.education_regular_class_html_sources
--     drop constraint if exists education_regular_class_html_raw_size_ck;
--   alter table public.education_regular_class_html_sources
--     add constraint education_regular_class_html_raw_size_ck
--       check (octet_length(raw) <= 524288);
