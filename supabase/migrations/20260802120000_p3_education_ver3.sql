-- P3: Education 페이지 스키마 (ver3 3분류 체계)
-- 근거: docs/KPOPSOFT_Education_Page_ver3.md, docs/KPOPSOFT_education_page_revision_request.md
--       현재 정적 데이터: src/lib/education-content.ts
--
-- 이 파일은 같은 이름의 ver2 스키마(20260717120000_p3_education_schema.sql)를 대체한다.
-- 그 파일은 DB에 **적용된 적이 없고**(education_* 테이블이 실재하지 않음) ver3의
-- 3분류 체계(조직·기업 / 정규 클래스 / 커뮤니티 클럽)와 구조가 맞지 않아 삭제했다.
--
-- 공통: set_updated_at() / is_admin() / brand_accent 는 P1·P2에서 이미 생성됨.
-- 적용 순서: P1 → P2(content) → P2(storage) → 본 파일.
--
-- 되돌리기 (down) — 파일 하단 주석 참고.

-- ── 도메인 타입 ──────────────────────────────────────────────────────

-- 교육 3분류. 홈·교육 전 영역이 공유하는 단일 체계다.
do $$ begin
  create domain public.education_category as text
    check (value in ('org', 'regular', 'club'));
exception when duplicate_object then null; end $$;

-- 클럽 기수 모집 상태. 날짜 자동 계산에 기대지 않고 운영자가 명시한다 —
-- 조기 마감·연장 같은 판단이 달력보다 우선하기 때문이다.
do $$ begin
  create domain public.club_cohort_status as text
    check (value in ('upcoming', 'open', 'closed', 'ended'));
exception when duplicate_object then null; end $$;

-- 정규 클래스 학습 트랙. 방문자가 고르는 탐색 축이라 3분류와 별개다.
do $$ begin
  create domain public.education_track as text
    check (value in ('beginner', 'practical'));
exception when duplicate_object then null; end $$;

-- ── 01. 조직·기업 맞춤 교육 — 싱글턴 ──────────────────────────────────
-- 상품이 하나뿐이라 목록이 아니라 단일 행이다. `singleton` 컬럼으로 두 번째
-- 행이 생기는 것을 막는다 — 어드민 실수로 행이 늘면 어느 것이 진짜인지
-- 화면이 판단할 방법이 없다.
create table if not exists public.education_org_training (
  id               uuid primary key default gen_random_uuid(),
  singleton        boolean not null default true unique check (singleton),
  title            text not null default '',
  description      text not null default '',   -- 줄바꿈(\n) 포함 가능
  min_participants text not null default '',
  image_url        text,
  image_alt        text not null default '',
  image_caption    text not null default '',
  cta_label        text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── 02. 정규 클래스 — 4과정 ───────────────────────────────────────────
create table if not exists public.education_regular_classes (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  index_label     text not null default '',    -- "01" — 화면에 그대로 찍는 표기
  name            text not null default '',
  subtitle        text not null default '',
  description     text not null default '',
  duration        text not null default '',    -- "4주"
  level           text not null default '',    -- "입문·중급" (사람이 읽는 표기)
  tracks          public.education_track[] not null default '{}',
  accent          public.brand_accent not null default 'blue',
  image_url       text,
  image_alt       text not null default '',
  image_caption   text not null default '',
  curriculum      text[] not null default '{}',
  detail_href     text not null default '',
  seo_title       text not null default '',
  seo_description text not null default '',
  is_published    boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists education_regular_classes_published_order_idx
  on public.education_regular_classes (is_published, sort_order);

-- ── 03. 커뮤니티 클럽 — 기수 ──────────────────────────────────────────
create table if not exists public.education_club_cohorts (
  id             uuid primary key default gen_random_uuid(),
  label          text not null default '',     -- "1기"
  status         public.club_cohort_status not null default 'upcoming',
  recruit_period text not null default '',
  run_period     text not null default '',
  price          text not null default '',
  list_price     text not null default '',     -- 할인 전 정가. 있으면 취소선으로 함께 노출
  capacity       text not null default '',
  note           text not null default '',     -- 마감·연기 사유 한 줄
  -- 상태가 open이어도 아직 신청을 받지 않는 준비 기간을 위한 스위치.
  -- 버튼을 없애지 않고 비활성만 시킨다(사라지면 "신청 자체가 없는 기수"로 읽힌다).
  cta_disabled   boolean not null default false,
  show_price     boolean not null default true,
  show_capacity  boolean not null default false,
  show_schedule  boolean not null default true,
  show_cta       boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists education_club_cohorts_order_idx
  on public.education_club_cohorts (sort_order);

-- ── 03. 커뮤니티 클럽 — 참여 유형 ─────────────────────────────────────
-- 캐릭터 원본 크기는 파일마다 달라 행마다 적는다. 한 값으로 뭉뚱그리면
-- next/image가 잘못된 비율로 자리를 잡아 캐릭터 옆에 빈 여백이 생긴다.
create table if not exists public.education_club_tiers (
  id               uuid primary key default gen_random_uuid(),
  name             text not null default '',
  role             text not null default '',
  points           text[] not null default '{}',
  accent           public.brand_accent not null default 'blue',
  character_src    text not null default '',
  character_width  int not null default 0,
  character_height int not null default 0,
  is_published     boolean not null default true,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists education_club_tiers_published_order_idx
  on public.education_club_tiers (is_published, sort_order);

-- ── 지난 프로그램 ─────────────────────────────────────────────────────
create table if not exists public.education_past_programs (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title              text not null default '',
  category           public.education_category not null default 'regular',
  period             text not null default '',   -- "2026년 3월"
  audience           text not null default '',
  duration           text not null default '',
  summary            text not null default '',
  outcome            text not null default '',
  accent             public.brand_accent not null default 'blue',
  cover_image_url    text,
  cover_image_alt    text not null default '',
  cover_image_caption text not null default '',
  -- 개발·최적화 캐시 문제를 피해야 하는 목업에만 켠다(자산 교체 시 캐시 잔상 방지).
  cover_unoptimized  boolean not null default false,
  is_published       boolean not null default true,
  sort_order         int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists education_past_programs_published_order_idx
  on public.education_past_programs (is_published, sort_order);

-- 대표 이미지 뒤에 이어지는 현장·결과물 이미지. 카드 배지 숫자는 하드코딩하지
-- 않고 대표 1장 + 이 테이블의 행 수로 계산한다.
create table if not exists public.education_past_program_images (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references public.education_past_programs (id) on delete cascade,
  image_url   text not null default '',
  alt         text not null default '',
  caption     text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists education_past_program_images_program_idx
  on public.education_past_program_images (program_id, sort_order);

-- ── 후기 ──────────────────────────────────────────────────────────────
-- 실제 수강생이 남긴 글만 싣는다. 지어낸 후기를 넣지 않기 위해 행 추가는
-- 어드민에서만 하고, 평균 별점은 저장하지 않고 목록에서 계산한다.
create table if not exists public.education_reviews (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,          -- 정적 데이터의 id를 승계(시딩 멱등성)
  rating       int not null default 5 check (rating between 1 and 5),
  body         text not null default '',
  author       text not null default '',      -- 닉네임 대신 수강 레벨 표기
  program      text not null default '',
  date_label   text not null default '',      -- "2026년 7월"
  accent       public.brand_accent not null default 'blue',
  is_published boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists education_reviews_published_order_idx
  on public.education_reviews (is_published, sort_order);

-- ── FAQ ───────────────────────────────────────────────────────────────
-- ver3에서 개인/기업 카테고리 구분이 폐지돼 단일 목록이다.
create table if not exists public.education_faqs (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  question     text not null default '',
  answer       text not null default '',
  is_published boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists education_faqs_published_order_idx
  on public.education_faqs (is_published, sort_order);

-- ── 교육 성과 수치 ────────────────────────────────────────────────────
-- 홈의 `stats`와 항목이 다르다(교육은 정규 클래스 수·클럽 참가자). 한 테이블에
-- 섞으면 어드민에서 어느 페이지 수치인지 매번 헷갈리므로 분리한다.
-- 값이 "200+", "96%", "4"처럼 표기까지 포함된 문자열인 것도 홈(`value`+`suffix`)과
-- 다른 점이다 — 교육 쪽은 카운트업이 숫자 부분만 뽑아 센다.
create table if not exists public.education_stats (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  value        text not null default '',
  label        text not null default '',
  is_published boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists education_stats_published_order_idx
  on public.education_stats (is_published, sort_order);

-- ── 기존 테이블 확장 ─────────────────────────────────────────────────
-- 아래 컬럼들은 어드민 코드(src/lib/admin/content-types.ts)가 이미 기대하고
-- 있는데 DB에는 없던 것들이다. ver2 스키마 파일이 적용된 적 없어 생긴 간극이라
-- 이 마이그레이션에서 함께 메운다.

do $$ begin
  create domain public.work_layout_type as text
    check (value in ('featured', 'grid', 'horizontal'));
exception when duplicate_object then null; end $$;

alter table public.work_items
  add column if not exists show_on_home boolean not null default true,
  add column if not exists is_featured  boolean not null default false,
  add column if not exists layout_type  public.work_layout_type not null default 'grid';

alter table public.experts
  add column if not exists bio    text not null default '',
  add column if not exists career text[] not null default '{}';

alter table public.testimonials
  add column if not exists company           text not null default '',
  add column if not exists role              text not null default '',
  add column if not exists image_url         text,
  add column if not exists show_on_education boolean not null default false,
  add column if not exists program_id        uuid references public.education_regular_classes (id) on delete set null,
  add column if not exists case_id           uuid references public.education_past_programs (id) on delete set null;

create index if not exists testimonials_program_idx on public.testimonials (program_id);
create index if not exists testimonials_case_idx    on public.testimonials (case_id);

-- ── updated_at 트리거 ─────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'education_org_training', 'education_regular_classes',
    'education_club_cohorts', 'education_club_tiers',
    'education_past_programs', 'education_past_program_images',
    'education_reviews', 'education_faqs', 'education_stats'
  ]
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ── RLS ───────────────────────────────────────────────────────────────
-- is_published을 가진 테이블: 공개는 게시된 행만, 관리자는 전체 + 쓰기.
do $$
declare t text;
begin
  foreach t in array array[
    'education_regular_classes', 'education_club_tiers',
    'education_past_programs', 'education_reviews',
    'education_faqs', 'education_stats'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I_select_public on public.%I', t, t);
    execute format(
      'create policy %I_select_public on public.%I for select
         using (is_published = true or public.is_admin())', t, t);

    execute format('drop policy if exists %I_write_admin on public.%I', t, t);
    execute format(
      'create policy %I_write_admin on public.%I for all
         using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- is_published이 없는 테이블(싱글턴·기수·갤러리): 조회는 공개, 쓰기는 관리자만.
-- 기수는 목록 자체가 안내물이라 숨길 행이 없고(감출 기수는 status='ended'),
-- 갤러리는 부모 프로그램의 공개 여부를 따라간다.
do $$
declare t text;
begin
  foreach t in array array[
    'education_org_training', 'education_club_cohorts',
    'education_past_program_images'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I_select_public on public.%I', t, t);
    execute format(
      'create policy %I_select_public on public.%I for select using (true)', t, t);

    execute format('drop policy if exists %I_write_admin on public.%I', t, t);
    execute format(
      'create policy %I_write_admin on public.%I for all
         using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- ── Storage: education 버킷 ───────────────────────────────────────────
-- P2 storage 마이그레이션(20260709131208)과 동일 패턴. 기존 버킷 정책은
-- 건드리지 않고 신규 버킷만 추가한다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('education', 'education', true, 5242880, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists education_bucket_public_read on storage.objects;
create policy education_bucket_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'education');

drop policy if exists education_bucket_admin_insert on storage.objects;
create policy education_bucket_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'education' and public.is_admin());

drop policy if exists education_bucket_admin_update on storage.objects;
create policy education_bucket_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'education' and public.is_admin())
  with check (bucket_id = 'education' and public.is_admin());

drop policy if exists education_bucket_admin_delete on storage.objects;
create policy education_bucket_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'education' and public.is_admin());

-- ── 되돌리기 (down) ───────────────────────────────────────────────────
-- 이 마이그레이션은 기존 데이터를 수정하지 않고 추가만 한다. 되돌릴 때는
-- 아래를 순서대로 실행한다. 기존 테이블에 추가한 컬럼은 데이터가 들어간 뒤라면
-- 지우기 전에 내용을 확인할 것.
--
--   drop table if exists public.education_past_program_images cascade;
--   drop table if exists public.education_past_programs       cascade;
--   drop table if exists public.education_regular_classes     cascade;
--   drop table if exists public.education_club_cohorts        cascade;
--   drop table if exists public.education_club_tiers          cascade;
--   drop table if exists public.education_org_training        cascade;
--   drop table if exists public.education_reviews             cascade;
--   drop table if exists public.education_faqs                cascade;
--   drop table if exists public.education_stats               cascade;
--
--   alter table public.testimonials
--     drop column if exists company, drop column if exists role,
--     drop column if exists image_url, drop column if exists show_on_education,
--     drop column if exists program_id, drop column if exists case_id;
--   alter table public.experts
--     drop column if exists bio, drop column if exists career;
--   alter table public.work_items
--     drop column if exists show_on_home, drop column if exists is_featured,
--     drop column if exists layout_type;
--
--   drop domain if exists public.education_category;
--   drop domain if exists public.club_cohort_status;
--   drop domain if exists public.education_track;
--   drop domain if exists public.work_layout_type;
