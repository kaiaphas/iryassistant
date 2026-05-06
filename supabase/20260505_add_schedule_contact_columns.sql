alter table public.reservation_schedules
  add column if not exists guide_phone text,
  add column if not exists driver_phone text;

drop view if exists public.reservation_schedule_overview;

create view public.reservation_schedule_overview as
with restaurant_summary as (
  select
    rb.schedule_id,
    string_agg(
      concat(
        case rb.meal_type
          when 'LUNCH' then '중식'
          when 'DINNER' then '석식'
          else rb.meal_type::text
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
        else rb.booking_status::text
      end
      order by rb.sort_order, rb.created_at
    ) as restaurant_status_labels
  from public.schedule_restaurant_bookings rb
  group by rb.schedule_id
),
hotel_summary as (
  select
    hb.schedule_id,
    hb.hotel_name,
    hb.hotel_phone,
    hb.hotel_memo,
    hb.booking_status as hotel_status,
    case hb.booking_status
      when 'BEFORE' then '예약전'
      when 'COMPLETED' then '예약완료'
      when 'CANCELED' then '예약취소'
      else hb.booking_status::text
    end as hotel_status_label,
    string_agg(
      concat(
        case hra.room_type
          when 'DOUBLE' then '2인실'
          when 'TRIPLE' then '3인실'
          when 'QUAD' then '4인실'
          else hra.room_type::text
        end,
        ' x ',
        hra.room_count
      ),
      ', '
      order by hra.room_type
    ) as room_assignments
  from public.schedule_hotel_bookings hb
  left join public.schedule_hotel_room_assignments hra on hra.hotel_booking_id = hb.id
  group by hb.schedule_id, hb.hotel_name, hb.hotel_phone, hb.hotel_memo, hb.booking_status
)
select
  s.id,
  s.source_schedule_key,
  s.tour_date,
  case s.tour_type
    when 'DAY' then '당일'
    when 'STAY' then '숙박'
    else s.tour_type::text
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
  h.hotel_name,
  h.hotel_phone,
  h.hotel_memo,
  h.hotel_status,
  h.hotel_status_label,
  coalesce(h.room_assignments, '-') as room_assignments,
  s.progress_status,
  case s.progress_status
    when 'IN_PROGRESS' then '진행중'
    when 'COMPLETED' then '예약완료'
    when 'CANCELED' then '예약취소'
    else s.progress_status::text
  end as progress_status_label,
  s.memo,
  s.notice_memo,
  s.sort_order,
  s.is_active,
  s.created_at,
  s.updated_at
from public.reservation_schedules s
left join restaurant_summary r on r.schedule_id = s.id
left join hotel_summary h on h.schedule_id = s.id;
