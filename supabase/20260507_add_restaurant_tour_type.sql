alter table public.master_restaurants
add column if not exists tour_type text not null default '숙박';

alter table public.master_restaurants
drop constraint if exists master_restaurants_tour_type_check;

alter table public.master_restaurants
add constraint master_restaurants_tour_type_check
check (tour_type in ('당일', '숙박'));
