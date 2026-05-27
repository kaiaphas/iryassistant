do $$
begin
  if not exists (select 1 from pg_type where typname = 'settlement_type') then
    create type public.settlement_type as enum ('GUIDE', 'DRIVER');
  end if;

  if not exists (select 1 from pg_type where typname = 'settlement_payment_status') then
    create type public.settlement_payment_status as enum ('BEFORE', 'PAID', 'HOLD');
  end if;
end $$;

create table if not exists public.settlement_batches (
  id uuid primary key default gen_random_uuid(),
  settlement_month text not null check (settlement_month ~ '^\d{4}-\d{2}$'),
  settlement_type public.settlement_type not null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'CONFIRMED', 'PAID')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settlement_batches_month_type_unique unique (settlement_month, settlement_type)
);

create table if not exists public.settlement_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.settlement_batches(id) on delete cascade,
  settlement_month text not null check (settlement_month ~ '^\d{4}-\d{2}$'),
  settlement_type public.settlement_type not null,
  schedule_id uuid not null,
  person_id uuid not null,
  person_name text not null,
  person_phone text,
  bank_account text,
  tour_date date not null,
  tour_type_label text not null default '당일' check (tour_type_label in ('당일', '숙박')),
  product_name text not null,
  vehicle_no text,
  bus_company text,
  amount numeric not null default 0,
  withholding_rate numeric not null default 3.3,
  withholding_amount numeric generated always as (round(amount * withholding_rate / 100, 0)) stored,
  net_amount numeric generated always as (amount - round(amount * withholding_rate / 100, 0)) stored,
  payment_status public.settlement_payment_status not null default 'BEFORE',
  payment_date date,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settlement_items_schedule_person_unique unique (settlement_month, settlement_type, schedule_id, person_id)
);

create index if not exists idx_settlement_items_month_type
  on public.settlement_items (settlement_month, settlement_type);

create index if not exists idx_settlement_items_person
  on public.settlement_items (person_id);

alter table public.settlement_items
  add column if not exists tour_type_label text not null default '당일'
    check (tour_type_label in ('당일', '숙박'));

drop trigger if exists trg_settlement_batches_updated_at on public.settlement_batches;
create trigger trg_settlement_batches_updated_at
before update on public.settlement_batches
for each row execute function public.set_updated_at();

drop trigger if exists trg_settlement_items_updated_at on public.settlement_items;
create trigger trg_settlement_items_updated_at
before update on public.settlement_items
for each row execute function public.set_updated_at();

create or replace function public.get_settlement_items(
  p_settlement_month text,
  p_settlement_type public.settlement_type
)
returns table (
  id text,
  settlement_month text,
  settlement_type public.settlement_type,
  schedule_id uuid,
  person_id uuid,
  person_name text,
  person_phone text,
  bank_account text,
  tour_date date,
  tour_type_label text,
  product_name text,
  vehicle_no text,
  bus_company text,
  amount numeric,
  withholding_rate numeric,
  withholding_amount numeric,
  net_amount numeric,
  payment_status public.settlement_payment_status,
  payment_date date,
  memo text
)
language sql
security definer
set search_path = public
as $$
  with bounds as (
    select
      to_date(p_settlement_month || '-01', 'YYYY-MM-DD') as start_date,
      (to_date(p_settlement_month || '-01', 'YYYY-MM-DD') + interval '1 month - 1 day')::date as end_date
  ),
  source_rows as (
    select
      s.id as schedule_id,
      case when p_settlement_type = 'GUIDE' then s.guide_id else s.driver_id end as person_id,
      coalesce(
        si.person_name,
        case when p_settlement_type = 'GUIDE' then mg.name else md.name end,
        case when p_settlement_type = 'GUIDE' then s.guide_name else s.driver_name end,
        '이름 미정'
      ) as person_name,
      coalesce(
        si.person_phone,
        case when p_settlement_type = 'GUIDE' then mg.phone else md.phone end,
        case when p_settlement_type = 'GUIDE' then s.guide_phone else s.driver_phone end
      ) as person_phone,
      coalesce(si.bank_account, case when p_settlement_type = 'GUIDE' then mg.bank_account else md.bank_account end) as bank_account,
      s.tour_date,
      coalesce(si.tour_type_label, s.tour_type_label, '당일') as tour_type_label,
      coalesce(s.product_name, '상품명 미정') as product_name,
      s.vehicle_no,
      s.bus_company,
      si.id as item_id,
      coalesce(si.amount, 0) as amount,
      coalesce(si.withholding_rate, case when p_settlement_type = 'GUIDE' then 0 else 3.3 end) as withholding_rate,
      coalesce(si.payment_status, 'BEFORE'::public.settlement_payment_status) as payment_status,
      si.payment_date,
      si.memo
    from public.reservation_schedule_overview s
    join bounds b on s.tour_date between b.start_date and b.end_date
    left join public.master_guides mg
      on p_settlement_type = 'GUIDE'
     and mg.id = s.guide_id
    left join public.master_drivers md
      on p_settlement_type = 'DRIVER'
     and md.id = s.driver_id
    left join public.settlement_items si
      on si.settlement_month = p_settlement_month
     and si.settlement_type = p_settlement_type
     and si.schedule_id = s.id
     and si.person_id = case when p_settlement_type = 'GUIDE' then s.guide_id else s.driver_id end
    where s.is_active = true
      and case when p_settlement_type = 'GUIDE' then s.guide_id else s.driver_id end is not null
  )
  select
    coalesce(item_id::text, 'draft:' || schedule_id::text || ':' || person_id::text) as id,
    p_settlement_month as settlement_month,
    p_settlement_type as settlement_type,
    schedule_id,
    person_id,
    person_name,
    person_phone,
    bank_account,
    tour_date,
    tour_type_label,
    product_name,
    vehicle_no,
    bus_company,
    amount,
    withholding_rate,
    round(amount * withholding_rate / 100, 0) as withholding_amount,
    amount - round(amount * withholding_rate / 100, 0) as net_amount,
    payment_status,
    payment_date,
    memo
  from source_rows
  order by person_name, tour_date, product_name;
$$;

create or replace function public.save_settlement_item(p_item jsonb)
returns table (
  id text,
  settlement_month text,
  settlement_type public.settlement_type,
  schedule_id uuid,
  person_id uuid,
  person_name text,
  person_phone text,
  bank_account text,
  tour_date date,
  tour_type_label text,
  product_name text,
  vehicle_no text,
  bus_company text,
  amount numeric,
  withholding_rate numeric,
  withholding_amount numeric,
  net_amount numeric,
  payment_status public.settlement_payment_status,
  payment_date date,
  memo text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month text := p_item->>'settlementMonth';
  v_type public.settlement_type := (p_item->>'settlementType')::public.settlement_type;
  v_schedule_id uuid := (p_item->>'scheduleId')::uuid;
  v_person_id uuid := (p_item->>'personId')::uuid;
  v_batch_id uuid;
begin
  insert into public.settlement_batches (settlement_month, settlement_type)
  values (v_month, v_type)
  on conflict (settlement_month, settlement_type) do update set
    updated_at = now()
  returning settlement_batches.id into v_batch_id;

  insert into public.settlement_items (
    batch_id, settlement_month, settlement_type, schedule_id, person_id,
    person_name, person_phone, bank_account, tour_date, tour_type_label,
    product_name, vehicle_no, bus_company, amount, withholding_rate, payment_status, payment_date, memo
  )
  values (
    v_batch_id,
    v_month,
    v_type,
    v_schedule_id,
    v_person_id,
    coalesce(nullif(p_item->>'personName', ''), '이름 미정'),
    nullif(p_item->>'personPhone', ''),
    nullif(p_item->>'bankAccount', ''),
    (p_item->>'tourDate')::date,
    coalesce(nullif(p_item->>'tourType', ''), '당일'),
    coalesce(nullif(p_item->>'productName', ''), '상품명 미정'),
    nullif(p_item->>'vehicleNo', ''),
    nullif(p_item->>'busCompany', ''),
    coalesce(nullif(p_item->>'amount', '')::numeric, 0),
    coalesce(nullif(p_item->>'withholdingRate', '')::numeric, 0),
    coalesce(nullif(p_item->>'paymentStatus', '')::public.settlement_payment_status, 'BEFORE'::public.settlement_payment_status),
    nullif(p_item->>'paymentDate', '')::date,
    nullif(p_item->>'memo', '')
  )
  on conflict (settlement_month, settlement_type, schedule_id, person_id) do update set
    person_name = excluded.person_name,
    person_phone = excluded.person_phone,
    bank_account = excluded.bank_account,
    tour_date = excluded.tour_date,
    tour_type_label = excluded.tour_type_label,
    product_name = excluded.product_name,
    vehicle_no = excluded.vehicle_no,
    bus_company = excluded.bus_company,
    amount = excluded.amount,
    withholding_rate = excluded.withholding_rate,
    payment_status = excluded.payment_status,
    payment_date = excluded.payment_date,
    memo = excluded.memo
  ;

  return query
  select *
    from public.get_settlement_items(v_month, v_type) row
   where row.schedule_id = v_schedule_id
     and row.person_id = v_person_id;
end;
$$;

revoke execute on function public.get_settlement_items(text, public.settlement_type) from public, anon, authenticated;
grant execute on function public.get_settlement_items(text, public.settlement_type) to service_role;

revoke execute on function public.save_settlement_item(jsonb) from public, anon, authenticated;
grant execute on function public.save_settlement_item(jsonb) to service_role;
