-- 포트폴리오 카드 다중 이미지 (docs/KPOPSOFT_Home_Landing_ver3.md §SECTION 05).
--
-- 기존 `image_url`(단일)은 유지한다 — 대표 이미지이자 갤러리가 비었을 때의
-- 폴백이다. 갤러리는 첫 장을 대표 이미지로 쓰므로 둘을 중복 저장하지 않는다.
alter table public.work_items
  add column if not exists image_urls text[] not null default '{}';

comment on column public.work_items.image_urls is
  '갤러리 이미지 경로 배열. 비어 있으면 image_url 한 장만 노출한다.';
