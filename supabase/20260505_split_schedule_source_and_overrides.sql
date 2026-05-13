-- MySQL/CSV 원본과 화면 저장값을 분리한다.
-- 실행 전제:
-- - reservation_schedules: 앞으로 화면 저장 override 전용으로 사용
-- - reservation_schedule_sources: MySQL/CSV 동기화 원본 전용으로 사용
-- - 조회 view는 override 값이 있으면 override, 없으면 source 값을 보여준다.

create table if not exists public.reservation_schedule_sources (
  id uuid primary key,
  source_schedule_key text unique not null,

  tour_date date not null,
  tour_type public.tour_type not null default 'DAY',

  product_code text,
  product_name text not null,

  departure_time text,
  return_time text,
  reservation_count int not null default 0 check (reservation_count >= 0),

  vehicle_no text,
  bus_company text,
  vehicle_capacity text,

  guide_name text,
  driver_name text,

  progress_status public.schedule_progress_status not null default 'IN_PROGRESS',

  memo text,
  notice_memo text,
  sort_order int not null default 0,
  is_active boolean not null default true,

  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reservation_schedule_sources_tour_date
  on public.reservation_schedule_sources (tour_date);

create index if not exists idx_reservation_schedule_sources_active
  on public.reservation_schedule_sources (is_active);

create table if not exists public.source_schedule_restaurant_bookings (
  id uuid primary key,
  schedule_id uuid not null references public.reservation_schedule_sources(id) on delete cascade,
  meal_type public.meal_type not null default 'LUNCH',
  restaurant_name text not null,
  restaurant_phone text,
  restaurant_memo text,
  booking_status public.reservation_work_status not null default 'BEFORE',
  sort_order int not null default 0,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_source_schedule_restaurant_bookings_schedule
  on public.source_schedule_restaurant_bookings (schedule_id);

create table if not exists public.source_schedule_hotel_bookings (
  id uuid primary key,
  schedule_id uuid not null references public.reservation_schedule_sources(id) on delete cascade,
  hotel_name text not null,
  hotel_phone text,
  hotel_memo text,
  booking_status public.reservation_work_status not null default 'BEFORE',
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_schedule_hotel_bookings_one_per_schedule unique (schedule_id)
);

create table if not exists public.source_schedule_hotel_room_assignments (
  id uuid primary key default gen_random_uuid(),
  hotel_booking_id uuid not null references public.source_schedule_hotel_bookings(id) on delete cascade,
  room_type public.room_type not null,
  room_count int not null default 0,
  imported_at timestamptz not null default now(),
  constraint source_schedule_hotel_room_assignments_unique unique (hotel_booking_id, room_type)
);

-- 기존 데이터가 있다면 최초 1회 원본 테이블에 복사한다.
-- 이미 동기화로 덮인 값일 수 있지만, 이후부터는 source/override가 분리되어 보존된다.
insert into public.reservation_schedule_sources (
  id,
  source_schedule_key,
  tour_date,
  tour_type,
  product_code,
  product_name,
  departure_time,
  return_time,
  reservation_count,
  vehicle_no,
  bus_company,
  vehicle_capacity,
  guide_name,
  driver_name,
  progress_status,
  memo,
  notice_memo,
  sort_order,
  is_active,
  updated_at
)
select
  id,
  source_schedule_key,
  tour_date,
  tour_type,
  product_code,
  product_name,
  departure_time,
  return_time,
  0,
  vehicle_no,
  bus_company,
  vehicle_capacity,
  guide_name,
  driver_name,
  progress_status,
  memo,
  notice_memo,
  sort_order,
  is_active,
  updated_at
from public.reservation_schedules
where source_schedule_key is not null
on conflict (source_schedule_key) do nothing;

insert into public.source_schedule_restaurant_bookings (
  id,
  schedule_id,
  meal_type,
  restaurant_name,
  restaurant_phone,
  restaurant_memo,
  booking_status,
  sort_order,
  updated_at
)
select
  rb.id,
  rb.schedule_id,
  rb.meal_type,
  rb.restaurant_name,
  rb.restaurant_phone,
  rb.restaurant_memo,
  rb.booking_status,
  rb.sort_order,
  rb.updated_at
from public.schedule_restaurant_bookings rb
join public.reservation_schedule_sources s on s.id = rb.schedule_id
on conflict (id) do nothing;

insert into public.source_schedule_hotel_bookings (
  id,
  schedule_id,
  hotel_name,
  hotel_phone,
  hotel_memo,
  booking_status,
  updated_at
)
select
  hb.id,
  hb.schedule_id,
  hb.hotel_name,
  hb.hotel_phone,
  hb.hotel_memo,
  hb.booking_status,
  hb.updated_at
from public.schedule_hotel_bookings hb
join public.reservation_schedule_sources s on s.id = hb.schedule_id
on conflict (schedule_id) do nothing;

insert into public.source_schedule_hotel_room_assignments (
  hotel_booking_id,
  room_type,
  room_count
)
select
  hra.hotel_booking_id,
  hra.room_type,
  hra.room_count
from public.schedule_hotel_room_assignments hra
join public.source_schedule_hotel_bookings hb on hb.id = hra.hotel_booking_id
on conflict (hotel_booking_id, room_type) do nothing;

drop view if exists public.reservation_schedule_overview;

create view public.reservation_schedule_overview as
select
  src.id,
  src.source_schedule_key,
  coalesce(op.tour_date, src.tour_date) as tour_date,
  coalesce(op.tour_type, src.tour_type) as tour_type,
  case coalesce(op.tour_type, src.tour_type)
    when 'DAY' then '당일'
    when 'STAY' then '숙박'
  end as tour_type_label,

  coalesce(op.product_code, src.product_code) as product_code,
  coalesce(op.product_name, src.product_name) as product_name,
  coalesce(op.departure_time::text, src.departure_time) as departure_time,
  coalesce(op.return_time::text, src.return_time) as return_time,
  src.reservation_count,
  coalesce(op.vehicle_no, src.vehicle_no) as vehicle_no,
  coalesce(op.bus_company, src.bus_company) as bus_company,
  coalesce(op.vehicle_capacity, src.vehicle_capacity) as vehicle_capacity,

  op.guide_id,
  coalesce(op.guide_name, src.guide_name) as guide_name,
  op.guide_phone,
  op.driver_id,
  coalesce(op.driver_name, src.driver_name) as driver_name,
  op.driver_phone,

  coalesce(r.restaurant_names, '-') as restaurant_names,
  coalesce(r.restaurant_statuses, array[]::public.reservation_work_status[]) as restaurant_statuses,
  coalesce(r.restaurant_status_labels, array[]::text[]) as restaurant_status_labels,

  h.id as hotel_booking_id,
  h.hotel_name,
  h.hotel_phone,
  h.hotel_memo,
  h.booking_status as hotel_status,
  case h.booking_status
    when 'BEFORE' then '예약전'
    when 'COMPLETED' then '예약완료'
    when 'CANCELED' then '예약취소'
  end as hotel_status_label,

  coalesce(rooms.room_assignments, '-') as room_assignments,
  coalesce(rooms.total_room_count, 0) as total_room_count,
  coalesce(rooms.assigned_people_count, 0) as assigned_people_count,

  coalesce(op.progress_status, src.progress_status) as progress_status,
  case coalesce(op.progress_status, src.progress_status)
    when 'IN_PROGRESS' then '진행중'
    when 'COMPLETED' then '예약완료'
    when 'CANCELED' then '예약취소'
  end as progress_status_label,

  coalesce(op.memo, src.memo) as memo,
  src.notice_memo,
  src.sort_order,
  src.is_active and coalesce(op.is_active, true) as is_active,
  src.imported_at as created_at,
  greatest(src.updated_at, coalesce(op.updated_at, src.updated_at)) as updated_at
from public.reservation_schedule_sources src
left join public.reservation_schedules op
  on op.source_schedule_key = src.source_schedule_key
  or op.id = src.id
left join lateral (
  with op_rows as (
    select
      meal_type,
      restaurant_name,
      restaurant_phone,
      restaurant_memo,
      booking_status,
      sort_order,
      created_at
    from public.schedule_restaurant_bookings
    where schedule_id = src.id
  ),
  selected_rows as (
    select * from op_rows
    union all
    select
      meal_type,
      restaurant_name,
      restaurant_phone,
      restaurant_memo,
      booking_status,
      sort_order,
      imported_at as created_at
    from public.source_schedule_restaurant_bookings
    where schedule_id = src.id
      and not exists (select 1 from op_rows)
  )
  select
    string_agg(
      concat(
        case meal_type
          when 'BREAKFAST' then '조식'
          when 'LUNCH' then '중식'
          when 'DINNER' then '석식'
          else meal_type::text
        end,
        ' · ',
        restaurant_name
      ),
      ' / '
      order by sort_order, created_at
    ) as restaurant_names,
    array_agg(booking_status order by sort_order, created_at) as restaurant_statuses,
    array_agg(
      case booking_status
        when 'BEFORE' then '예약전'
        when 'COMPLETED' then '예약완료'
        when 'CANCELED' then '예약취소'
        else booking_status::text
      end
      order by sort_order, created_at
    ) as restaurant_status_labels
  from selected_rows
) r on true
left join lateral (
  with op_hotel as (
    select
      id,
      schedule_id,
      hotel_name,
      hotel_phone,
      hotel_memo,
      booking_status,
      false as is_source
    from public.schedule_hotel_bookings
    where schedule_id = src.id
  ),
  selected_hotel as (
    select * from op_hotel
    union all
    select
      id,
      schedule_id,
      hotel_name,
      hotel_phone,
      hotel_memo,
      booking_status,
      true as is_source
    from public.source_schedule_hotel_bookings
    where schedule_id = src.id
      and not exists (select 1 from op_hotel)
  )
  select * from selected_hotel
  limit 1
) h on true
left join lateral (
  select
    string_agg(
      concat(
        case room_type
          when 'DOUBLE' then '2인실'
          when 'TRIPLE' then '3인실'
          when 'QUAD' then '4인실'
          else room_type::text
        end,
        ' x ',
        room_count
      ),
      ', '
      order by room_type
    ) as room_assignments,
    sum(room_count) as total_room_count,
    sum(
      case room_type
        when 'DOUBLE' then room_count * 2
        when 'TRIPLE' then room_count * 3
        when 'QUAD' then room_count * 4
        else 0
      end
    ) as assigned_people_count
  from (
    select room_type, room_count
    from public.schedule_hotel_room_assignments
    where hotel_booking_id = h.id and h.is_source = false
    union all
    select room_type, room_count
    from public.source_schedule_hotel_room_assignments
    where hotel_booking_id = h.id and h.is_source = true
  ) room_rows
) rooms on true;
