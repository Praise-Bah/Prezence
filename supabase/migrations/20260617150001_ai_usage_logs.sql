-- AI model call usage tracking (cost visibility per user and feature)
create table public.ai_usage_logs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.users(id) on delete set null,
  model              text not null,
  feature            text not null,
  prompt_tokens      int  not null default 0,
  completion_tokens  int  not null default 0,
  total_tokens       int  not null default 0,
  estimated_cost_usd numeric(10,6),
  created_at         timestamptz not null default now()
);

create index aul_user_id_idx   on public.ai_usage_logs(user_id);
create index aul_feature_idx   on public.ai_usage_logs(feature);
create index aul_created_at_idx on public.ai_usage_logs(created_at);

alter table public.ai_usage_logs enable row level security;

create policy "aul_select_own"
  on public.ai_usage_logs for select
  using ((select auth.uid())::uuid = user_id or private.is_admin((select auth.uid())));

create policy "aul_admin_all"
  on public.ai_usage_logs for all
  using (private.is_admin((select auth.uid())))
  with check (private.is_admin((select auth.uid())));
