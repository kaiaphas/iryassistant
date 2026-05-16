-- RLS status by public table
select
  n.nspname as schemaname,
  c.relname as tablename,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n
  on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'reservation_import_staging',
    'reservations',
    'import_batches',
    'reservation_schedules',
    'schedule_restaurant_bookings',
    'schedule_hotel_bookings',
    'schedule_hotel_room_assignments',
    'reservation_schedule_sources',
    'source_schedule_restaurant_bookings',
    'source_schedule_hotel_bookings',
    'source_schedule_hotel_room_assignments',
    'master_guides',
    'master_drivers',
    'master_restaurants',
    'master_hotels',
    'admin_members',
    'refunds'
  )
order by c.relname;

-- Existing policies by public table
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Public table grants by role
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'reservation_import_staging',
    'reservations',
    'import_batches',
    'reservation_schedules',
    'schedule_restaurant_bookings',
    'schedule_hotel_bookings',
    'schedule_hotel_room_assignments',
    'reservation_schedule_sources',
    'source_schedule_restaurant_bookings',
    'source_schedule_hotel_bookings',
    'source_schedule_hotel_room_assignments',
    'master_guides',
    'master_drivers',
    'master_restaurants',
    'master_hotels',
    'admin_members',
    'refunds'
  )
order by table_name, grantee, privilege_type;
