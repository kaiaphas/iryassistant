alter table public.reservation_schedule_sources
  add column if not exists edu_guide1_name text,
  add column if not exists edu_guide2_name text,
  add column if not exists price numeric not null default 0,
  add column if not exists incen_status text;

create table if not exists public.source_schedule_reservation_customers (
  id uuid primary key,
  schedule_id uuid not null references public.reservation_schedule_sources(id) on delete cascade,
  source_schedule_key text not null,
  customer_name text not null,
  phone text,
  customer_message text,
  etc text,
  reservation_status text,
  payment_date text,
  station text,
  adult_count int not null default 0 check (adult_count >= 0),
  child_count int not null default 0 check (child_count >= 0),
  people_count int not null default 0 check (people_count >= 0),
  reservation_date text,
  sort_order int not null default 0,
  imported_at timestamptz not null default now()
);

alter table public.source_schedule_reservation_customers
  add column if not exists etc text;

create index if not exists idx_source_schedule_reservation_customers_schedule
  on public.source_schedule_reservation_customers (schedule_id, sort_order);

create index if not exists idx_source_schedule_reservation_customers_source_key
  on public.source_schedule_reservation_customers (source_schedule_key);

alter table public.source_schedule_reservation_customers enable row level security;
revoke all privileges on table public.source_schedule_reservation_customers from anon, authenticated;
