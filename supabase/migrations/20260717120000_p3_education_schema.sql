-- P3: Education 페이지 스키마 — 프로그램/결과물/사례/FAQ/VIBEDAYS + 이미지 메타 + 페이지 설정
-- 근거: docs/KPOPSOFT_Education_Page_ver2.md §27(Admin 구성), §28(데이터 재사용), §24(이미지 공개/Blur)
--       docs/KPOPSOFT_Home_Landing_ver2.md §7(Admin 연동 원칙 — work 노출 플래그)
-- 공통: set_updated_at() / is_admin() 는 P1 마이그레이션(20260709121130)에서 이미 생성됨.
-- 적용 순서: P1 → P2(content) → P2(storage) → 본 파일.

-- ── 도메인 타입 ──────────────────────────────────────────────────────
-- 모집 상태 (§27.2): 모집 예정 | 모집 중 | 마감 | 상시 문의 | 비공개
do $$ begin
  create domain public.education_recruit_status as text
    check (value in ('scheduled', 'open', 'closed', 'always', 'hidden'));
exception when duplicate_object then null; end $$;

-- 교육 방식: 오프라인 | 온라인 | 온·오프라인 혼합 | 협의 필요 (§20 문의 폼 옵션과 동일 어휘 재사용)
do $$ begin
  create domain public.education_format as text
    check (value in ('offline', 'online', 'hybrid', 'flexible'));
exception when duplicate_object then null; end $$;

-- FAQ 카테고리 (§27.8): 개인 프로그램 | 기업 교육 | 준비 사항 | 신청 및 운영
do $$ begin
  create domain public.education_faq_category as text
    check (value in ('personal', 'company', 'preparation', 'operations'));
exception when duplicate_object then null; end $$;

-- 이미지 소유자 종류 — 아래 §24 이미지 메타 설계 참고.
do $$ begin
  create domain public.education_image_owner as text
    check (value in ('program', 'output', 'case'));
exception when duplicate_object then null; end $$;

-- ── education_programs — 프로그램 관리 (§27.2) ─────────────────────────
create table if not exists public.education_programs (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique,
  name                   text not null default '',
  vibe_label             text not null default '',      -- 감성 라벨 (예: START DAY)
  category               text not null default '',
  summary                text not null default '',       -- 한 줄 설명
  description            text not null default '',       -- 상세 설명
  target_audience        text not null default '',       -- 추천 대상
  difficulty             text not null default '',       -- 난이도 (자유 텍스트: "입문 · 실무" 등)
  duration               text not null default '',       -- 교육 시간
  format                 public.education_format,        -- 교육 방식
  location               text not null default '',       -- 교육 장소
  price                  text not null default '',       -- 가격 (자유 텍스트: "협의" 포함)
  recruit_status         public.education_recruit_status not null default 'hidden',
  recruit_start_date     date,
  recruit_end_date       date,
  cover_image_url        text,                            -- 대표 이미지
  hero_image_url         text,                            -- 상세 Hero 이미지
  is_published           boolean not null default true,
  is_featured            boolean not null default false,  -- 대표 프로그램 여부
  display_order          int  not null default 0,
  has_detail_page        boolean not null default false,  -- 상세 페이지 사용 여부
  seo_title              text,                             -- 2차: 상세 페이지 SEO (§4 확장 대비)
  seo_description        text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists education_programs_published_order_idx
  on public.education_programs (is_published, display_order);

-- ── education_program_instructors — Program ↔ Instructor 관계형 연결 (§28) ─
create table if not exists public.education_program_instructors (
  program_id uuid not null references public.education_programs (id) on delete cascade,
  expert_id  uuid not null references public.experts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (program_id, expert_id)
);

create index if not exists education_program_instructors_expert_idx
  on public.education_program_instructors (expert_id);

-- ── education_outputs — 교육 결과물 관리 (§27.3) ────────────────────────
create table if not exists public.education_outputs (
  id             uuid primary key default gen_random_uuid(),
  title          text not null default '',
  program_id     uuid references public.education_programs (id) on delete set null,
  category       text not null default '',    -- 예: "AI Workflow", "Vibe Coding"
  description    text not null default '',
  cover_image_url text,
  is_published   boolean not null default true,
  display_order  int  not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists education_outputs_published_order_idx
  on public.education_outputs (is_published, display_order);
create index if not exists education_outputs_program_idx
  on public.education_outputs (program_id);

-- ── education_cases — 교육 사례 관리 (§27.4) ────────────────────────────
create table if not exists public.education_cases (
  id                uuid primary key default gen_random_uuid(),
  title             text not null default '',   -- 사례명
  industry          text not null default '',   -- 산업군
  company_name      text not null default '',   -- 기업명 또는 익명명
  target_audience   text not null default '',   -- 교육 대상
  participant_count text not null default '',   -- 참여 인원 (예: "30명")
  duration          text not null default '',   -- 진행 기간 / 형태 (예: "6시간 실습형 워크숍")
  format            public.education_format,
  goal              text not null default '',   -- 교육 목표
  main_task         text not null default '',   -- 주요 과제
  outputs           text not null default '',   -- 결과물
  outcome           text not null default '',   -- 성과
  cover_image_url   text,                        -- 대표 이미지
  is_published      boolean not null default true,
  display_order     int  not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists education_cases_published_order_idx
  on public.education_cases (is_published, display_order);

-- ── education_faqs — FAQ 관리 (§27.8) ───────────────────────────────────
create table if not exists public.education_faqs (
  id            uuid primary key default gen_random_uuid(),
  category      public.education_faq_category not null default 'personal',
  question      text not null default '',
  answer        text not null default '',
  is_published  boolean not null default true,
  display_order int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists education_faqs_published_order_idx
  on public.education_faqs (is_published, display_order);

-- ── vibedays_roles — VIBEDAYS CLUB 캐릭터 역할 (§27.7) ──────────────────
create table if not exists public.vibedays_roles (
  id                   uuid primary key default gen_random_uuid(),
  role_name            text not null default '',  -- 예: NEW VIBER
  tagline              text not null default '',  -- 예: "새로운 도구를 발견하는 사람"
  description          text not null default '',
  character_image_url  text,
  is_published         boolean not null default true,
  display_order        int  not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists vibedays_roles_published_order_idx
  on public.vibedays_roles (is_published, display_order);

-- ── education_images — 이미지별 공개/Blur/대표/순서/alt/caption 메타 (§24) ──
--
-- 설계 선택: 프로그램·결과물·사례가 각각 여러 "역할"의 갤러리(프로그램의 결과물/
-- 현장 이미지, 사례의 현장/결과물/상세 갤러리, 결과물의 갤러리)를 가지고, 모든
-- 갤러리가 §24와 동일한 이미지 메타(isPublic/isBlurred/isFeatured/displayOrder/
-- altText/caption)를 요구한다. 테이블별로 갤러리 테이블을 3~4개씩 복제하면 Admin
-- 화면·RLS 정책·리포지토리 코드가 거의 동일한 형태로 여러 벌 생기므로, 단일
-- 다형(polymorphic) 테이블 `education_images` (owner_type/owner_id/role) +
-- 공용 Admin 갤러리 컴포넌트로 통합했다. §28의 "동일 콘텐츠를 중복 등록하지
-- 않는다"는 원칙을 이미지 메타 계층에도 그대로 적용한 것.
--
-- 트레이드오프: owner_id는 3개 테이블 중 하나를 가리키므로 진짜 FK를 걸 수
-- 없다(Postgres는 다형 FK를 지원하지 않음). 참조 무결성은 각 부모 테이블의
-- AFTER DELETE 트리거(아래 education_images_cleanup)로 보정한다 — 부모 행이
-- 삭제되면 연결된 이미지 메타 행도 함께 삭제된다.
--
-- role: 대표 이미지(cover_image_url)는 각 부모 테이블의 단일 컬럼으로 이미
-- 존재하므로 이 테이블에는 담지 않는다. 갤러리 전용:
--   program → 'output' | 'site'
--   case    → 'site' | 'result' | 'detail'
--   output  → 'gallery'
create table if not exists public.education_images (
  id            uuid primary key default gen_random_uuid(),
  owner_type    public.education_image_owner not null,
  owner_id      uuid not null,
  role          text not null default 'gallery',
  image_url     text not null,
  alt_text      text not null default '',
  caption       text,
  is_public     boolean not null default true,
  is_blurred    boolean not null default false,
  is_featured   boolean not null default false,
  display_order int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists education_images_owner_idx
  on public.education_images (owner_type, owner_id, role, display_order);

-- 부모 삭제 시 소속 이미지 메타를 정리(다형 참조라 실제 FK cascade가 불가하므로 트리거로 보정).
create or replace function public.education_images_cleanup()
returns trigger
language plpgsql
as $$
begin
  delete from public.education_images
   where owner_type = tg_argv[0]::public.education_image_owner
     and owner_id = old.id;
  return old;
end;
$$;

drop trigger if exists education_programs_images_cleanup on public.education_programs;
create trigger education_programs_images_cleanup
  after delete on public.education_programs
  for each row execute function public.education_images_cleanup('program');

drop trigger if exists education_outputs_images_cleanup on public.education_outputs;
create trigger education_outputs_images_cleanup
  after delete on public.education_outputs
  for each row execute function public.education_images_cleanup('output');

drop trigger if exists education_cases_images_cleanup on public.education_cases;
create trigger education_cases_images_cleanup
  after delete on public.education_cases
  for each row execute function public.education_images_cleanup('case');

-- ── education_page_settings — Education Hero/CTA/섹션 노출 (§27.1) ─────
-- 싱글턴 테이블: id는 boolean이며 값은 항상 true여야 하므로(PK + check) 행이
-- 최대 1개만 존재할 수 있다. sections는 {sectionKey: {isPublished, order}} 형태의
-- JSONB로, §5(16개 섹션) 중 Admin이 노출 제어해야 하는 섹션들을 유연하게 담는다.
create table if not exists public.education_page_settings (
  id                        boolean primary key default true check (id),
  hero_eyebrow              text not null default 'KPOPSOFT EDUCATION',
  hero_title                text not null default '',
  hero_description          text not null default '',
  hero_image_url            text,
  hero_cta_primary_label    text not null default '',
  hero_cta_primary_href     text not null default '',
  hero_cta_secondary_label  text not null default '',
  hero_cta_secondary_href   text not null default '',
  vibedays_title            text not null default '',
  vibedays_description      text not null default '',
  sections                  jsonb not null default '{}'::jsonb,
  updated_at                timestamptz not null default now()
);

insert into public.education_page_settings (id)
values (true)
on conflict (id) do nothing;

-- ── updated_at 트리거 (신규 테이블) ─────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'education_programs', 'education_outputs', 'education_cases',
    'education_faqs', 'vibedays_roles', 'education_images',
    'education_page_settings'
  ]
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ── 기존 테이블 확장 ─────────────────────────────────────────────────

-- work — Home ver2 §7: showOnHome / isFeatured / layoutType (displayOrder는 기존 sort_order 재사용).
do $$ begin
  create domain public.work_layout_type as text
    check (value in ('featured', 'grid', 'horizontal'));
exception when duplicate_object then null; end $$;

alter table public.work_items
  add column if not exists show_on_home boolean not null default true,
  add column if not exists is_featured  boolean not null default false,
  add column if not exists layout_type  public.work_layout_type not null default 'grid';

-- experts — Education §27.5: 대표 문구(quote, 기존)와 별도로 한 줄 소개 + 주요 경력.
-- 전문 분야는 기존 tags 컬럼을 재사용(§28 — 중복 컬럼 생성 금지). 담당 프로그램은
-- education_program_instructors 관계형 테이블로 연결.
alter table public.experts
  add column if not exists bio    text not null default '',
  add column if not exists career text[] not null default '{}';

-- testimonials — Education §27.6, §28: showOnEducation + 관련 프로그램/사례 연결
-- + 후기에 필요한 회사/역할/이미지. 기존 quote/author/program(텍스트)/result는 유지.
alter table public.testimonials
  add column if not exists company            text not null default '',
  add column if not exists role                text not null default '',
  add column if not exists image_url           text,
  add column if not exists show_on_education   boolean not null default false,
  add column if not exists program_id          uuid references public.education_programs (id) on delete set null,
  add column if not exists case_id             uuid references public.education_cases (id) on delete set null;

create index if not exists testimonials_program_idx on public.testimonials (program_id);
create index if not exists testimonials_case_idx    on public.testimonials (case_id);

-- ── RLS — 신규 콘텐츠 테이블: 공개는 is_published=true 만 SELECT, 관리자는 전체 + 쓰기 ──
do $$
declare t text;
begin
  foreach t in array array[
    'education_programs', 'education_outputs', 'education_cases',
    'education_faqs', 'vibedays_roles'
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

-- education_program_instructors: 링크 자체는 민감 정보가 아니므로 공개 조회 허용, 쓰기는 관리자만.
alter table public.education_program_instructors enable row level security;

drop policy if exists education_program_instructors_select_public on public.education_program_instructors;
create policy education_program_instructors_select_public on public.education_program_instructors
  for select using (true);

drop policy if exists education_program_instructors_write_admin on public.education_program_instructors;
create policy education_program_instructors_write_admin on public.education_program_instructors
  for all using (public.is_admin()) with check (public.is_admin());

-- education_images: 공개는 is_public=true 만 SELECT(§24 이미지별 공개 설정), 관리자는 전체 + 쓰기.
alter table public.education_images enable row level security;

drop policy if exists education_images_select_public on public.education_images;
create policy education_images_select_public on public.education_images
  for select using (is_public = true or public.is_admin());

drop policy if exists education_images_write_admin on public.education_images;
create policy education_images_write_admin on public.education_images
  for all using (public.is_admin()) with check (public.is_admin());

-- education_page_settings: 싱글턴 설정 행은 항상 공개 조회, 쓰기는 관리자만.
alter table public.education_page_settings enable row level security;

drop policy if exists education_page_settings_select_public on public.education_page_settings;
create policy education_page_settings_select_public on public.education_page_settings
  for select using (true);

drop policy if exists education_page_settings_write_admin on public.education_page_settings;
create policy education_page_settings_write_admin on public.education_page_settings
  for update using (public.is_admin()) with check (public.is_admin());
-- 싱글턴 행은 마이그레이션에서 이미 insert 했으므로 insert/delete 정책은 열지 않는다
-- (행 삭제·추가는 서비스 롤 콘솔 경유 — 일반 관리자 세션에는 불필요).

-- ── Storage: education 버킷 (프로그램/결과물/사례/VIBEDAYS 이미지) ──────
-- 근거: P2 storage 마이그레이션(20260709131208)과 동일 패턴. experts/work/insights
-- 버킷 정책은 건드리지 않고 신규 버킷을 별도로 추가한다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('education', 'education', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists education_images_public_read on storage.objects;
create policy education_images_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'education');

drop policy if exists education_images_admin_insert on storage.objects;
create policy education_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'education' and public.is_admin());

drop policy if exists education_images_admin_update on storage.objects;
create policy education_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'education' and public.is_admin())
  with check (bucket_id = 'education' and public.is_admin());

drop policy if exists education_images_admin_delete on storage.objects;
create policy education_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'education' and public.is_admin());
