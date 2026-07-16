create table if not exists billing_widget_integrations (
  id uuid primary key default gen_random_uuid(),
  public_id text not null,
  site_id uuid not null references billing_sites (id) on delete restrict,
  encrypted_secret bytea not null,
  secret_iv bytea not null,
  secret_tag bytea not null,
  allowed_origin text not null,
  key_version integer not null default 1,
  status text not null default 'ACTIVE',
  last_used_at timestamptz,
  rotated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_widget_integrations_encrypted_secret_check
    check (octet_length(encrypted_secret) = 32),
  constraint billing_widget_integrations_secret_iv_check
    check (octet_length(secret_iv) = 12),
  constraint billing_widget_integrations_secret_tag_check
    check (octet_length(secret_tag) = 16),
  constraint billing_widget_integrations_allowed_origin_check
    check (allowed_origin ~ '^https://[^/]+$'),
  constraint billing_widget_integrations_key_version_check
    check (key_version > 0),
  constraint billing_widget_integrations_status_check
    check (status in ('ACTIVE', 'DISABLED'))
);
create unique index if not exists billing_widget_integrations_public_id_uidx
  on billing_widget_integrations (public_id);
create unique index if not exists billing_widget_integrations_site_id_uidx
  on billing_widget_integrations (site_id);
create index if not exists billing_widget_integrations_active_site_idx
  on billing_widget_integrations (site_id)
  where status = 'ACTIVE';

create table if not exists billing_widget_token_uses (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references billing_widget_integrations (id) on delete restrict,
  jti_hash bytea not null,
  origin_hash bytea not null,
  expires_at timestamptz not null,
  first_used_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  use_count integer not null default 1,
  created_at timestamptz not null default now(),
  constraint billing_widget_token_uses_jti_hash_check
    check (octet_length(jti_hash) = 32),
  constraint billing_widget_token_uses_origin_hash_check
    check (octet_length(origin_hash) = 32),
  constraint billing_widget_token_uses_use_count_check
    check (use_count >= 1)
);
create unique index if not exists billing_widget_token_uses_jti_hash_uidx
  on billing_widget_token_uses (jti_hash);
create index if not exists billing_widget_token_uses_expiry_idx
  on billing_widget_token_uses (expires_at);

create table if not exists billing_widget_rate_limits (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references billing_widget_integrations (id) on delete restrict,
  scope text not null,
  key_hash bytea not null,
  bucket_start timestamptz not null,
  request_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_widget_rate_limits_bucket_uidx
    unique (integration_id, scope, key_hash, bucket_start),
  constraint billing_widget_rate_limits_scope_check
    check (scope in ('INTEGRATION', 'INTEGRATION_IP')),
  constraint billing_widget_rate_limits_key_hash_check
    check (octet_length(key_hash) = 32),
  constraint billing_widget_rate_limits_request_count_check
    check (request_count >= 1)
);
create index if not exists billing_widget_rate_limits_bucket_idx
  on billing_widget_rate_limits (bucket_start);

create table if not exists billing_handoffs (
  id uuid primary key default gen_random_uuid(),
  token_hash bytea not null,
  integration_id uuid not null references billing_widget_integrations (id) on delete restrict,
  site_id uuid not null references billing_sites (id) on delete restrict,
  customer_id uuid not null references billing_customers (id) on delete restrict,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_ip_hash bytea not null,
  created_at timestamptz not null default now(),
  constraint billing_handoffs_token_hash_check
    check (octet_length(token_hash) = 32),
  constraint billing_handoffs_created_ip_hash_check
    check (octet_length(created_ip_hash) = 32)
);
create unique index if not exists billing_handoffs_token_hash_uidx
  on billing_handoffs (token_hash);
create index if not exists billing_handoffs_expiry_idx
  on billing_handoffs (expires_at)
  where used_at is null;
create index if not exists billing_handoffs_scope_idx
  on billing_handoffs (site_id, customer_id);

create table if not exists billing_payment_sessions (
  id uuid primary key default gen_random_uuid(),
  session_hash bytea not null,
  site_id uuid not null references billing_sites (id) on delete restrict,
  customer_id uuid not null references billing_customers (id) on delete restrict,
  expires_at timestamptz not null,
  absolute_expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_payment_sessions_session_hash_check
    check (octet_length(session_hash) = 32),
  constraint billing_payment_sessions_expiry_order_check
    check (expires_at <= absolute_expires_at)
);
create unique index if not exists billing_payment_sessions_session_hash_uidx
  on billing_payment_sessions (session_hash);
create index if not exists billing_payment_sessions_active_scope_idx
  on billing_payment_sessions (site_id, customer_id, expires_at)
  where revoked_at is null;
create index if not exists billing_payment_sessions_expiry_idx
  on billing_payment_sessions (expires_at);

drop trigger if exists billing_widget_integrations_set_updated_at on billing_widget_integrations;
create trigger billing_widget_integrations_set_updated_at before update on billing_widget_integrations
  for each row execute function set_updated_at();

drop trigger if exists billing_widget_rate_limits_set_updated_at on billing_widget_rate_limits;
create trigger billing_widget_rate_limits_set_updated_at before update on billing_widget_rate_limits
  for each row execute function set_updated_at();

drop trigger if exists billing_payment_sessions_set_updated_at on billing_payment_sessions;
create trigger billing_payment_sessions_set_updated_at before update on billing_payment_sessions
  for each row execute function set_updated_at();
