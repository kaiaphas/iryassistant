create table if not exists public.master_codes (
  id uuid primary key default gen_random_uuid(),
  code_group text not null,
  code_value text not null,
  code_label text not null,
  default_value text,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_codes_group_value_unique unique (code_group, code_value)
);

create index if not exists idx_master_codes_group_sort
  on public.master_codes (code_group, sort_order, code_label);

drop trigger if exists trg_master_codes_updated_at on public.master_codes;
create trigger trg_master_codes_updated_at
before update on public.master_codes
for each row execute function public.set_updated_at();

insert into public.master_codes as mc (code_group, code_value, code_label, default_value, description, sort_order, active)
values
  ('RESERVATION_STATUS', 'RESERVED', '예약완료', null, '예약이 정상 접수된 상태', 1, true),
  ('RESERVATION_STATUS', 'PENDING_PAYMENT', '입금대기', null, '입금 확인이 필요한 상태', 2, true),
  ('RESERVATION_STATUS', 'CANCELLED', '취소', null, '예약 취소 상태', 9, true),
  ('PAYMENT_TYPE', 'CARD', '카드결제', null, '카드 결제', 1, true),
  ('PAYMENT_TYPE', 'BANK', '무통장입금', null, '계좌 입금', 2, true),
  ('PROGRESS_STATUS', 'GUIDE_ASSIGNED', '가이드배정완료', null, '가이드가 배정된 상태', 3, true),
  ('PRODUCT_CODE', 'PRD001', '남도비경 1박2일', null, '보성, 여수 관광 1박2일 코스', 1, true),
  ('STATION_CODE', 'ICN_TERMINAL', '인천터미널', null, '인천터미널역 집결', 1, true),
  ('BUS_TYPE', 'PREMIUM', '우등버스', null, '28인승 우등', 1, true),
  ('ROLE_CODE', 'RESERVATION', '예약담당자', null, '예약 조회 및 등록 권한', 2, true),
  ('SETTLEMENT_ITEM', 'GUIDE_WITHHOLDING_RATE', '가이드 공제율', '3.3', '정산서 가이드 기본 공제율(%)', 1, true),
  ('SETTLEMENT_ITEM', 'DRIVER_WITHHOLDING_RATE', '기사 공제율', '3.3', '정산서 기사 기본 공제율(%)', 2, true),
  ('INTEGRATED_SETTLEMENT_ITEM', 'KIMBAP_UNIT_PRICE', '김밥', '4000', '통합정산서 김밥 기본 단가', 1, true),
  ('INTEGRATED_SETTLEMENT_ITEM', 'FRUIT_UNIT_PRICE', '과일', '2900', '통합정산서 과일 기본 단가', 2, true),
  ('INTEGRATED_SETTLEMENT_ITEM', 'RICE_CAKE_WATER_UNIT_PRICE', '떡생수', '1300', '통합정산서 떡생수 기본 단가', 3, true),
  ('INTEGRATED_SETTLEMENT_ITEM', 'SNACK_BOX_UNIT_PRICE', '간식상자', '2000', '통합정산서 간식상자 기본 단가', 4, true)
on conflict (code_group, code_value) do update set
  code_label = excluded.code_label,
  default_value = coalesce(mc.default_value, excluded.default_value),
  description = excluded.description,
  sort_order = excluded.sort_order,
  active = excluded.active,
  updated_at = now();
