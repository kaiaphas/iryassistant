alter table public.master_guides
  alter column birth_date type text using birth_date::text;

alter table public.master_drivers
  alter column birth_date type text using birth_date::text;
