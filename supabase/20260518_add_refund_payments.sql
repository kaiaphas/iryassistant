create table if not exists public.refund_payments (
  id uuid primary key default gen_random_uuid(),
  refund_id uuid not null references public.refunds(id) on delete cascade,
  deposit_date date not null,
  deposit_amount integer not null default 0 check (deposit_amount >= 0),
  depositor text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_refund_payments_refund_id
  on public.refund_payments (refund_id);

create index if not exists idx_refund_payments_deposit_date
  on public.refund_payments (deposit_date);

drop trigger if exists trg_refund_payments_updated_at on public.refund_payments;
create trigger trg_refund_payments_updated_at
before update on public.refund_payments
for each row execute function public.set_updated_at();

insert into public.refund_payments (
  refund_id,
  deposit_date,
  deposit_amount,
  depositor
)
select
  id,
  deposit_date,
  deposit_amount,
  depositor
from public.refunds
where deposit_date is not null
  and deposit_amount > 0
  and not exists (
    select 1
    from public.refund_payments payment
    where payment.refund_id = refunds.id
  );

comment on table public.refund_payments is '환불건별 입금내역 상세. 한 환불건에 여러 차례의 입금 기록을 저장한다.';
