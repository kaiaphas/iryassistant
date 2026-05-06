-- irytour.com 인천로열투어 관리자
-- Supabase schema.sql
--
-- 구성:
-- 1. MySQL View 동기화용 import/staging 테이블
-- 2. 예약현황 화면용 일정 중심 테이블
-- 3. 식당/숙소 예약현황 하위 테이블
-- 4. 화면 조회용 view
-- 5. 개발 확인용 seed data

create extension if not exists pgcrypto;

-- =========================================================
-- 1. Import / Sync tables
-- =========================================================

create table if not exists public.reservation_import_staging (
  id bigserial primary key,
  import_batch_id uuid not null,
  source_key text not null,
  reservation_no text,
  customer_name text,
  phone text,
  reserve_date date,
  reserve_time text,
  status text,
  people_count int,
  total_price numeric,
  source_updated_at timestamptz,
  raw_data jsonb,
  imported_at timestamptz not null default now()
);

create index if not exists idx_reservation_import_staging_batch
  on public.reservation_import_staging (import_batch_id);

create index if not exists idx_reservation_import_staging_source_key
  on public.reservation_import_staging (source_key);

create table if not exists public.reservations (
  source_key text primary key,
  reservation_no text,
  customer_name text,
  phone text,
  reserve_date date,
  reserve_time text,
  status text,
  people_count int,
  total_price numeric,
  source_updated_at timestamptz,
  synced_at timestamptz not null default now(),
  is_active boolean not null default true
);

create index if not exists idx_reservations_reserve_date
  on public.reservations (reserve_date);

create index if not exists idx_reservations_is_active
  on public.reservations (is_active);

create table if not exists public.import_batches (
  id uuid primary key,
  file_name text,
  status text not null check (status in ('PROCESSING', 'SUCCESS', 'FAILED', 'PARTIAL_FAILED')),
  total_count int not null default 0,
  success_count int not null default 0,
  fail_count int not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- =========================================================
-- 2. Common enum types
-- =========================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tour_type') then
    create type public.tour_type as enum ('DAY', 'STAY');
  end if;

  if not exists (select 1 from pg_type where typname = 'reservation_work_status') then
    create type public.reservation_work_status as enum ('BEFORE', 'COMPLETED', 'CANCELED');
  end if;

  if not exists (select 1 from pg_type where typname = 'schedule_progress_status') then
    create type public.schedule_progress_status as enum ('IN_PROGRESS', 'COMPLETED', 'CANCELED');
  end if;

  if not exists (select 1 from pg_type where typname = 'meal_type') then
    create type public.meal_type as enum ('LUNCH', 'DINNER');
  end if;

  if not exists (select 1 from pg_type where typname = 'room_type') then
    create type public.room_type as enum ('DOUBLE', 'TRIPLE', 'QUAD');
  end if;
end $$;

-- =========================================================
-- 3. Reservation schedule tables
-- =========================================================

create table if not exists public.reservation_schedules (
  id uuid primary key default gen_random_uuid(),
  source_schedule_key text,

  tour_date date not null,
  tour_type public.tour_type not null default 'DAY',

  product_code text,
  product_name text not null,

  departure_time time,
  return_time time,

  vehicle_no text,
  bus_company text,
  vehicle_capacity text, -- 화면 표시명: 인승. 예: 28인승, 45인승

  guide_id uuid,
  guide_name text,
  guide_phone text,

  driver_id uuid,
  driver_name text,
  driver_phone text,

  progress_status public.schedule_progress_status not null default 'IN_PROGRESS',

  memo text,
  notice_memo text,
  sort_order int not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.reservation_schedules is '예약현황의 최상위 일정. 동일 상품 + 여행일자 + 차량/호차 기준으로 묶인 운영 단위';
comment on column public.reservation_schedules.tour_type is 'DAY=당일, STAY=숙박';
comment on column public.reservation_schedules.vehicle_capacity is '차량번호 대신 화면에 표시할 인승/차량 유형';

create index if not exists idx_reservation_schedules_tour_date
  on public.reservation_schedules (tour_date);

create unique index if not exists ux_reservation_schedules_source_key
  on public.reservation_schedules (source_schedule_key)
  where source_schedule_key is not null;

create index if not exists idx_reservation_schedules_tour_type
  on public.reservation_schedules (tour_type);

create index if not exists idx_reservation_schedules_product_name
  on public.reservation_schedules using gin (to_tsvector('simple', coalesce(product_name, '')));

create index if not exists idx_reservation_schedules_progress_status
  on public.reservation_schedules (progress_status);

create index if not exists idx_reservation_schedules_active
  on public.reservation_schedules (is_active);

create table if not exists public.schedule_restaurant_bookings (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.reservation_schedules(id) on delete cascade,

  meal_type public.meal_type not null default 'LUNCH',

  restaurant_id uuid,
  restaurant_name text not null,
  restaurant_phone text,
  restaurant_memo text,

  booking_status public.reservation_work_status not null default 'BEFORE',

  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.schedule_restaurant_bookings is '일정별 식당 예약현황. 숙박 일정은 여러 식당을 등록할 수 있음';
comment on column public.schedule_restaurant_bookings.meal_type is 'LUNCH=중식, DINNER=석식';

create index if not exists idx_schedule_restaurant_bookings_schedule
  on public.schedule_restaurant_bookings (schedule_id);

create index if not exists idx_schedule_restaurant_bookings_status
  on public.schedule_restaurant_bookings (booking_status);

create index if not exists idx_schedule_restaurant_bookings_meal_type
  on public.schedule_restaurant_bookings (meal_type);

create index if not exists idx_schedule_restaurant_bookings_name
  on public.schedule_restaurant_bookings using gin (to_tsvector('simple', coalesce(restaurant_name, '')));

create table if not exists public.schedule_hotel_bookings (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.reservation_schedules(id) on delete cascade,

  hotel_id uuid,
  hotel_name text not null,
  hotel_phone text,
  hotel_memo text,

  booking_status public.reservation_work_status not null default 'BEFORE',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint schedule_hotel_bookings_one_per_schedule unique (schedule_id)
);

comment on table public.schedule_hotel_bookings is '일정별 숙소 예약현황. 숙박 일정에서만 사용';

create index if not exists idx_schedule_hotel_bookings_status
  on public.schedule_hotel_bookings (booking_status);

create index if not exists idx_schedule_hotel_bookings_name
  on public.schedule_hotel_bookings using gin (to_tsvector('simple', coalesce(hotel_name, '')));

create table if not exists public.schedule_hotel_room_assignments (
  id uuid primary key default gen_random_uuid(),
  hotel_booking_id uuid not null references public.schedule_hotel_bookings(id) on delete cascade,

  room_type public.room_type not null,
  room_count int not null default 0 check (room_count >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint schedule_hotel_room_assignments_unique_room unique (hotel_booking_id, room_type)
);

comment on table public.schedule_hotel_room_assignments is '숙소 객실 배정. 2인실/3인실/4인실 수량 관리';

-- =========================================================
-- 4. Utility trigger
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reservation_schedules_updated_at on public.reservation_schedules;
create trigger trg_reservation_schedules_updated_at
before update on public.reservation_schedules
for each row execute function public.set_updated_at();

drop trigger if exists trg_schedule_restaurant_bookings_updated_at on public.schedule_restaurant_bookings;
create trigger trg_schedule_restaurant_bookings_updated_at
before update on public.schedule_restaurant_bookings
for each row execute function public.set_updated_at();

drop trigger if exists trg_schedule_hotel_bookings_updated_at on public.schedule_hotel_bookings;
create trigger trg_schedule_hotel_bookings_updated_at
before update on public.schedule_hotel_bookings
for each row execute function public.set_updated_at();

drop trigger if exists trg_schedule_hotel_room_assignments_updated_at on public.schedule_hotel_room_assignments;
create trigger trg_schedule_hotel_room_assignments_updated_at
before update on public.schedule_hotel_room_assignments
for each row execute function public.set_updated_at();

-- =========================================================
-- 5. View for reservation screen
-- =========================================================

drop view if exists public.reservation_schedule_overview;

create view public.reservation_schedule_overview as
select
  s.id,
  s.source_schedule_key,
  s.tour_date,
  s.tour_type,
  case s.tour_type
    when 'DAY' then '당일'
    when 'STAY' then '숙박'
  end as tour_type_label,

  s.product_code,
  s.product_name,
  to_char(s.departure_time, 'HH24:MI') as departure_time,
  to_char(s.return_time, 'HH24:MI') as return_time,
  s.vehicle_no,
  s.bus_company,
  s.vehicle_capacity,

  s.guide_id,
  s.guide_name,
  s.guide_phone,
  s.driver_id,
  s.driver_name,
  s.driver_phone,

  coalesce(r.restaurant_names, '-') as restaurant_names,
  coalesce(r.restaurant_statuses, array[]::public.reservation_work_status[]) as restaurant_statuses,
  coalesce(r.restaurant_status_labels, array[]::text[]) as restaurant_status_labels,

  h.id as hotel_booking_id,
  h.hotel_name,
  h.booking_status as hotel_status,
  case h.booking_status
    when 'BEFORE' then '예약전'
    when 'COMPLETED' then '예약완료'
    when 'CANCELED' then '예약취소'
  end as hotel_status_label,

  coalesce(rooms.room_assignments, '-') as room_assignments,
  coalesce(rooms.total_room_count, 0) as total_room_count,
  coalesce(rooms.assigned_people_count, 0) as assigned_people_count,

  s.progress_status,
  case s.progress_status
    when 'IN_PROGRESS' then '진행중'
    when 'COMPLETED' then '예약완료'
    when 'CANCELED' then '예약취소'
  end as progress_status_label,

  s.memo,
  s.notice_memo,
  s.sort_order,
  s.is_active,
  s.created_at,
  s.updated_at
from public.reservation_schedules s
left join lateral (
  select
    string_agg(
      concat(
        case rb.meal_type
          when 'LUNCH' then '중식'
          when 'DINNER' then '석식'
        end,
        ' · ',
        rb.restaurant_name
      ),
      ' / '
      order by rb.sort_order, rb.created_at
    ) as restaurant_names,
    array_agg(rb.booking_status order by rb.sort_order, rb.created_at) as restaurant_statuses,
    array_agg(
      case rb.booking_status
        when 'BEFORE' then '예약전'
        when 'COMPLETED' then '예약완료'
        when 'CANCELED' then '예약취소'
      end
      order by rb.sort_order, rb.created_at
    ) as restaurant_status_labels
  from public.schedule_restaurant_bookings rb
  where rb.schedule_id = s.id
) r on true
left join public.schedule_hotel_bookings h
  on h.schedule_id = s.id
left join lateral (
  select
    string_agg(
      concat(
        case hra.room_type
          when 'DOUBLE' then '2인실'
          when 'TRIPLE' then '3인실'
          when 'QUAD' then '4인실'
        end,
        ' x ',
        hra.room_count
      ),
      ', '
      order by
        case hra.room_type
          when 'DOUBLE' then 1
          when 'TRIPLE' then 2
          when 'QUAD' then 3
        end
    ) as room_assignments,
    sum(hra.room_count) as total_room_count,
    sum(
      case hra.room_type
        when 'DOUBLE' then 2
        when 'TRIPLE' then 3
        when 'QUAD' then 4
      end * hra.room_count
    ) as assigned_people_count
  from public.schedule_hotel_room_assignments hra
  where hra.hotel_booking_id = h.id
) rooms on true;

-- =========================================================
-- 6. Example query for the reservation screen
-- =========================================================

-- select *
-- from public.reservation_schedule_overview
-- where is_active = true
--   and tour_date between '2025-05-01' and '2025-05-31'
--   and ('IN_PROGRESS'::public.schedule_progress_status is null or progress_status = 'IN_PROGRESS')
--   and ('COMPLETED'::public.reservation_work_status is null or 'COMPLETED' = any(restaurant_statuses))
-- order by tour_date asc, departure_time asc, sort_order asc;
