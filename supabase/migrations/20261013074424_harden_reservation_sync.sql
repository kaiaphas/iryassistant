create or replace function public.replace_source_schedule_details(
  p_schedule_ids uuid[],
  p_customers jsonb,
  p_restaurants jsonb,
  p_hotels jsonb,
  p_rooms jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if coalesce(cardinality(p_schedule_ids), 0) not between 1 and 100
     or jsonb_typeof(p_customers) is distinct from 'array'
     or jsonb_typeof(p_restaurants) is distinct from 'array'
     or jsonb_typeof(p_hotels) is distinct from 'array'
     or jsonb_typeof(p_rooms) is distinct from 'array' then
    raise exception 'Invalid source schedule detail batch' using errcode = '22023';
  end if;

  -- Serialize overlapping batches and hold locks only during replacement.
  perform s.id from public.reservation_schedule_sources s
  where s.id = any(p_schedule_ids) order by s.id for update;
  if (select count(*) from public.reservation_schedule_sources where id = any(p_schedule_ids))
       <> cardinality(p_schedule_ids) then
    raise exception 'Unknown or duplicate source schedule IDs' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_customers || p_restaurants || p_hotels) item
    where item->>'schedule_id' is null
       or not ((item->>'schedule_id')::uuid = any(p_schedule_ids))
  ) or exists (
    select 1 from jsonb_array_elements(p_rooms) room
    where not exists (
      select 1 from jsonb_array_elements(p_hotels) hotel
      where hotel->>'id' = room->>'hotel_booking_id'
    )
  ) or exists (
    select 1 from jsonb_array_elements(p_customers) customer
    join public.reservation_schedule_sources s on s.id = (customer->>'schedule_id')::uuid
    where customer->>'source_schedule_key' is distinct from s.source_schedule_key
  ) then
    raise exception 'Source detail outside the target schedules' using errcode = '22023';
  end if;

  delete from public.source_schedule_reservation_customers where schedule_id = any(p_schedule_ids);
  insert into public.source_schedule_reservation_customers (
    id, schedule_id, source_schedule_key, customer_name, phone, customer_message, etc,
    reservation_status, payment_date, station, adult_count, child_count, people_count,
    reservation_date, sort_order
  )
  select c.id, c.schedule_id, c.source_schedule_key, c.customer_name, c.phone,
    c.customer_message, c.etc, c.reservation_status, c.payment_date, c.station,
    c.adult_count, c.child_count, c.people_count, c.reservation_date, c.sort_order
  from jsonb_populate_recordset(null::public.source_schedule_reservation_customers, p_customers) c;

  delete from public.source_schedule_restaurant_bookings where schedule_id = any(p_schedule_ids);
  insert into public.source_schedule_restaurant_bookings (
    id, schedule_id, meal_type, restaurant_name, restaurant_phone, restaurant_memo,
    booking_status, sort_order
  )
  select r.id, r.schedule_id, r.meal_type, r.restaurant_name, r.restaurant_phone,
    r.restaurant_memo, r.booking_status, r.sort_order
  from jsonb_populate_recordset(null::public.source_schedule_restaurant_bookings, p_restaurants) r;

  -- Source room assignments are removed by the hotel's ON DELETE CASCADE.
  delete from public.source_schedule_hotel_bookings where schedule_id = any(p_schedule_ids);
  insert into public.source_schedule_hotel_bookings (
    id, schedule_id, hotel_name, hotel_phone, hotel_memo, booking_status
  )
  select h.id, h.schedule_id, h.hotel_name, h.hotel_phone, h.hotel_memo, h.booking_status
  from jsonb_populate_recordset(null::public.source_schedule_hotel_bookings, p_hotels) h;
  insert into public.source_schedule_hotel_room_assignments (hotel_booking_id, room_type, room_count)
  select r.hotel_booking_id, r.room_type, r.room_count
  from jsonb_populate_recordset(null::public.source_schedule_hotel_room_assignments, p_rooms) r;
end;
$$;

revoke all on function public.replace_source_schedule_details(uuid[], jsonb, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.replace_source_schedule_details(uuid[], jsonb, jsonb, jsonb, jsonb)
  to service_role;
