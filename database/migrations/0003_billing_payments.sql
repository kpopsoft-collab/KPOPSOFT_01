create table if not exists billing_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references billing_invoices (id) on delete restrict,
  order_id text not null,
  amount integer not null,
  status text not null default 'CREATED',
  idempotency_key uuid not null,
  expires_at timestamptz not null,
  payment_key text,
  failure_code text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_payment_attempts_amount_check check (amount > 0),
  constraint billing_payment_attempts_order_id_check
    check (order_id ~ '^[A-Za-z0-9_-]{6,64}$'),
  constraint billing_payment_attempts_status_check
    check (status in ('CREATED', 'AUTHENTICATED', 'CONFIRMING', 'DONE', 'FAILED', 'EXPIRED', 'CANCELED')),
  constraint billing_payment_attempts_confirmation_check
    check (
      (status = 'DONE' and payment_key is not null and confirmed_at is not null)
      or (status <> 'DONE' and confirmed_at is null)
    )
);
create unique index if not exists billing_payment_attempts_order_id_uidx
  on billing_payment_attempts (order_id);
create unique index if not exists billing_payment_attempts_idempotency_key_uidx
  on billing_payment_attempts (idempotency_key);
create unique index if not exists billing_payment_attempts_active_invoice_uidx
  on billing_payment_attempts (invoice_id)
  where status in ('CREATED', 'AUTHENTICATED', 'CONFIRMING');
create index if not exists billing_payment_attempts_invoice_idx
  on billing_payment_attempts (invoice_id, created_at);
create index if not exists billing_payment_attempts_status_expiry_idx
  on billing_payment_attempts (status, expires_at);

create table if not exists billing_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references billing_invoices (id) on delete restrict,
  attempt_id uuid references billing_payment_attempts (id) on delete restrict,
  method text not null,
  amount integer not null,
  approved_at timestamptz not null,
  toss_payment_key text,
  toss_mid text,
  approval_number text,
  masked_method jsonb not null default '{}'::jsonb,
  refunded_amount integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_payments_amount_check check (amount > 0),
  constraint billing_payments_method_check
    check (method in ('BANK_TRANSFER', 'CARD', 'EASY_PAY')),
  constraint billing_payments_refunded_amount_check
    check (refunded_amount between 0 and amount),
  constraint billing_payments_provider_fields_check
    check (
      (method = 'BANK_TRANSFER' and attempt_id is null and toss_payment_key is null and toss_mid is null)
      or (method in ('CARD', 'EASY_PAY') and attempt_id is not null and toss_payment_key is not null and toss_mid is not null)
    )
);
create unique index if not exists billing_payments_toss_payment_key_uidx
  on billing_payments (toss_payment_key)
  where toss_payment_key is not null;
create unique index if not exists billing_payments_completed_invoice_uidx
  on billing_payments (invoice_id)
  where amount > 0;
create index if not exists billing_payments_invoice_idx
  on billing_payments (invoice_id);
create index if not exists billing_payments_attempt_idx
  on billing_payments (attempt_id);

create table if not exists billing_bank_receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references billing_payments (id) on delete restrict,
  depositor_name text not null,
  amount integer not null,
  deposited_on date not null,
  confirmed_by uuid not null references admin_users (id) on delete restrict,
  evidence_note text not null,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_bank_receipts_amount_check check (amount > 0),
  constraint billing_bank_receipts_depositor_name_check
    check (char_length(btrim(depositor_name)) between 1 and 100),
  constraint billing_bank_receipts_evidence_note_check
    check (char_length(btrim(evidence_note)) between 5 and 500)
);
create unique index if not exists billing_bank_receipts_payment_id_uidx
  on billing_bank_receipts (payment_id);
create index if not exists billing_bank_receipts_deposited_on_idx
  on billing_bank_receipts (deposited_on);

create table if not exists billing_refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references billing_payments (id) on delete restrict,
  amount integer not null,
  reason text not null,
  status text not null default 'REQUESTED',
  idempotency_key uuid not null,
  requested_by uuid not null references admin_users (id) on delete restrict,
  processed_by uuid references admin_users (id) on delete restrict,
  toss_transaction_key text,
  provider_code text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_refunds_amount_check check (amount > 0),
  constraint billing_refunds_reason_check
    check (char_length(btrim(reason)) between 5 and 200),
  constraint billing_refunds_status_check
    check (status in ('REQUESTED', 'PROCESSING', 'DONE', 'FAILED')),
  constraint billing_refunds_completion_check
    check (
      (status = 'DONE' and processed_by is not null and completed_at is not null)
      or (status <> 'DONE' and completed_at is null)
    )
);
create unique index if not exists billing_refunds_idempotency_key_uidx
  on billing_refunds (idempotency_key);
create index if not exists billing_refunds_payment_idx
  on billing_refunds (payment_id, created_at);
create index if not exists billing_refunds_status_idx
  on billing_refunds (status, updated_at);

create table if not exists billing_payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references billing_payments (id) on delete restrict,
  attempt_id uuid references billing_payment_attempts (id) on delete restrict,
  refund_id uuid references billing_refunds (id) on delete restrict,
  source text not null,
  event_type text not null,
  from_status text,
  to_status text not null,
  correlation_id text not null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint billing_payment_events_source_check
    check (source in ('CUSTOMER', 'ADMIN', 'TOSS_REDIRECT', 'TOSS_WEBHOOK', 'RECONCILIATION', 'SYSTEM')),
  constraint billing_payment_events_entity_reference_check
    check (payment_id is not null or attempt_id is not null or refund_id is not null)
);
create index if not exists billing_payment_events_payment_idx
  on billing_payment_events (payment_id, occurred_at);
create index if not exists billing_payment_events_attempt_idx
  on billing_payment_events (attempt_id, occurred_at);
create index if not exists billing_payment_events_refund_idx
  on billing_payment_events (refund_id, occurred_at);
create index if not exists billing_payment_events_correlation_idx
  on billing_payment_events (correlation_id);

create table if not exists billing_webhook_receipts (
  id uuid primary key default gen_random_uuid(),
  transmission_id text not null,
  attempt_id uuid references billing_payment_attempts (id) on delete restrict,
  event_type text not null,
  payment_key text not null,
  payment_key_hash bytea not null,
  order_id text not null,
  payload_hash bytea not null,
  status text not null default 'RECEIVED',
  attempt_count integer not null default 0,
  last_error_code text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_webhook_receipts_status_check
    check (status in ('RECEIVED', 'PROCESSING', 'DONE', 'RETRY', 'REJECTED')),
  constraint billing_webhook_receipts_hashes_check
    check (octet_length(payment_key_hash) = 32 and octet_length(payload_hash) = 32),
  constraint billing_webhook_receipts_attempt_count_check
    check (attempt_count >= 0)
);
create unique index if not exists billing_webhook_receipts_transmission_id_uidx
  on billing_webhook_receipts (transmission_id);
create index if not exists billing_webhook_receipts_attempt_idx
  on billing_webhook_receipts (attempt_id);
create index if not exists billing_webhook_receipts_status_idx
  on billing_webhook_receipts (status, updated_at);

drop trigger if exists billing_payment_attempts_set_updated_at on billing_payment_attempts;
create trigger billing_payment_attempts_set_updated_at before update on billing_payment_attempts
  for each row execute function set_updated_at();

drop trigger if exists billing_payments_set_updated_at on billing_payments;
create trigger billing_payments_set_updated_at before update on billing_payments
  for each row execute function set_updated_at();

drop trigger if exists billing_bank_receipts_set_updated_at on billing_bank_receipts;
create trigger billing_bank_receipts_set_updated_at before update on billing_bank_receipts
  for each row execute function set_updated_at();

drop trigger if exists billing_refunds_set_updated_at on billing_refunds;
create trigger billing_refunds_set_updated_at before update on billing_refunds
  for each row execute function set_updated_at();

drop trigger if exists billing_webhook_receipts_set_updated_at on billing_webhook_receipts;
create trigger billing_webhook_receipts_set_updated_at before update on billing_webhook_receipts
  for each row execute function set_updated_at();
