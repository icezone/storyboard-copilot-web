-- 010_triggers: updated_at 自动更新
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger update_projects_updated_at before update on public.projects
  for each row execute function public.update_updated_at();

create trigger update_project_drafts_updated_at before update on public.project_drafts
  for each row execute function public.update_updated_at();

create trigger update_ai_jobs_updated_at before update on public.ai_jobs
  for each row execute function public.update_updated_at();

create trigger update_user_api_keys_updated_at before update on public.user_api_keys
  for each row execute function public.update_updated_at();
