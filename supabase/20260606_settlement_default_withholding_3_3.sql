drop function if exists public.get_settlement_items(text, public.settlement_type);

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
      case when p_settlement_type = 'GUIDE' then mg.bank_account else md.bank_account end as bank_account,
      s.tour_date,
      coalesce(s.tour_type_label, '당일') as tour_type_label,
      coalesce(s.product_name, '상품명 미정') as product_name,
      s.vehicle_no,
      s.bus_company,
      si.id as item_id,
      coalesce(si.amount, 0) as amount,
      coalesce(si.withholding_rate, 3.3) as withholding_rate,
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

revoke execute on function public.get_settlement_items(text, public.settlement_type) from public, anon, authenticated;
grant execute on function public.get_settlement_items(text, public.settlement_type) to service_role;
