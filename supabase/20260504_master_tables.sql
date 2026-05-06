create table if not exists public.master_guides (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  assignable boolean not null default true,
  active boolean not null default true,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.master_drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity text,
  phone text,
  company text,
  assignable boolean not null default true,
  active boolean not null default true,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.master_restaurants (
  id uuid primary key default gen_random_uuid(),
  product_name text,
  region_name text,
  shop_name text not null,
  menu text,
  retail_price numeric not null default 0,
  deposit_price numeric not null default 0,
  service_type text not null default '없음' check (service_type in ('기사', '가이드', '기사+가이드', '없음')),
  phone text,
  address text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.master_hotels (
  id uuid primary key default gen_random_uuid(),
  region_name text,
  shop_name text not null,
  room_rates jsonb not null default '{}'::jsonb,
  phone text,
  address text,
  note text,
  driver_benefit text not null default '미제공' check (driver_benefit in ('제공', '부분할인', '미제공')),
  guide_benefit text not null default '미제공' check (guide_benefit in ('제공', '부분할인', '미제공')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_master_guides_updated_at on public.master_guides;
create trigger trg_master_guides_updated_at
before update on public.master_guides
for each row execute function public.set_updated_at();

drop trigger if exists trg_master_drivers_updated_at on public.master_drivers;
create trigger trg_master_drivers_updated_at
before update on public.master_drivers
for each row execute function public.set_updated_at();

drop trigger if exists trg_master_restaurants_updated_at on public.master_restaurants;
create trigger trg_master_restaurants_updated_at
before update on public.master_restaurants
for each row execute function public.set_updated_at();

drop trigger if exists trg_master_hotels_updated_at on public.master_hotels;
create trigger trg_master_hotels_updated_at
before update on public.master_hotels
for each row execute function public.set_updated_at();
