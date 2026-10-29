-- Apply to the intended project after review. The service role is used only by authenticated server routes.
create table public.product_estimates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 1 and 100),
  name text not null check (char_length(name) between 1 and 300),
  incentive_condition text not null default '' check (char_length(incentive_condition) <= 2000),
  headcount integer check (headcount between 1 and 100000),
  price numeric check (price between 0 and 1000000000),
  vehicle_cost numeric check (vehicle_cost between 0 and 1000000000),
  guide_cost numeric check (guide_cost between 0 and 1000000000),
  snack_cost numeric check (snack_cost between 0 and 1000000000),
  admission_cost numeric check (admission_cost between 0 and 1000000000),
  meal_cost numeric check (meal_cost between 0 and 1000000000),
  tax_rate numeric check (tax_rate between 0 and 1),
  incentive numeric check (incentive between 0 and 1000000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.product_estimates enable row level security;
revoke all on public.product_estimates from anon, authenticated;
grant select, insert, update, delete on public.product_estimates to service_role;

insert into public.product_estimates (code, name, headcount, price, vehicle_cost, guide_cost, snack_cost, admission_cost, meal_cost, tax_rate, incentive, incentive_condition)
values ('26_WD20', '완주_모악산+전북도립미술관+오성한옥마을+오스갤러리 (음료 별도)', 20, 98000, 900000, 8500, 12000, 0, 15000, 0.1, 450000, '완주 당일 / 버스 1대 45만원 / 20명 이상 / 관광지 2곳 + 식당 1곳 + 카페 또는 로컬푸드판매장')
on conflict (code) do nothing;
