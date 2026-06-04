alter table public.reservation_schedule_sources
  add column if not exists not_bus_count int not null default 0 check (not_bus_count >= 0);

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
  src.not_bus_count,
  coalesce(op.vehicle_no, src.vehicle_no) as vehicle_no,
  coalesce(op.bus_company, src.bus_company) as bus_company,
  coalesce(op.vehicle_capacity, src.vehicle_capacity) as vehicle_capacity,

  coalesce(op.guide_id, src.guide_id) as guide_id,
  coalesce(nullif(op.guide_name, '-'), src.guide_name) as guide_name,
  coalesce(op.guide_phone, src.guide_phone) as guide_phone,
  coalesce(op.driver_id, src.driver_id) as driver_id,
  coalesce(nullif(op.driver_name, '-'), src.driver_name) as driver_name,
  coalesce(op.driver_phone, src.driver_phone) as driver_phone,

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
  select
    string_agg(
      concat(
        case rb.meal_type
          when 'BREAKFAST' then '조식'
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
  from (
    select id, schedule_id, meal_type, restaurant_name, booking_status, sort_order, created_at
      from public.schedule_restaurant_bookings
     where schedule_id = src.id
    union all
    select id, schedule_id, meal_type, restaurant_name, booking_status, sort_order, imported_at as created_at
      from public.source_schedule_restaurant_bookings
     where schedule_id = src.id
       and not exists (
         select 1 from public.schedule_restaurant_bookings where schedule_id = src.id
       )
  ) rb
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
      false as is_source,
      sort_order,
      created_at
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
      true as is_source,
      0 as sort_order,
      imported_at as created_at
    from public.source_schedule_hotel_bookings
    where schedule_id = src.id
      and not exists (select 1 from op_hotel)
  )
  select * from selected_hotel
  order by sort_order, created_at
  limit 1
) h on true
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
      order by hra.room_type
    ) as room_assignments,
    sum(hra.room_count) as total_room_count,
    sum(
      hra.room_count *
      case hra.room_type
        when 'DOUBLE' then 2
        when 'TRIPLE' then 3
        when 'QUAD' then 4
      end
    ) as assigned_people_count
  from (
    select room_type, room_count
      from public.schedule_hotel_room_assignments
     where hotel_booking_id = h.id
       and h.is_source = false
    union all
    select room_type, room_count
      from public.source_schedule_hotel_room_assignments
     where hotel_booking_id = h.id
       and h.is_source = true
  ) hra
) rooms on true;
