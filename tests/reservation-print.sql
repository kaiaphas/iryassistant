-- Run after the print-time migration. All fixture changes are rolled back.
begin;
do $$
declare
  fixture_id uuid := gen_random_uuid();
  other_id uuid := gen_random_uuid();
  printed timestamptz;
  latest timestamptz;
  source_before jsonb;
begin
  insert into public.reservation_schedule_sources (id, source_schedule_key, tour_date, product_name, is_active)
  values (fixture_id, 'print-test-' || fixture_id, current_date, 'Print fixture', true),
         (other_id, 'print-test-' || other_id, current_date, 'Other fixture', true);

  select to_jsonb(s) into source_before from public.reservation_schedule_sources s where id = fixture_id;
  printed := public.record_reservation_customers_print(fixture_id);
  if printed is null then raise exception 'Missing print timestamp'; end if;
  if source_before <> (select to_jsonb(s) from public.reservation_schedule_sources s where id = fixture_id) then
    raise exception 'Printing changed source data';
  end if;
  if exists (select 1 from public.reservation_schedule_prints p where p.schedule_id = other_id) then
    raise exception 'Printing changed another schedule';
  end if;

  latest := public.record_reservation_customers_print(fixture_id);
  if latest < printed then raise exception 'Print timestamp moved backwards'; end if;
  if (select count(*) from public.reservation_schedule_prints p where p.schedule_id = fixture_id) <> 1 then
    raise exception 'Print records grow on every print';
  end if;

  -- The importer updates source rows, not the separate print metadata.
  update public.reservation_schedule_sources set reservation_count = 123 where id = fixture_id;
  if (select printed_at from public.reservation_schedule_prints p where p.schedule_id = fixture_id) <> latest then
    raise exception 'Source update reset the print timestamp';
  end if;

  update public.reservation_schedule_sources set is_active = false where id = fixture_id;
  if public.record_reservation_customers_print(fixture_id) is not null then
    raise exception 'Inactive schedule was printed';
  end if;
  if public.record_reservation_customers_print(gen_random_uuid()) is not null then
    raise exception 'Unknown schedule was printed';
  end if;
  if has_function_privilege('anon', 'public.record_reservation_customers_print(uuid)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.record_reservation_customers_print(uuid)', 'EXECUTE') then
    raise exception 'Print RPC is publicly executable';
  end if;
  if not has_function_privilege('service_role', 'public.record_reservation_customers_print(uuid)', 'EXECUTE') then
    raise exception 'Print RPC is unavailable to the server';
  end if;
end;
$$;
rollback;
