update public.reservation_schedules
set
  guide_name = nullif(guide_name, '-'),
  driver_name = nullif(driver_name, '-')
where guide_name = '-'
   or driver_name = '-';
