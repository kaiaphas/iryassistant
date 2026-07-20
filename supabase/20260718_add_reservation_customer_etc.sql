alter table public.source_schedule_reservation_customers
  add column if not exists etc text;
