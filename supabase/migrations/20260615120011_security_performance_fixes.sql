-- Address advisor warnings from initial Phase 0 migration:
--  * mutable search_path on helper functions
--  * audit_logs insert policy too permissive
--  * auth_rls_initplan: wrap auth.uid() as (select auth.uid())
--  * multiple_permissive_policies: consolidate own/admin policies per command

-- ── Helper functions: fix search_path ──────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
set search_path = '';

create or replace function public.is_admin(uid uuid)
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = uid and role in ('support', 'system_admin')
  );
$$ language sql security definer set search_path = '';

-- ── users ────────────────────────────────────────────────────────────────
drop policy "users_select_own" on public.users;
drop policy "users_admin_select_all" on public.users;
drop policy "users_update_own" on public.users;

create policy "users_select"
  on public.users for select
  using ((select auth.uid()) = id or public.is_admin((select auth.uid())));

create policy "users_update_own"
  on public.users for update
  using ((select auth.uid()) = id);

-- ── subscription_requests ───────────────────────────────────────────────
drop policy "subscription_requests_select_own" on public.subscription_requests;
drop policy "subscription_requests_insert_own" on public.subscription_requests;
drop policy "subscription_requests_admin_all" on public.subscription_requests;

create policy "subscription_requests_select"
  on public.subscription_requests for select
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

create policy "subscription_requests_insert"
  on public.subscription_requests for insert
  with check ((select auth.uid()) = user_id);

create policy "subscription_requests_admin_update"
  on public.subscription_requests for update
  using (public.is_admin((select auth.uid())));

create policy "subscription_requests_admin_delete"
  on public.subscription_requests for delete
  using (public.is_admin((select auth.uid())));

-- ── platform_connections ─────────────────────────────────────────────────
drop policy "platform_connections_select_own" on public.platform_connections;
drop policy "platform_connections_modify_own" on public.platform_connections;
drop policy "platform_connections_admin_all" on public.platform_connections;

create policy "platform_connections_select"
  on public.platform_connections for select
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

create policy "platform_connections_insert"
  on public.platform_connections for insert
  with check ((select auth.uid()) = user_id);

create policy "platform_connections_update"
  on public.platform_connections for update
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())))
  with check ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

create policy "platform_connections_delete"
  on public.platform_connections for delete
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

-- ── profile_data ─────────────────────────────────────────────────────────
drop policy "profile_data_select_own" on public.profile_data;
drop policy "profile_data_admin_all" on public.profile_data;

create policy "profile_data_select"
  on public.profile_data for select
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

create policy "profile_data_admin_insert"
  on public.profile_data for insert
  with check (public.is_admin((select auth.uid())));

create policy "profile_data_admin_update"
  on public.profile_data for update
  using (public.is_admin((select auth.uid())));

create policy "profile_data_admin_delete"
  on public.profile_data for delete
  using (public.is_admin((select auth.uid())));

-- ── automation_jobs ──────────────────────────────────────────────────────
drop policy "automation_jobs_select_own" on public.automation_jobs;
drop policy "automation_jobs_admin_all" on public.automation_jobs;

create policy "automation_jobs_select"
  on public.automation_jobs for select
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

create policy "automation_jobs_admin_insert"
  on public.automation_jobs for insert
  with check (public.is_admin((select auth.uid())));

create policy "automation_jobs_admin_update"
  on public.automation_jobs for update
  using (public.is_admin((select auth.uid())));

create policy "automation_jobs_admin_delete"
  on public.automation_jobs for delete
  using (public.is_admin((select auth.uid())));

-- ── market_scores ────────────────────────────────────────────────────────
drop policy "market_scores_select_own" on public.market_scores;
drop policy "market_scores_admin_all" on public.market_scores;

create policy "market_scores_select"
  on public.market_scores for select
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

create policy "market_scores_admin_insert"
  on public.market_scores for insert
  with check (public.is_admin((select auth.uid())));

create policy "market_scores_admin_update"
  on public.market_scores for update
  using (public.is_admin((select auth.uid())));

create policy "market_scores_admin_delete"
  on public.market_scores for delete
  using (public.is_admin((select auth.uid())));

-- ── ai_embeddings ────────────────────────────────────────────────────────
drop policy "ai_embeddings_select_own" on public.ai_embeddings;
drop policy "ai_embeddings_admin_all" on public.ai_embeddings;

create policy "ai_embeddings_select"
  on public.ai_embeddings for select
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

create policy "ai_embeddings_admin_insert"
  on public.ai_embeddings for insert
  with check (public.is_admin((select auth.uid())));

create policy "ai_embeddings_admin_update"
  on public.ai_embeddings for update
  using (public.is_admin((select auth.uid())));

create policy "ai_embeddings_admin_delete"
  on public.ai_embeddings for delete
  using (public.is_admin((select auth.uid())));

-- ── prompt_registry ──────────────────────────────────────────────────────
drop policy "prompt_registry_admin_all" on public.prompt_registry;

create policy "prompt_registry_admin_all"
  on public.prompt_registry for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- ── audit_logs ───────────────────────────────────────────────────────────
drop policy "audit_logs_admin_select" on public.audit_logs;
drop policy "audit_logs_insert_service" on public.audit_logs;

create policy "audit_logs_admin_select"
  on public.audit_logs for select
  using (public.is_admin((select auth.uid())));

-- Restrict inserts to authenticated requests (service_role bypasses RLS entirely).
create policy "audit_logs_insert_authenticated"
  on public.audit_logs for insert
  with check ((select auth.uid()) is not null);

-- ── payment_events ───────────────────────────────────────────────────────
drop policy "payment_events_admin_all" on public.payment_events;

create policy "payment_events_admin_all"
  on public.payment_events for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));
