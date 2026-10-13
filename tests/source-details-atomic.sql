-- Run after the migration. All successful replacements are rolled back.
begin;
do $$
declare
  target_id uuid;
  customers jsonb;
  restaurants jsonb;
  hotels jsonb;
  rooms jsonb;
  after_customers jsonb;
  after_restaurants jsonb;
  after_hotels jsonb;
  after_rooms jsonb;
begin
  assert not has_function_privilege('anon', 'public.replace_source_schedule_details(uuid[],jsonb,jsonb,jsonb,jsonb)', 'EXECUTE');
  assert not has_function_privilege('authenticated', 'public.replace_source_schedule_details(uuid[],jsonb,jsonb,jsonb,jsonb)', 'EXECUTE');
  assert has_function_privilege('service_role', 'public.replace_source_schedule_details(uuid[],jsonb,jsonb,jsonb,jsonb)', 'EXECUTE');
  select s.id into target_id from public.reservation_schedule_sources s
  where exists (select 1 from public.source_schedule_reservation_customers c where c.schedule_id=s.id)
  order by s.id limit 1 for update;
  assert target_id is not null, 'Test requires a schedule with customers';
  select coalesce(jsonb_agg(to_jsonb(c) order by c.id), '[]') into customers
    from public.source_schedule_reservation_customers c where c.schedule_id=target_id;
  select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]') into restaurants
    from public.source_schedule_restaurant_bookings r where r.schedule_id=target_id;
  select coalesce(jsonb_agg(to_jsonb(h) order by h.id), '[]') into hotels
    from public.source_schedule_hotel_bookings h where h.schedule_id=target_id;
  select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]') into rooms
    from public.source_schedule_hotel_room_assignments r
    join public.source_schedule_hotel_bookings h on h.id=r.hotel_booking_id where h.schedule_id=target_id;

  begin
    perform public.replace_source_schedule_details(array[target_id], customers || jsonb_build_array(customers->0), restaurants, hotels, rooms);
    raise exception 'Expected duplicate customer failure';
  exception when unique_violation then
    null;
  end;
  select coalesce(jsonb_agg(to_jsonb(c) order by c.id), '[]') into after_customers
    from public.source_schedule_reservation_customers c where c.schedule_id=target_id;
  select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]') into after_restaurants
    from public.source_schedule_restaurant_bookings r where r.schedule_id=target_id;
  select coalesce(jsonb_agg(to_jsonb(h) order by h.id), '[]') into after_hotels
    from public.source_schedule_hotel_bookings h where h.schedule_id=target_id;
  select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]') into after_rooms
    from public.source_schedule_hotel_room_assignments r
    join public.source_schedule_hotel_bookings h on h.id=r.hotel_booking_id where h.schedule_id=target_id;
  assert customers=after_customers and restaurants=after_restaurants and hotels=after_hotels and rooms=after_rooms,
    'Failed replacement must preserve all existing detail rows';

  perform public.replace_source_schedule_details(array[target_id], customers, restaurants, hotels, rooms);
  assert (select count(*) from public.source_schedule_reservation_customers where schedule_id=target_id)=jsonb_array_length(customers);
  assert (select count(*) from public.source_schedule_restaurant_bookings where schedule_id=target_id)=jsonb_array_length(restaurants);
  assert (select count(*) from public.source_schedule_hotel_bookings where schedule_id=target_id)=jsonb_array_length(hotels);
  assert (select count(*) from public.source_schedule_hotel_room_assignments r join public.source_schedule_hotel_bookings h on h.id=r.hotel_booking_id where h.schedule_id=target_id)=jsonb_array_length(rooms);
end;
$$;
rollback;
