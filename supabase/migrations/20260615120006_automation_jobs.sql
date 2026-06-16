-- Async automation jobs (BullMQ-driven L1-L3B platform publishing)
create type job_status as enum ('queued', 'running', 'completed', 'failed', 'retrying');

create table public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  platform supported_platform not null,
  layer_used integration_layer not null,
  status job_status not null default 'queued',
  proof_url text,
  retry_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index automation_jobs_user_id_idx on public.automation_jobs(user_id);
create index automation_jobs_status_idx on public.automation_jobs(status);

alter table public.automation_jobs enable row level security;

create policy "automation_jobs_select_own"
  on public.automation_jobs for select
  using (auth.uid() = user_id);

create policy "automation_jobs_admin_all"
  on public.automation_jobs for all
  using (public.is_admin(auth.uid()));
