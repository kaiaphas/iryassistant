-- 예약 인원 연동 및 출발/도착 시간 text 전환

alter table public.reservation_schedules
  add column if not exists reservation_count int not null default 0 check (reservation_count >= 0);

alter table public.reservation_schedule_sources
  add column if not exists reservation_count int not null default 0 check (reservation_count >= 0);

drop view if exists public.reservation_schedule_overview;

alter table public.reservation_schedules
  alter column departure_time type text using case when departure_time is null then null else to_char(departure_time, 'HH24:MI') end,
  alter column return_time type text using case when return_time is null then null else to_char(return_time, 'HH24:MI') end;

alter table public.reservation_schedule_sources
  alter column departure_time type text using case when departure_time is null then null else to_char(departure_time, 'HH24:MI') end,
  alter column return_time type text using case when return_time is null then null else to_char(return_time, 'HH24:MI') end;

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
  coalesce(op.departure_time, src.departure_time) as departure_time,
  coalesce(op.return_time, src.return_time) as return_time,
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
