create table if not exists public.admin_members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  email text unique not null,
  role text not null default '담당자' check (role in ('관리자', '담당자')),
  department text,
  phone text,
  status text not null default 'pending' check (status in ('pending', 'active', 'inactive')),
  approved_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_members_status on public.admin_members (status);
create index if not exists idx_admin_members_email on public.admin_members (email);

drop trigger if exists trg_admin_members_updated_at on public.admin_members;
create trigger trg_admin_members_updated_at
before update on public.admin_members
for each row execute function public.set_updated_at();
