alter table public.reservation_schedules
add column if not exists bus_company text;

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
  s.driver_id,
  s.driver_name,
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
