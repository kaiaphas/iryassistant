create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  refund_date date not null,
  no integer not null,
  customer_name text not null,
  departure_date date,
  people_count integer not null default 1 check (people_count >= 0),
  phone text,
  payment_method text not null check (payment_method in ('계좌이체', '홈페이지결제', '사무실단말기', '위약금')),
  deposit_date date,
  product_amount integer not null default 0 check (product_amount >= 0),
  deposit_amount integer not null default 0 check (deposit_amount >= 0),
  refund_request_amount integer not null default 0 check (refund_request_amount >= 0),
  depositor text,
  balance_amount integer check (balance_amount is null or balance_amount >= 0),
  registered_by text,
  status text not null default '환불신청' check (status in ('환불신청', '환불완료')),
  bank_account text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint refunds_refund_date_no_unique unique (refund_date, no)
);

create index if not exists idx_refunds_refund_date
  on public.refunds (refund_date);

create index if not exists idx_refunds_status
  on public.refunds (status);

create index if not exists idx_refunds_customer_name
  on public.refunds (customer_name);

drop trigger if exists trg_refunds_updated_at on public.refunds;
create trigger trg_refunds_updated_at
before update on public.refunds
for each row execute function public.set_updated_at();

comment on table public.refunds is '환불명단. 환불일자 기준으로 조회/등록되는 고객 환불 처리 목록';
