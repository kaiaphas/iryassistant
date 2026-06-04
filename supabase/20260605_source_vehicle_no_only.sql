update public.reservation_schedules
set
  departure_time = case when nullif(nullif(btrim(departure_time), ''), '-') is null then null else departure_time end,
  vehicle_no = null,
  bus_company = case when nullif(nullif(btrim(bus_company), ''), '-') is null then null else bus_company end,
  vehicle_capacity = case when nullif(nullif(btrim(vehicle_capacity), ''), '-') is null then null else vehicle_capacity end
where vehicle_no is not null
   or nullif(nullif(btrim(departure_time), ''), '-') is null
   or nullif(nullif(btrim(bus_company), ''), '-') is null
   or nullif(nullif(btrim(vehicle_capacity), ''), '-') is null;

create or replace view public.reservation_schedule_overview as
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
  coalesce(nullif(nullif(btrim(op.departure_time::text), ''), '-'), src.departure_time) as departure_time,
  coalesce(op.return_time::text, src.return_time) as return_time,
  src.reservation_count,
  src.not_bus_count,
  src.vehicle_no,
  coalesce(nullif(nullif(btrim(op.bus_company), ''), '-'), src.bus_company) as bus_company,
  coalesce(nullif(nullif(btrim(op.vehicle_capacity), ''), '-'), src.vehicle_capacity) as vehicle_capacity,

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

create or replace function public.save_reservation_schedule_atomic(p_schedule jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_schedule_id uuid := (p_schedule->>'id')::uuid;
  v_hotels jsonb := case
    when jsonb_typeof(p_schedule->'hotelBookings') = 'array' then p_schedule->'hotelBookings'
    when p_schedule ? 'hotelBooking' then jsonb_build_array(p_schedule->'hotelBooking')
    else '[]'::jsonb
  end;
  v_hotel jsonb;
  v_hotel_sort_order int;
  v_hotel_booking_id uuid;
  v_has_hotel_data boolean;
begin
  perform pg_advisory_xact_lock(hashtext('reservation:' || v_schedule_id::text));

  insert into public.reservation_schedules (
    id, source_schedule_key, tour_date, tour_type, product_code, product_name,
    departure_time, return_time, guide_id, guide_name, guide_phone, driver_id, driver_name, driver_phone,
    vehicle_no, bus_company, vehicle_capacity, progress_status, memo, is_active
  )
  values (
    v_schedule_id,
    nullif(p_schedule->>'sourceScheduleKey', ''),
    (p_schedule->>'tourDate')::date,
    case when p_schedule->>'tourType' = '숙박' then 'STAY'::public.tour_type else 'DAY'::public.tour_type end,
    nullif(p_schedule->>'productCode', ''),
    coalesce(nullif(p_schedule->>'productName', ''), '상품명 미정'),
    nullif(nullif(btrim(p_schedule->>'departureTime'), ''), '-'),
    nullif(p_schedule->>'returnTime', ''),
    case
      when nullif(p_schedule#>>'{guide,id}', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then nullif(p_schedule#>>'{guide,id}', '')::uuid
      else null
    end,
    nullif(nullif(p_schedule#>>'{guide,name}', ''), '-'),
    nullif(p_schedule#>>'{guide,phone}', ''),
    case
      when nullif(p_schedule#>>'{driver,id}', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then nullif(p_schedule#>>'{driver,id}', '')::uuid
      else null
    end,
    nullif(nullif(p_schedule#>>'{driver,name}', ''), '-'),
    nullif(p_schedule#>>'{driver,phone}', ''),
    null,
    nullif(nullif(btrim(p_schedule#>>'{vehicle,busCompany}'), ''), '-'),
    nullif(nullif(btrim(p_schedule#>>'{vehicle,busType}'), ''), '-'),
    case
      when p_schedule->>'progressStatus' = '취소완료' then 'CANCELED'::public.schedule_progress_status
      when p_schedule->>'progressStatus' = '예약완료' then 'COMPLETED'::public.schedule_progress_status
      else 'IN_PROGRESS'::public.schedule_progress_status
    end,
    nullif(p_schedule->>'dispatchMemo', ''),
    true
  )
  on conflict (id) do update set
    source_schedule_key = excluded.source_schedule_key,
    tour_date = excluded.tour_date,
    tour_type = excluded.tour_type,
    product_code = excluded.product_code,
    product_name = excluded.product_name,
    departure_time = excluded.departure_time,
    return_time = excluded.return_time,
    guide_id = excluded.guide_id,
    guide_name = excluded.guide_name,
    guide_phone = excluded.guide_phone,
    driver_id = excluded.driver_id,
    driver_name = excluded.driver_name,
    driver_phone = excluded.driver_phone,
    vehicle_no = null,
    bus_company = excluded.bus_company,
    vehicle_capacity = excluded.vehicle_capacity,
    progress_status = excluded.progress_status,
    memo = excluded.memo,
    is_active = true;

  delete from public.schedule_restaurant_bookings where schedule_id = v_schedule_id;

  insert into public.schedule_restaurant_bookings (
    schedule_id, meal_type, restaurant_name, restaurant_phone, restaurant_memo, booking_status, sort_order
  )
  select
    v_schedule_id,
    case booking->>'mealType'
      when '조식' then 'BREAKFAST'::public.meal_type
      when '석식' then 'DINNER'::public.meal_type
      else 'LUNCH'::public.meal_type
    end,
    booking->>'name',
    nullif(booking->>'phone', ''),
    nullif(booking->>'memo', ''),
    case booking->>'status'
      when '예약완료' then 'COMPLETED'::public.reservation_work_status
      when '예약취소' then 'CANCELED'::public.reservation_work_status
      else 'BEFORE'::public.reservation_work_status
    end,
    ordinality::int
  from jsonb_array_elements(coalesce(p_schedule->'restaurantBookings', '[]'::jsonb)) with ordinality as rows(booking, ordinality)
  where nullif(booking->>'name', '') is not null;

  delete from public.schedule_hotel_bookings where schedule_id = v_schedule_id;

  if p_schedule->>'tourType' <> '숙박' then
    return;
  end if;

  for v_hotel, v_hotel_sort_order in
    select booking, ordinality::int
      from jsonb_array_elements(v_hotels) with ordinality as rows(booking, ordinality)
     order by ordinality
  loop
    v_has_hotel_data :=
      nullif(v_hotel->>'name', '') is not null
      or nullif(v_hotel->>'phone', '') is not null
      or coalesce(v_hotel->>'provisionalStatus', '예약전') <> '예약전'
      or coalesce(v_hotel->>'status', '예약전') <> '예약전'
      or coalesce((v_hotel#>>'{provisionalRooms,double}')::int, 0) > 0
      or coalesce((v_hotel#>>'{provisionalRooms,triple}')::int, 0) > 0
      or coalesce((v_hotel#>>'{provisionalRooms,quadruple}')::int, 0) > 0
      or coalesce((v_hotel#>>'{rooms,double}')::int, 0) > 0
      or coalesce((v_hotel#>>'{rooms,triple}')::int, 0) > 0
      or coalesce((v_hotel#>>'{rooms,quadruple}')::int, 0) > 0;

    continue when not v_has_hotel_data;

    insert into public.schedule_hotel_bookings (
      schedule_id, hotel_name, hotel_phone, provisional_booking_status,
      provisional_double_room_count, provisional_triple_room_count, provisional_quad_room_count,
      booking_status, sort_order
    )
    values (
      v_schedule_id,
      coalesce(nullif(v_hotel->>'name', ''), ''),
      nullif(v_hotel->>'phone', ''),
      case v_hotel->>'provisionalStatus'
        when '예약완료' then 'COMPLETED'::public.reservation_work_status
        when '예약취소' then 'CANCELED'::public.reservation_work_status
        else 'BEFORE'::public.reservation_work_status
      end,
      coalesce((v_hotel#>>'{provisionalRooms,double}')::int, 0),
      coalesce((v_hotel#>>'{provisionalRooms,triple}')::int, 0),
      coalesce((v_hotel#>>'{provisionalRooms,quadruple}')::int, 0),
      case v_hotel->>'status'
        when '예약완료' then 'COMPLETED'::public.reservation_work_status
        when '예약취소' then 'CANCELED'::public.reservation_work_status
        else 'BEFORE'::public.reservation_work_status
      end,
      v_hotel_sort_order
    )
    returning id into v_hotel_booking_id;

    insert into public.schedule_hotel_room_assignments (hotel_booking_id, room_type, room_count)
    select v_hotel_booking_id, room_type, room_count
    from (
      values
        ('DOUBLE'::public.room_type, coalesce((v_hotel#>>'{rooms,double}')::int, 0)),
        ('TRIPLE'::public.room_type, coalesce((v_hotel#>>'{rooms,triple}')::int, 0)),
        ('QUAD'::public.room_type, coalesce((v_hotel#>>'{rooms,quadruple}')::int, 0))
    ) as rooms(room_type, room_count)
    where room_count > 0;
  end loop;
end;
$$;

revoke execute on function public.save_reservation_schedule_atomic(jsonb) from public, anon, authenticated;
grant execute on function public.save_reservation_schedule_atomic(jsonb) to service_role;
