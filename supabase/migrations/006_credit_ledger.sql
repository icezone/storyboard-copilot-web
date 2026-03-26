-- 006_credit_ledger: 积分账本
create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  amount integer not null,
  type text not null,
  job_id uuid references public.ai_jobs,
  idempotency_key text unique,
  created_at timestamptz default now()
);

alter table public.credit_ledger enable row level security;

create policy "用户只能查看自己的账本" on public.credit_ledger
  for select using (auth.uid() = user_id);

-- 积分余额视图
create view public.user_credits as
  select user_id, coalesce(sum(amount), 0)::integer as balance
  from public.credit_ledger
  group by user_id;
