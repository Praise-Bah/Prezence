-- Platform health check results (token validity, reachability, latency)
create type health_status as enum ('healthy', 'degraded', 'unreachable', 'token_expired');

create table public.platform_health_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  platform supported_platform not null,
  status health_status not null default 'healthy',
  response_ms integer,
  error_message text,
  checked_at timestamptz not null default now()
);

create index phc_user_platform_idx on public.platform_health_checks(user_id, platform);
create index phc_checked_at_idx on public.platform_health_checks(checked_at);

alter table public.platform_health_checks enable row level security;

create policy "phc_select_own"
  on public.platform_health_checks for select
  using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));

create policy "phc_admin_all"
  on public.platform_health_checks for all
  using (private.is_admin((select auth.uid())))
  with check (private.is_admin((select auth.uid())));
