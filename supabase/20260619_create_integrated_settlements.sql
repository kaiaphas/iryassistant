create table if not exists public.integrated_settlement_batches (
  id uuid primary key default gen_random_uuid(),
  settlement_year integer not null check (settlement_year between 2000 and 2100),
  settlement_month integer not null check (settlement_month between 1 and 12),
  title text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'CONFIRMED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integrated_settlement_batches_year_month_unique unique (settlement_year, settlement_month)
);

create table if not exists public.integrated_settlement_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.integrated_settlement_batches(id) on delete cascade,
  schedule_id uuid not null,
  settlement_year integer not null check (settlement_year between 2000 and 2100),
  settlement_month integer not null check (settlement_month between 1 and 12),
  sort_no integer not null default 0,
  tour_date date not null,
  tour_type_label text not null default '당일' check (tour_type_label in ('당일', '숙박')),
  source_product_name text not null,
  override_product_name text,
  source_people_count integer not null default 0,
  override_people_count integer,
  not_bus_count integer not null default 0,
  vehicle_no text,
  bus_company text,
  vehicle_capacity text,
  unit_price numeric not null default 0,
  total_income numeric not null default 0,
  total_income_formula text,
  operation_cost numeric not null default 0,
  operation_cost_formula text,
  vehicle_cost numeric not null default 0,
  vehicle_cost_formula text,
  guide_cost numeric not null default 0,
  guide_cost_formula text,
  kimbap_qty integer not null default 0,
  kimbap_unit_price numeric not null default 4000,
  kimbap_cost numeric not null default 0,
  kimbap_formula text,
  fruit_qty integer not null default 0,
  fruit_unit_price numeric not null default 2900,
  fruit_cost numeric not null default 0,
  fruit_formula text,
  rice_cake_water_qty integer not null default 0,
  rice_cake_water_unit_price numeric not null default 1300,
  rice_cake_water_extra_cost numeric not null default 0,
  rice_cake_water_cost numeric not null default 0,
  rice_cake_water_formula text,
  snack_box_qty integer not null default 0,
  snack_box_unit_price numeric not null default 2000,
  snack_box_cost numeric not null default 0,
  snack_box_formula text,
  balance numeric not null default 0,
  balance_formula text,
  adjustment_amount numeric not null default 0,
  final_balance numeric not null default 0,
  memo text,
  guide_id uuid,
  guide_name text,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'CONFIRMED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integrated_settlement_rows_month_schedule_unique unique (settlement_year, settlement_month, schedule_id)
);

create table if not exists public.integrated_settlement_cost_details (
  id uuid primary key default gen_random_uuid(),
  row_id uuid not null references public.integrated_settlement_rows(id) on delete cascade,
  cost_type text not null,
  name text not null,
  qty numeric not null default 0,
  unit_price numeric not null default 0,
  amount numeric not null default 0,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integrated_formula_templates (
  id uuid primary key default gen_random_uuid(),
  target_column text not null,
  name text not null,
  formula_pattern text not null,
  default_unit_price numeric,
  description text,
  active_yn boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integrated_monthly_summaries (
  id uuid primary key default gen_random_uuid(),
  settlement_year integer not null check (settlement_year between 2000 and 2100),
  settlement_month integer not null check (settlement_month between 1 and 12),
  income_amount numeric not null default 0,
  loan_amount numeric not null default 0,
  incentive_amount numeric not null default 0,
  salary_amount numeric not null default 0,
  rent_amount numeric not null default 0,
  electricity_amount numeric not null default 0,
  telecom_amount numeric not null default 0,
  advertising_amount numeric not null default 0,
  card_amount numeric not null default 0,
  tax_amount numeric not null default 0,
  insurance_amount numeric not null default 0,
  etc_expense_amount numeric not null default 0,
  total_income numeric not null default 0,
  total_expense numeric not null default 0,
  net_profit numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integrated_monthly_summaries_year_month_unique unique (settlement_year, settlement_month)
);

create index if not exists idx_integrated_settlement_rows_year_month
  on public.integrated_settlement_rows (settlement_year, settlement_month, tour_date);

create index if not exists idx_integrated_settlement_rows_schedule
  on public.integrated_settlement_rows (schedule_id);

drop trigger if exists trg_integrated_settlement_batches_updated_at on public.integrated_settlement_batches;
create trigger trg_integrated_settlement_batches_updated_at
before update on public.integrated_settlement_batches
for each row execute function public.set_updated_at();

drop trigger if exists trg_integrated_settlement_rows_updated_at on public.integrated_settlement_rows;
create trigger trg_integrated_settlement_rows_updated_at
before update on public.integrated_settlement_rows
for each row execute function public.set_updated_at();

drop trigger if exists trg_integrated_settlement_cost_details_updated_at on public.integrated_settlement_cost_details;
create trigger trg_integrated_settlement_cost_details_updated_at
before update on public.integrated_settlement_cost_details
for each row execute function public.set_updated_at();

drop trigger if exists trg_integrated_formula_templates_updated_at on public.integrated_formula_templates;
create trigger trg_integrated_formula_templates_updated_at
before update on public.integrated_formula_templates
for each row execute function public.set_updated_at();

drop trigger if exists trg_integrated_monthly_summaries_updated_at on public.integrated_monthly_summaries;
create trigger trg_integrated_monthly_summaries_updated_at
before update on public.integrated_monthly_summaries
for each row execute function public.set_updated_at();

insert into public.integrated_formula_templates (target_column, name, formula_pattern, default_unit_price, description)
values
  ('total_income', '인원 x 단가', '=D4*E4', null, '총입금액 기본 계산식'),
  ('kimbap_cost', '김밥 기본', '=D4*4000', 4000, '김밥 기본 단가'),
  ('fruit_cost', '과일 기본', '=D4*2900', 2900, '과일 기본 단가'),
  ('rice_cake_water_cost', '떡,생수 기본', '=D4*1300', 1300, '떡,생수 기본 단가'),
  ('snack_box_cost', '간식상자 기본', '=D4*2000', 2000, '간식상자 기본 단가'),
  ('balance', '잔액 기본', '=F4-G4-H4-J4-L4-M4-N4-O4', null, '잔액 기본 계산식')
on conflict do nothing;
