create or replace function public.save_refund_atomic(p_refund jsonb)
returns public.refunds
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_existing public.refunds%rowtype;
  v_refund_date date := (p_refund->>'refund_date')::date;
  v_next_no integer;
  v_saved public.refunds%rowtype;
begin
  v_id := nullif(p_refund->>'id', '')::uuid;
  perform pg_advisory_xact_lock(hashtext('refunds:' || v_refund_date::text));

  if v_id is not null then
    select * into v_existing from public.refunds where id = v_id for update;
  end if;

  if v_existing.id is null or v_existing.refund_date <> v_refund_date then
    select coalesce(max(no), 0) + 1
      into v_next_no
      from public.refunds
     where refund_date = v_refund_date;
  else
    v_next_no := v_existing.no;
  end if;

  if v_existing.id is null then
    insert into public.refunds (
      refund_date, no, customer_name, departure_date, people_count, phone, payment_method,
      deposit_date, product_amount, deposit_amount, refund_request_amount, depositor,
      balance_amount, registered_by, status, bank_account, memo
    )
    values (
      v_refund_date,
      v_next_no,
      p_refund->>'customer_name',
      nullif(p_refund->>'departure_date', '')::date,
      coalesce((p_refund->>'people_count')::int, 0),
      nullif(p_refund->>'phone', ''),
      p_refund->>'payment_method',
      nullif(p_refund->>'deposit_date', '')::date,
      coalesce((p_refund->>'product_amount')::int, 0),
      coalesce((p_refund->>'deposit_amount')::int, 0),
      coalesce((p_refund->>'refund_request_amount')::int, 0),
      nullif(p_refund->>'depositor', ''),
      nullif(p_refund->>'balance_amount', '')::int,
      nullif(p_refund->>'registered_by', ''),
      p_refund->>'status',
      nullif(p_refund->>'bank_account', ''),
      nullif(p_refund->>'memo', '')
    )
    returning * into v_saved;
  else
    update public.refunds
       set refund_date = v_refund_date,
           no = v_next_no,
           customer_name = p_refund->>'customer_name',
           departure_date = nullif(p_refund->>'departure_date', '')::date,
           people_count = coalesce((p_refund->>'people_count')::int, 0),
           phone = nullif(p_refund->>'phone', ''),
           payment_method = p_refund->>'payment_method',
           deposit_date = nullif(p_refund->>'deposit_date', '')::date,
           product_amount = coalesce((p_refund->>'product_amount')::int, 0),
           deposit_amount = coalesce((p_refund->>'deposit_amount')::int, 0),
           refund_request_amount = coalesce((p_refund->>'refund_request_amount')::int, 0),
           depositor = nullif(p_refund->>'depositor', ''),
           balance_amount = nullif(p_refund->>'balance_amount', '')::int,
           registered_by = nullif(p_refund->>'registered_by', ''),
           status = p_refund->>'status',
           bank_account = nullif(p_refund->>'bank_account', ''),
           memo = nullif(p_refund->>'memo', '')
     where id = v_existing.id
     returning * into v_saved;
  end if;

  return v_saved;
end;
$$;

create or replace function public.save_reservation_schedule_atomic(p_schedule jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_schedule_id uuid := (p_schedule->>'id')::uuid;
  v_hotel jsonb := p_schedule->'hotelBooking';
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

  if p_schedule->>'tourType' <> '숙박' then
    delete from public.schedule_hotel_bookings where schedule_id = v_schedule_id;
    return;
  end if;

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

  if not v_has_hotel_data then
    delete from public.schedule_hotel_bookings where schedule_id = v_schedule_id;
    return;
  end if;

  insert into public.schedule_hotel_bookings (
    schedule_id, hotel_name, hotel_phone, provisional_booking_status,
    provisional_double_room_count, provisional_triple_room_count, provisional_quad_room_count, booking_status
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
    end
  )
  on conflict (schedule_id) do update set
    hotel_name = excluded.hotel_name,
    hotel_phone = excluded.hotel_phone,
    provisional_booking_status = excluded.provisional_booking_status,
    provisional_double_room_count = excluded.provisional_double_room_count,
    provisional_triple_room_count = excluded.provisional_triple_room_count,
    provisional_quad_room_count = excluded.provisional_quad_room_count,
    booking_status = excluded.booking_status
  returning id into v_hotel_booking_id;

  delete from public.schedule_hotel_room_assignments where hotel_booking_id = v_hotel_booking_id;

  insert into public.schedule_hotel_room_assignments (hotel_booking_id, room_type, room_count)
  select v_hotel_booking_id, room_type, room_count
  from (
    values
      ('DOUBLE'::public.room_type, coalesce((v_hotel#>>'{rooms,double}')::int, 0)),
      ('TRIPLE'::public.room_type, coalesce((v_hotel#>>'{rooms,triple}')::int, 0)),
      ('QUAD'::public.room_type, coalesce((v_hotel#>>'{rooms,quadruple}')::int, 0))
  ) as rooms(room_type, room_count)
  where room_count > 0;
end;
$$;

revoke execute on function public.save_refund_atomic(jsonb) from public, anon, authenticated;
revoke execute on function public.save_reservation_schedule_atomic(jsonb) from public, anon, authenticated;
grant execute on function public.save_refund_atomic(jsonb) to service_role;
grant execute on function public.save_reservation_schedule_atomic(jsonb) to service_role;
