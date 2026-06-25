-- 호차별 일정을 분리하기 위해 source_schedule_key를 상품ID|여행일자에서
-- 상품ID|여행일자|호차로 변경한다.
--
-- 실행 순서:
-- 1. 이 SQL 실행
-- 2. 호차 포함 source_schedule_key 코드 배포
-- 3. npm run sync 1회 실행
--
-- 기존 UUID(id)는 유지하므로 schedule_id를 쓰는 식당/숙소/정산서/통합정산서 연결은 유지된다.

create temporary table tmp_reservation_schedule_key_migration on commit drop as
select
  id as source_id,
  source_schedule_key as old_key,
  source_schedule_key || '|' || coalesce(nullif(btrim(vehicle_no), ''), '0') as new_key
from public.reservation_schedule_sources
where array_length(string_to_array(source_schedule_key, '|'), 1) = 2;

delete from tmp_reservation_schedule_key_migration m
where exists (
  select 1
  from public.reservation_schedule_sources s
  where s.source_schedule_key = m.new_key
    and s.id <> m.source_id
);

delete from tmp_reservation_schedule_key_migration m
where exists (
  select 1
  from public.reservation_schedules s
  where s.source_schedule_key = m.new_key
    and s.id <> m.source_id
);

update public.reservation_schedule_sources s
set
  source_schedule_key = m.new_key,
  updated_at = now()
from tmp_reservation_schedule_key_migration m
where s.id = m.source_id
  and s.source_schedule_key = m.old_key;

update public.reservation_schedules s
set
  source_schedule_key = m.new_key,
  updated_at = now()
from tmp_reservation_schedule_key_migration m
where (s.source_schedule_key = m.old_key or s.id = m.source_id)
  and (
    s.source_schedule_key is null
    or array_length(string_to_array(s.source_schedule_key, '|'), 1) = 2
  );

select
  count(*) as migrated_key_count
from tmp_reservation_schedule_key_migration;

-- 마이그레이션 검증용:
-- 1) 기존 2분할 key가 남아있는지 확인
select
  source_schedule_key,
  tour_date,
  product_name,
  vehicle_no
from public.reservation_schedule_sources
where array_length(string_to_array(source_schedule_key, '|'), 1) = 2
order by tour_date, product_name, vehicle_no
limit 20;

-- 2) 같은 상품/날짜에 복수 호차가 있는 일정이 key 기준으로 분리되는지 확인
select
  product_code,
  tour_date,
  product_name,
  count(*) as schedule_count,
  array_agg(vehicle_no order by vehicle_no) as vehicle_nos,
  array_agg(source_schedule_key order by vehicle_no) as source_schedule_keys
from public.reservation_schedule_sources
where is_active = true
group by product_code, tour_date, product_name
having count(*) > 1
order by tour_date desc, product_name
limit 20;
