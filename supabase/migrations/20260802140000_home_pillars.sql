-- 핵심 비즈니스(What We Do) 섹션 — 카드 3장과 사례 모달 슬라이드
-- 근거: docs/KPOPSOFT_Home_Landing_ver3.md §SECTION 03, src/lib/pillar-examples.ts
--
-- 공통: set_updated_at() / is_admin() / brand_accent 는 P1·P2에서 이미 생성됨.
-- 되돌리기(down)는 파일 하단 주석 참고.

-- 세 카드는 고정된 사업 축이라 자유 추가가 아니라 키로 고정한다. 카드가
-- 늘거나 줄면 홈 레이아웃(3열)과 헤더 앵커가 함께 바뀌어야 하므로, 추가는
-- 코드 변경을 동반하는 결정이지 콘텐츠 편집이 아니다.
do $$ begin
  create domain public.home_pillar_key as text
    check (value in ('software', 'ai', 'education'));
exception when duplicate_object then null; end $$;

create table if not exists public.home_pillars (
  id           uuid primary key default gen_random_uuid(),
  key          public.home_pillar_key not null unique,
  title        text not null default '',      -- "Software"
  description  text not null default '',
  -- 다루는 범위를 가운뎃점으로 잇는 한 줄. 칩이 아니라 텍스트로 나간다.
  tags         text[] not null default '{}',
  image_url    text,
  image_alt    text not null default '',
  accent       public.brand_accent not null default 'blue',
  is_published boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 카드를 누르면 열리는 사례 슬라이드. education 카드는 상세가 별도
-- 페이지(/education)라 슬라이드를 갖지 않는다 — 데이터로 막지 않고
-- 비워 두면 화면이 알아서 링크로 동작한다.
create table if not exists public.home_pillar_examples (
  id           uuid primary key default gen_random_uuid(),
  pillar_key   public.home_pillar_key not null,
  key          text not null unique,          -- 정적 데이터의 id 승계(시딩 멱등성)
  name         text not null default '',      -- 카드 태그 문자열과 같게 유지
  client       text not null default '',      -- 실제 사례일 때만. 비면 "예시"로 표기
  headline     text not null default '',
  description  text not null default '',
  highlights   text[] not null default '{}',
  image_url    text,
  image_alt    text not null default '',
  accent       public.brand_accent not null default 'blue',
  is_published boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists home_pillar_examples_pillar_order_idx
  on public.home_pillar_examples (pillar_key, sort_order);

do $$
declare t text;
begin
  foreach t in array array['home_pillars', 'home_pillar_examples']
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t, t);

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

-- ── 되돌리기 (down) ───────────────────────────────────────────────────
--   drop table if exists public.home_pillar_examples cascade;
--   drop table if exists public.home_pillars         cascade;
--   drop domain if exists public.home_pillar_key;
