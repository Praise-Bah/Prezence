-- scheduled_posts: stores BullMQ-delayed publish jobs per user/platform.
-- NestJS writes via service_role (bypasses RLS); users read their own rows only.

create table public.scheduled_posts (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references public.users(id) on delete cascade,
  platform          text        not null,
  content_sections  jsonb       not null default '{}',
  scheduled_at      timestamptz not null,
  status            text        not null default 'scheduled',
  automation_job_id uuid,
  error_message     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index on public.scheduled_posts (user_id);
create index on public.scheduled_posts (user_id, status);
create index on public.scheduled_posts (scheduled_at) where (status = 'scheduled');

alter table public.scheduled_posts enable row level security;

create policy "Users read own scheduled posts"
  on public.scheduled_posts for select
  using (user_id = (select auth.uid()));

create policy "Service role manages scheduled posts"
  on public.scheduled_posts for all
  to service_role
  using (true)
  with check (true);
