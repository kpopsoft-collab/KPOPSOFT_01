create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  avatar_url text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_email_normalized_check
    check (email = lower(btrim(email)))
);
create unique index if not exists admin_users_email_uidx
  on admin_users (email);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid not null references admin_users (id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);
create index if not exists audit_logs_actor_idx
  on audit_logs (actor_admin_id);
create index if not exists audit_logs_created_at_idx
  on audit_logs (created_at desc);

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  submission_key text not null,
  type text not null,
  subtype text not null,
  sender text not null default '',
  contact text not null default '',
  message text not null,
  status text not null default 'new',
  memo text not null default '',
  email_status text not null default 'pending',
  email_message_id text,
  email_sent_at timestamptz,
  email_error text,
  linear_status text not null default 'pending',
  linear_issue_id text,
  linear_issue_url text,
  linear_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiries_status_check
    check (status in ('new', 'in_progress', 'done')),
  constraint inquiries_email_status_check
    check (email_status in ('pending', 'sent', 'failed')),
  constraint inquiries_linear_status_check
    check (linear_status in ('pending', 'created', 'failed'))
);
create unique index if not exists inquiries_submission_key_uidx
  on inquiries (submission_key);
create index if not exists inquiries_status_idx
  on inquiries (status);
create index if not exists inquiries_created_at_idx
  on inquiries (created_at desc);

create table if not exists inquiry_types (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiry_types_sort_order_check check (sort_order >= 0)
);
create unique index if not exists inquiry_types_label_uidx
  on inquiry_types (label);

create table if not exists inquiry_subtypes (
  id uuid primary key default gen_random_uuid(),
  type_id uuid not null references inquiry_types (id) on delete cascade,
  label text not null,
  placeholder text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiry_subtypes_sort_order_check check (sort_order >= 0)
);
create unique index if not exists inquiry_subtypes_type_label_uidx
  on inquiry_subtypes (type_id, label);
create index if not exists inquiry_subtypes_type_id_idx
  on inquiry_subtypes (type_id);

create table if not exists work_items (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  client text not null default '',
  title text not null default '',
  category text not null default '',
  accent text not null default 'blue',
  summary text not null default '',
  challenge text not null default '',
  solution text not null default '',
  results jsonb not null default '[]'::jsonb,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_items_sort_order_check check (sort_order >= 0),
  constraint work_items_accent_check
    check (accent in ('blue','red','yellow','coral','mint','sky','navy')),
  constraint work_items_results_array_check
    check (jsonb_typeof(results) = 'array')
);

create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  tag text not null default '',
  title text not null default '',
  date text not null default '',
  accent text not null default 'blue',
  excerpt text not null default '',
  body jsonb not null default '[]'::jsonb,
  slug text not null,
  image_url text,
  inquiry_type text,
  inquiry_subtype text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint insights_sort_order_check check (sort_order >= 0),
  constraint insights_accent_check
    check (accent in ('blue','red','yellow','coral','mint','sky','navy')),
  constraint insights_body_array_check check (jsonb_typeof(body) = 'array')
);
create unique index if not exists insights_slug_uidx on insights (slug);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  quote text not null default '',
  author text not null default '',
  program text not null default '',
  result text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonials_sort_order_check check (sort_order >= 0)
);

create table if not exists experts (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  name text not null default '',
  role text not null default '',
  quote text not null default '',
  tags jsonb not null default '[]'::jsonb,
  accent text not null default 'blue',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experts_sort_order_check check (sort_order >= 0),
  constraint experts_accent_check
    check (accent in ('blue','red','yellow','coral','mint','sky','navy')),
  constraint experts_tags_array_check check (jsonb_typeof(tags) = 'array')
);

create table if not exists stats (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  value integer not null default 0,
  suffix text not null default '',
  label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stats_sort_order_check check (sort_order >= 0),
  constraint stats_value_check check (value >= 0)
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  blob_url text not null,
  pathname text not null,
  content_type text not null,
  size_bytes integer not null,
  uploaded_by uuid not null references admin_users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint media_assets_size_check
    check (size_bytes >= 0 and size_bytes <= 10485760),
  constraint media_assets_content_type_check
    check (content_type in ('image/jpeg', 'image/png', 'image/webp'))
);
create unique index if not exists media_assets_blob_url_uidx
  on media_assets (blob_url);
create index if not exists media_assets_uploaded_by_idx
  on media_assets (uploaded_by);

drop trigger if exists admin_users_set_updated_at on admin_users;
create trigger admin_users_set_updated_at before update on admin_users
  for each row execute function set_updated_at();

drop trigger if exists inquiries_set_updated_at on inquiries;
create trigger inquiries_set_updated_at before update on inquiries
  for each row execute function set_updated_at();

drop trigger if exists inquiry_types_set_updated_at on inquiry_types;
create trigger inquiry_types_set_updated_at before update on inquiry_types
  for each row execute function set_updated_at();

drop trigger if exists inquiry_subtypes_set_updated_at on inquiry_subtypes;
create trigger inquiry_subtypes_set_updated_at before update on inquiry_subtypes
  for each row execute function set_updated_at();

drop trigger if exists work_items_set_updated_at on work_items;
create trigger work_items_set_updated_at before update on work_items
  for each row execute function set_updated_at();

drop trigger if exists insights_set_updated_at on insights;
create trigger insights_set_updated_at before update on insights
  for each row execute function set_updated_at();

drop trigger if exists testimonials_set_updated_at on testimonials;
create trigger testimonials_set_updated_at before update on testimonials
  for each row execute function set_updated_at();

drop trigger if exists experts_set_updated_at on experts;
create trigger experts_set_updated_at before update on experts
  for each row execute function set_updated_at();

drop trigger if exists stats_set_updated_at on stats;
create trigger stats_set_updated_at before update on stats
  for each row execute function set_updated_at();
