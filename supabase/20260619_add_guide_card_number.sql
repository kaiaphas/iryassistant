alter table public.master_guides
  add column if not exists card_number text;
