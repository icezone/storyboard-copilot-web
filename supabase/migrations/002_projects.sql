-- 002_projects: 项目主表
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null default 'Untitled',
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "用户只能访问自己的项目" on public.projects
  for all using (auth.uid() = user_id);

create policy "公开项目任何人可读" on public.projects
  for select using (is_public = true);
