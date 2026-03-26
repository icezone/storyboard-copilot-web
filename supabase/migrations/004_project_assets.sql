-- 004_project_assets: 项目资产表
create table public.project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects on delete cascade not null,
  user_id uuid references auth.users not null,
  filename text not null,
  storage_path text not null,
  url text not null,
  content_type text not null,
  size bigint not null,
  created_at timestamptz default now()
);

alter table public.project_assets enable row level security;

create policy "用户只能访问自己的资产" on public.project_assets
  for all using (auth.uid() = user_id);
