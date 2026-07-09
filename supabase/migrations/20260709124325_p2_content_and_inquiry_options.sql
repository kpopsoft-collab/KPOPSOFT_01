-- P2: 콘텐츠 6종 + 문의 폼 옵션 2종 + RLS
-- 근거: docs/어드민기획.md §4.2 (콘텐츠 테이블 / 문의 옵션), §5 (RLS)
-- 계약: src/lib/admin/content-types.ts, src/lib/admin/inquiry-options.ts 와 1:1.
-- 공통: set_updated_at() / is_admin() 는 P1 마이그레이션에서 이미 생성됨.

-- 브랜드 액센트 7색 (Accent 타입, content-types.ts ACCENTS).
do $$ begin
  create domain public.brand_accent as text
    check (value in ('blue','red','yellow','coral','mint','sky','navy'));
exception when duplicate_object then null; end $$;

-- 공통 트리거를 붙이는 헬퍼는 없으므로 테이블마다 명시적으로 건다.

-- ── work_items ───────────────────────────────────────────────────────
create table if not exists public.work_items (
  id           uuid primary key default gen_random_uuid(),
  sort_order   int  not null default 0,
  is_published boolean not null default true,
  client       text not null default '',
  title        text not null default '',
  category     text not null default '',
  accent       public.brand_accent not null default 'blue',
  summary      text not null default '',
  challenge    text not null default '',
  solution     text not null default '',
  results      text[] not null default '{}',
  image_url    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── insights ─────────────────────────────────────────────────────────
create table if not exists public.insights (
  id              uuid primary key default gen_random_uuid(),
  sort_order      int  not null default 0,
  is_published    boolean not null default true,
  tag             text not null default '',
  title           text not null default '',
  date            text not null default '',
  accent          public.brand_accent not null default 'blue',
  excerpt         text not null default '',
  body            text[] not null default '{}',
  slug            text not null unique,
  image_url       text,
  inquiry_type    text,
  inquiry_subtype text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── testimonials ─────────────────────────────────────────────────────
create table if not exists public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  sort_order   int  not null default 0,
  is_published boolean not null default true,
  quote        text not null default '',
  author       text not null default '',
  program      text not null default '',
  result       text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── experts ──────────────────────────────────────────────────────────
create table if not exists public.experts (
  id           uuid primary key default gen_random_uuid(),
  sort_order   int  not null default 0,
  is_published boolean not null default true,
  name         text not null default '',
  role         text not null default '',
  quote        text not null default '',
  tags         text[] not null default '{}',
  accent       public.brand_accent not null default 'blue',
  image_url    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── stats ────────────────────────────────────────────────────────────
create table if not exists public.stats (
  id           uuid primary key default gen_random_uuid(),
  sort_order   int  not null default 0,
  is_published boolean not null default true,
  value        int  not null default 0,
  suffix       text not null default '',
  label        text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── inquiry_types / inquiry_subtypes ─────────────────────────────────
create table if not exists public.inquiry_types (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  sort_order int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiry_subtypes (
  id          uuid primary key default gen_random_uuid(),
  type_id     uuid not null references public.inquiry_types (id) on delete cascade,
  label       text not null,
  placeholder text not null default '',
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists inquiry_subtypes_type_id_idx on public.inquiry_subtypes (type_id);

-- ── updated_at 트리거 (테이블별) ─────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'work_items','insights','testimonials','experts','stats',
    'inquiry_types','inquiry_subtypes'
  ]
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ── RLS (§5) ─────────────────────────────────────────────────────────
-- 콘텐츠: 공개는 is_published=true 만 SELECT, 관리자는 전체 + 쓰기.
do $$
declare t text;
begin
  foreach t in array array['work_items','insights','testimonials','experts','stats']
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

-- 문의 옵션: 공개는 is_active=true 만 SELECT, 관리자는 전체 + 쓰기.
do $$
declare t text;
begin
  foreach t in array array['inquiry_types','inquiry_subtypes']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I_select_public on public.%I', t, t);
    execute format(
      'create policy %I_select_public on public.%I for select
         using (is_active = true or public.is_admin())', t, t);

    execute format('drop policy if exists %I_write_admin on public.%I', t, t);
    execute format(
      'create policy %I_write_admin on public.%I for all
         using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;
