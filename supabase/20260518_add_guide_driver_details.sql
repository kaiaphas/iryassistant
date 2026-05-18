alter table public.master_guides
  add column if not exists birth_date date,
  add column if not exists bank_account text,
  add column if not exists available_weekday boolean not null default true,
  add column if not exists available_weekend boolean not null default true;

alter table public.master_drivers
  add column if not exists birth_date date,
  add column if not exists bank_account text,
  add column if not exists driver_type text not null default '직영'
    check (driver_type in ('직영', '자차'));
