alter table public.schedule_hotel_bookings
  add column if not exists sort_order int not null default 0;

do $$
begin
  if exists (
    select 1
      from pg_constraint
     where conname = 'schedule_hotel_bookings_one_per_schedule'
       and conrelid = 'public.schedule_hotel_bookings'::regclass
  ) then
    alter table public.schedule_hotel_bookings
      drop constraint schedule_hotel_bookings_one_per_schedule;
  end if;
end;
$$;

create index if not exists idx_schedule_hotel_bookings_schedule
  on public.schedule_hotel_bookings (schedule_id);

create index if not exists idx_schedule_hotel_bookings_sort
  on public.schedule_hotel_bookings (schedule_id, sort_order);

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
    departure_time, return_time, guide_name, guide_phone, driver_name, driver_phone,
    vehicle_no, bus_company, vehicle_capacity, progress_status, memo, is_active
  )
  values (
    v_schedule_id,
    nullif(p_schedule->>'sourceScheduleKey', ''),
    (p_schedule->>'tourDate')::date,
    case when p_schedule->>'tourType' = '숙박' then 'STAY'::public.tour_type else 'DAY'::public.tour_type end,
    nullif(p_schedule->>'productCode', ''),
    coalesce(nullif(p_schedule->>'productName', ''), '상품명 미정'),
    nullif(p_schedule->>'departureTime', ''),
    nullif(p_schedule->>'returnTime', ''),
    nullif(p_schedule#>>'{guide,name}', ''),
    nullif(p_schedule#>>'{guide,phone}', ''),
    nullif(p_schedule#>>'{driver,name}', ''),
    nullif(p_schedule#>>'{driver,phone}', ''),
    nullif(p_schedule#>>'{vehicle,busInfo}', ''),
    nullif(p_schedule#>>'{vehicle,busCompany}', ''),
    nullif(p_schedule#>>'{vehicle,busType}', ''),
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
    guide_name = excluded.guide_name,
    guide_phone = excluded.guide_phone,
    driver_name = excluded.driver_name,
    driver_phone = excluded.driver_phone,
    vehicle_no = excluded.vehicle_no,
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
