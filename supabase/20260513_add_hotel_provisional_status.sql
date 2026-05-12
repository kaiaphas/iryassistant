alter table public.schedule_hotel_bookings
  add column if not exists provisional_booking_status public.reservation_work_status not null default 'BEFORE';

alter table public.schedule_hotel_bookings
  add column if not exists provisional_double_room_count int not null default 0 check (provisional_double_room_count >= 0);

alter table public.schedule_hotel_bookings
  add column if not exists provisional_triple_room_count int not null default 0 check (provisional_triple_room_count >= 0);

alter table public.schedule_hotel_bookings
  add column if not exists provisional_quad_room_count int not null default 0 check (provisional_quad_room_count >= 0);

create index if not exists idx_schedule_hotel_bookings_provisional_status
  on public.schedule_hotel_bookings (provisional_booking_status);

comment on column public.schedule_hotel_bookings.provisional_booking_status is '숙소 가예약 상태. 실제 예약 상태(booking_status)와 독립적으로 관리';
comment on column public.schedule_hotel_bookings.provisional_double_room_count is '숙소 가예약 2인실 수량';
comment on column public.schedule_hotel_bookings.provisional_triple_room_count is '숙소 가예약 3인실 수량';
comment on column public.schedule_hotel_bookings.provisional_quad_room_count is '숙소 가예약 4인실 수량';
