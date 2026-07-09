-- P1: 문의(inquiries) + 관리자 인증(admin_users, is_admin) + RLS
-- 근거: docs/어드민기획.md §4.1 (inquiries), §4.3 (인증/권한), §5 (RLS)
-- 계약: src/lib/admin/types.ts 의 Inquiry / InquiryStatus 와 1:1 대응.

-- ── 공통: updated_at 자동 갱신 트리거 함수 ──────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 관리자 화이트리스트 + is_admin() ──────────────────────────────────
-- auth.users 에는 관리자만 존재(§4.3). admin_users 에 등록된 uid 만 관리자.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email   text not null,
  created_at timestamptz not null default now()
);

-- 현재 요청자가 관리자인지. RLS 정책의 단일 게이트(§4.3).
-- security definer 로 admin_users 를 RLS 우회 조회(정책 재귀 방지).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = auth.uid()
  );
$$;

-- ── inquiries — 문의(§4.1) ───────────────────────────────────────────
create table if not exists public.inquiries (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,   -- 유형 label 스냅샷 (예: 프로젝트 문의)
  subtype    text not null,   -- 세부 유형 label 스냅샷 (예: 웹 프로젝트)
  sender     text not null default '',
  contact    text not null default '',
  message    text not null,
  status     text not null default 'new'
             check (status in ('new', 'in_progress', 'done')),
  memo       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inquiries_status_idx     on public.inquiries (status);
create index if not exists inquiries_created_at_idx  on public.inquiries (created_at desc);

drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at
  before update on public.inquiries
  for each row execute function public.set_updated_at();

-- ── RLS (§5) — 항상 ON, anon 키 노출 전제 ────────────────────────────
alter table public.inquiries  enable row level security;
alter table public.admin_users enable row level security;

-- inquiries: 공개 폼이 INSERT, 조회/수정/삭제는 관리자만.
-- (실제 INSERT 는 Server Action 이 anon 클라이언트로 수행 — 컬럼 화이트리스트/검증은 앱단.)
drop policy if exists inquiries_insert_anon  on public.inquiries;
create policy inquiries_insert_anon  on public.inquiries
  for insert to anon, authenticated
  with check (true);

drop policy if exists inquiries_select_admin on public.inquiries;
create policy inquiries_select_admin on public.inquiries
  for select using (public.is_admin());

drop policy if exists inquiries_update_admin on public.inquiries;
create policy inquiries_update_admin on public.inquiries
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists inquiries_delete_admin on public.inquiries;
create policy inquiries_delete_admin on public.inquiries
  for delete using (public.is_admin());

-- admin_users: 관리자 본인/관리자만 조회. 쓰기는 콘솔/부트스트랩(service_role) 경유.
drop policy if exists admin_users_select_admin on public.admin_users;
create policy admin_users_select_admin on public.admin_users
  for select using (public.is_admin());
