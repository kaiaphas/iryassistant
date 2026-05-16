-- These tables are server-only for iryAssistant.
-- RLS is already enabled and no client policies are required.
revoke all privileges on table public.admin_members from anon, authenticated;
revoke all privileges on table public.import_batches from anon, authenticated;
revoke all privileges on table public.master_drivers from anon, authenticated;
revoke all privileges on table public.master_guides from anon, authenticated;
revoke all privileges on table public.master_hotels from anon, authenticated;
revoke all privileges on table public.master_restaurants from anon, authenticated;
revoke all privileges on table public.refunds from anon, authenticated;
revoke all privileges on table public.reservation_import_staging from anon, authenticated;
revoke all privileges on table public.reservation_schedule_sources from anon, authenticated;
revoke all privileges on table public.reservation_schedules from anon, authenticated;
revoke all privileges on table public.reservations from anon, authenticated;
revoke all privileges on table public.schedule_hotel_bookings from anon, authenticated;
revoke all privileges on table public.schedule_hotel_room_assignments from anon, authenticated;
revoke all privileges on table public.schedule_restaurant_bookings from anon, authenticated;
revoke all privileges on table public.source_schedule_hotel_bookings from anon, authenticated;
revoke all privileges on table public.source_schedule_hotel_room_assignments from anon, authenticated;
revoke all privileges on table public.source_schedule_restaurant_bookings from anon, authenticated;
