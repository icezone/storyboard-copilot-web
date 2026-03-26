-- 005_ai_jobs: AI 任务表（ai-dev 依赖此表）
create type public.job_status as enum ('pending', 'running', 'completed', 'failed');

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  project_id uuid references public.projects on delete cascade,
  provider_id text not null,
  model_id text not null,
  external_job_id text,
  status public.job_status default 'pending',
  credits_held integer default 0,
  credits_consumed integer,
  result jsonb,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ai_jobs enable row level security;

create policy "用户只能访问自己的任务" on public.ai_jobs
  for all using (auth.uid() = user_id);

-- 开启 Realtime
alter publication supabase_realtime add table public.ai_jobs;
