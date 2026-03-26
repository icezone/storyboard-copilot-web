-- 003_project_drafts: 项目草稿表（1:1 关系）
create table public.project_drafts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects on delete cascade not null unique,
  data jsonb default '{}',
  revision integer default 0,
  viewport jsonb default '{"x":0,"y":0,"zoom":1}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.project_drafts enable row level security;

create policy "通过project访问draft" on public.project_drafts
  for all using (
    exists (select 1 from public.projects where id = project_id and user_id = auth.uid())
  );
