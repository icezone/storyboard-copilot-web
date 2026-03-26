-- 008_user_api_keys: BYOK 加密存储
create table public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  provider text not null,
  encrypted_key text not null,
  iv text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

alter table public.user_api_keys enable row level security;

create policy "用户只能管理自己的API Key" on public.user_api_keys
  for all using (auth.uid() = user_id);
