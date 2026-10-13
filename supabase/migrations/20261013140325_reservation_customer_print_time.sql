create table public.reservation_schedule_prints (
  schedule_id uuid primary key references public.reservation_schedule_sources(id) on delete cascade,
  printed_at timestamptz not null
);

alter table public.reservation_schedule_prints enable row level security;
revoke all on table public.reservation_schedule_prints from public, anon, authenticated;
grant select, insert, update on table public.reservation_schedule_prints to service_role;

create or replace function public.record_reservation_customers_print(p_schedule_id uuid)
returns timestamptz
language sql
security invoker
set search_path = ''
as $$
  insert into public.reservation_schedule_prints (schedule_id, printed_at)
  select id, clock_timestamp()
  from public.reservation_schedule_sources
  where id = p_schedule_id and is_active
  on conflict (schedule_id) do update
    set printed_at = greatest(public.reservation_schedule_prints.printed_at, excluded.printed_at)
  returning printed_at;
$$;

revoke all on function public.record_reservation_customers_print(uuid) from public, anon, authenticated;
grant execute on function public.record_reservation_customers_print(uuid) to service_role;
