-- P4: 정규 클래스 일정 유형(원데이/다회차) + HTML 상세 본문
-- 근거: backlogs/01-regular-class-schedule-and-html/
--       07-실행계획-확정.md, 10-마이그레이션-DDL.md
--
-- 기존 데이터는 수정하지 않는다. 기존 4개 과정은 schedule_type='multi',
-- 날짜 null 로 남는다(상시 과정 = 날짜 없음이 정상 상태).
--
-- ⚠️ 이 DDL은 2026-08-03 운영 DB에 **이미 수동 적용됐다**.
--    이 파일은 이력을 남기기 위한 것이다. 모든 문장이 if not exists /
--    duplicate_object 처리라 재실행해도 안전하다.
--
-- 공통: set_updated_at() / is_admin() 은 P1·P2에서 이미 생성됨.
-- 적용 순서: ... → 20260802140000_home_pillars.sql → 본 파일.

-- ── 도메인 ────────────────────────────────────────────────────────────
do $$ begin
  create domain public.education_schedule_type as text
    check (value in ('oneday', 'multi'));
exception when duplicate_object then null; end $$;

-- ── 컬럼 ──────────────────────────────────────────────────────────────
alter table public.education_regular_classes
  add column if not exists schedule_type public.education_schedule_type
    not null default 'multi',
  add column if not exists start_date date,
  add column if not exists end_date   date,
  -- 정제 완료본만 들어온다. 렌더되는 값은 이것뿐이다.
  add column if not exists detail_html text not null default '';

-- ── 무결성 ────────────────────────────────────────────────────────────
-- 날짜는 "없어도 되지만, 있으면 앞뒤가 맞아야 한다".
-- "종료일만 있는" 상태도 막는다 — 시작을 모르는 종료일은 화면이 쓸 수 없다.
do $$ begin
  alter table public.education_regular_classes
    add constraint education_regular_classes_schedule_ck check (
      (schedule_type = 'oneday' and end_date is null)
      or (schedule_type = 'multi' and (
            end_date is null
            or (start_date is not null and end_date >= start_date)
      ))
    );
exception when duplicate_object then null; end $$;

-- ── 업로드 원본: 관리자 전용 동반 테이블 ──────────────────────────────
-- 원본은 정제 전 스크립트를 그대로 담는다. 같은 테이블에 두면 RLS가 행 단위라
-- 게시된 행의 이 컬럼까지 anon에게 열린다 = 공개 API에 XSS 페이로드가 놓인다.
create table if not exists public.education_regular_class_html_sources (
  class_id   uuid primary key
             references public.education_regular_classes (id) on delete cascade,
  raw        text not null default '',
  file_name  text not null default '',
  updated_at timestamptz not null default now(),
  constraint education_regular_class_html_raw_size_ck
    check (octet_length(raw) <= 524288)          -- 512KB. 서버 검사와 같은 값
);

alter table public.education_regular_class_html_sources enable row level security;

drop policy if exists education_html_sources_admin_all
  on public.education_regular_class_html_sources;
create policy education_html_sources_admin_all
  on public.education_regular_class_html_sources for all
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists set_updated_at on public.education_regular_class_html_sources;
create trigger set_updated_at before update
  on public.education_regular_class_html_sources
  for each row execute function public.set_updated_at();

-- ── 되돌리기 (down) ───────────────────────────────────────────────────
--   drop table if exists public.education_regular_class_html_sources;
--   alter table public.education_regular_classes
--     drop constraint if exists education_regular_classes_schedule_ck,
--     drop column if exists schedule_type, drop column if exists start_date,
--     drop column if exists end_date,      drop column if exists detail_html;
--   drop domain if exists public.education_schedule_type;
