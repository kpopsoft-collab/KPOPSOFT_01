create table if not exists billing_customers (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  business_number text,
  representative_name text not null default '',
  tax_email text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_customers_code_check
    check (code = upper(btrim(code)) and code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  constraint billing_customers_business_number_check
    check (business_number is null or business_number ~ '^[0-9]{3}-[0-9]{2}-[0-9]{5}$'),
  constraint billing_customers_status_check
    check (status in ('ACTIVE', 'INACTIVE'))
);
create unique index if not exists billing_customers_code_uidx
  on billing_customers (code);
create unique index if not exists billing_customers_business_number_uidx
  on billing_customers (business_number)
  where business_number is not null;

create table if not exists billing_customer_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references billing_customers (id) on delete restrict,
  name text not null,
  email text not null,
  phone text not null default '',
  receives_billing boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_customer_contacts_email_check
    check (email = lower(btrim(email)) and char_length(email) between 3 and 254)
);
create index if not exists billing_customer_contacts_customer_idx
  on billing_customer_contacts (customer_id);

create table if not exists billing_sites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references billing_customers (id) on delete restrict,
  code text not null,
  name text not null,
  primary_origin text not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_sites_code_check
    check (code = upper(btrim(code)) and code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  constraint billing_sites_origin_check
    check (primary_origin ~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?$'),
  constraint billing_sites_status_check
    check (status in ('ACTIVE', 'INACTIVE'))
);
create unique index if not exists billing_sites_code_uidx
  on billing_sites (code);
create unique index if not exists billing_sites_origin_uidx
  on billing_sites (primary_origin);
create index if not exists billing_sites_customer_idx
  on billing_sites (customer_id);

create table if not exists billing_products (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_products_code_check
    check (code = upper(btrim(code)) and code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  constraint billing_products_status_check
    check (status in ('ACTIVE', 'INACTIVE'))
);
create unique index if not exists billing_products_code_uidx
  on billing_products (code);

create table if not exists billing_contracts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references billing_customers (id) on delete restrict,
  site_id uuid not null references billing_sites (id) on delete restrict,
  status text not null default 'DRAFT',
  cycle text not null,
  start_date date not null,
  end_date date,
  billing_anchor_day integer not null,
  next_invoice_date date,
  due_days integer not null default 0,
  auto_renew boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_contracts_status_check
    check (status in ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ENDED', 'CANCELED')),
  constraint billing_contracts_cycle_check
    check (cycle in ('MONTHLY', 'ANNUAL', 'ONE_TIME', 'MANUAL')),
  constraint billing_contracts_anchor_check
    check (billing_anchor_day between 1 and 31),
  constraint billing_contracts_due_days_check
    check (due_days between 0 and 365),
  constraint billing_contracts_date_range_check
    check (end_date is null or end_date >= start_date)
);
create index if not exists billing_contracts_customer_idx
  on billing_contracts (customer_id);
create index if not exists billing_contracts_site_idx
  on billing_contracts (site_id);
create index if not exists billing_contracts_due_idx
  on billing_contracts (next_invoice_date)
  where status = 'ACTIVE';

create table if not exists billing_contract_items (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references billing_contracts (id) on delete restrict,
  product_id uuid not null references billing_products (id) on delete restrict,
  description text not null default '',
  quantity integer not null,
  unit_supply_amount integer not null,
  supply_amount integer not null,
  vat_amount integer not null,
  total_amount integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_contract_items_quantity_check check (quantity > 0),
  constraint billing_contract_items_amount_check
    check (
      unit_supply_amount >= 0
      and supply_amount = quantity * unit_supply_amount
      and vat_amount >= 0
      and total_amount = supply_amount + vat_amount
    ),
  constraint billing_contract_items_sort_order_check check (sort_order >= 0)
);
create index if not exists billing_contract_items_contract_idx
  on billing_contract_items (contract_id);

create table if not exists billing_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  target_count integer not null default 0,
  created_count integer not null default 0,
  failed_count integer not null default 0,
  error_summary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_runs_counts_check
    check (target_count >= 0 and created_count >= 0 and failed_count >= 0),
  constraint billing_runs_error_summary_array_check
    check (jsonb_typeof(error_summary) = 'array')
);
create index if not exists billing_runs_run_date_idx
  on billing_runs (run_date);

create table if not exists billing_invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  customer_id uuid not null references billing_customers (id) on delete restrict,
  site_id uuid not null references billing_sites (id) on delete restrict,
  contract_id uuid not null references billing_contracts (id) on delete restrict,
  generation_key text not null,
  period_start date not null,
  period_end date not null,
  issue_date date not null,
  due_date date not null,
  currency text not null default 'KRW',
  supply_amount integer not null,
  vat_amount integer not null,
  total_amount integer not null,
  status text not null default 'DRAFT',
  approved_by uuid references admin_users (id) on delete restrict,
  approved_at timestamptz,
  voided_by uuid references admin_users (id) on delete restrict,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_invoices_number_check
    check (number ~ '^KPB-[0-9]{6}-[0-9A-HJKMNP-TV-Z]{10}$'),
  constraint billing_invoices_currency_check check (currency = 'KRW'),
  constraint billing_invoices_amount_check
    check (
      supply_amount >= 0
      and vat_amount >= 0
      and total_amount = supply_amount + vat_amount
    ),
  constraint billing_invoices_status_check
    check (status in ('DRAFT', 'OPEN', 'PAID', 'OVERDUE', 'PARTIALLY_REFUNDED', 'REFUNDED', 'VOID')),
  constraint billing_invoices_period_check check (period_end >= period_start),
  constraint billing_invoices_due_date_check check (due_date >= issue_date),
  constraint billing_invoices_approval_check
    check (
      (status = 'DRAFT' and approved_by is null and approved_at is null)
      or status = 'VOID'
      or (
        status in ('OPEN', 'PAID', 'OVERDUE', 'PARTIALLY_REFUNDED', 'REFUNDED')
        and approved_by is not null
        and approved_at is not null
      )
    ),
  constraint billing_invoices_void_check
    check (
      (status = 'VOID' and voided_by is not null and voided_at is not null and char_length(btrim(void_reason)) between 5 and 500)
      or (status <> 'VOID' and voided_by is null and voided_at is null and void_reason is null)
    )
);
create unique index if not exists billing_invoices_number_uidx
  on billing_invoices (number);
create unique index if not exists billing_invoices_generation_key_uidx
  on billing_invoices (generation_key);
create index if not exists billing_invoices_customer_idx
  on billing_invoices (customer_id, created_at desc);
create index if not exists billing_invoices_site_idx
  on billing_invoices (site_id, created_at desc);
create index if not exists billing_invoices_status_due_idx
  on billing_invoices (status, due_date);

create table if not exists billing_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references billing_invoices (id) on delete restrict,
  product_code text not null,
  product_name text not null,
  description text not null default '',
  quantity integer not null,
  unit_supply_amount integer not null,
  supply_amount integer not null,
  vat_amount integer not null,
  total_amount integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_invoice_items_quantity_check check (quantity > 0),
  constraint billing_invoice_items_amount_check
    check (
      unit_supply_amount >= 0
      and supply_amount = quantity * unit_supply_amount
      and vat_amount >= 0
      and total_amount = supply_amount + vat_amount
    ),
  constraint billing_invoice_items_sort_order_check check (sort_order >= 0)
);
create index if not exists billing_invoice_items_invoice_idx
  on billing_invoice_items (invoice_id);

create table if not exists billing_invoice_deliveries (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references billing_invoices (id) on delete restrict,
  recipient text not null,
  channel text not null default 'EMAIL',
  status text not null default 'PENDING',
  attempt_count integer not null default 0,
  external_id text,
  error_code text,
  sent_at timestamptz,
  next_retry_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_invoice_deliveries_recipient_check
    check (recipient = lower(btrim(recipient)) and char_length(recipient) between 3 and 254),
  constraint billing_invoice_deliveries_channel_check check (channel = 'EMAIL'),
  constraint billing_invoice_deliveries_status_check
    check (status in ('PENDING', 'SENT', 'FAILED')),
  constraint billing_invoice_deliveries_attempt_count_check check (attempt_count >= 0)
);
create index if not exists billing_invoice_deliveries_invoice_idx
  on billing_invoice_deliveries (invoice_id);
create index if not exists billing_invoice_deliveries_retry_idx
  on billing_invoice_deliveries (next_retry_at)
  where status in ('PENDING', 'FAILED');

create table if not exists billing_admin_roles (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admin_users (id) on delete restrict,
  role text not null,
  granted_by uuid not null references admin_users (id) on delete restrict,
  granted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_admin_roles_role_check
    check (role in ('BILLING_VIEW', 'BILLING_EDIT', 'BILLING_APPROVE', 'BILLING_REFUND', 'BILLING_ADMIN'))
);
create unique index if not exists billing_admin_roles_admin_role_uidx
  on billing_admin_roles (admin_id, role);
create index if not exists billing_admin_roles_admin_idx
  on billing_admin_roles (admin_id);

drop trigger if exists billing_customers_set_updated_at on billing_customers;
create trigger billing_customers_set_updated_at before update on billing_customers
  for each row execute function set_updated_at();

drop trigger if exists billing_customer_contacts_set_updated_at on billing_customer_contacts;
create trigger billing_customer_contacts_set_updated_at before update on billing_customer_contacts
  for each row execute function set_updated_at();

drop trigger if exists billing_sites_set_updated_at on billing_sites;
create trigger billing_sites_set_updated_at before update on billing_sites
  for each row execute function set_updated_at();

drop trigger if exists billing_products_set_updated_at on billing_products;
create trigger billing_products_set_updated_at before update on billing_products
  for each row execute function set_updated_at();

drop trigger if exists billing_contracts_set_updated_at on billing_contracts;
create trigger billing_contracts_set_updated_at before update on billing_contracts
  for each row execute function set_updated_at();

drop trigger if exists billing_contract_items_set_updated_at on billing_contract_items;
create trigger billing_contract_items_set_updated_at before update on billing_contract_items
  for each row execute function set_updated_at();

drop trigger if exists billing_runs_set_updated_at on billing_runs;
create trigger billing_runs_set_updated_at before update on billing_runs
  for each row execute function set_updated_at();

drop trigger if exists billing_invoices_set_updated_at on billing_invoices;
create trigger billing_invoices_set_updated_at before update on billing_invoices
  for each row execute function set_updated_at();

drop trigger if exists billing_invoice_items_set_updated_at on billing_invoice_items;
create trigger billing_invoice_items_set_updated_at before update on billing_invoice_items
  for each row execute function set_updated_at();

drop trigger if exists billing_invoice_deliveries_set_updated_at on billing_invoice_deliveries;
create trigger billing_invoice_deliveries_set_updated_at before update on billing_invoice_deliveries
  for each row execute function set_updated_at();

drop trigger if exists billing_admin_roles_set_updated_at on billing_admin_roles;
create trigger billing_admin_roles_set_updated_at before update on billing_admin_roles
  for each row execute function set_updated_at();
