-- 007_plans_payments: 套餐 + 支付
create table public.plans (
  id text primary key,
  name text not null,
  credits_per_month integer not null,
  price_usd numeric(10,2),
  price_cny numeric(10,2),
  created_at timestamptz default now()
);

insert into public.plans values ('free', 'Free', 100, 0, 0);
insert into public.plans values ('pro', 'Pro', 2000, 9.9, 68);
insert into public.plans values ('enterprise', 'Enterprise', 10000, 39.9, 288);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  plan_id text references public.plans,
  amount numeric(10,2) not null,
  currency text not null,
  provider text not null,
  provider_payment_id text unique,
  status text default 'pending',
  idempotency_key text unique,
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

create policy "用户只能查看自己的支付" on public.payments
  for select using (auth.uid() = user_id);
