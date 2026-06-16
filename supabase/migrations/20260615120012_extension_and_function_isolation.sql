-- Address remaining advisor warnings:
--  * extension_in_public: move pgvector out of public
--  * anon/authenticated_security_definer_function_executable: is_admin() is callable
--    via PostgREST RPC (/rest/v1/rpc/is_admin) because it lives in public.
--    Move it to a `private` schema (not exposed by PostgREST) while keeping it
--    usable inside RLS policies, which evaluate with the caller's privileges.

-- ── Move pgvector out of the public schema ─────────────────────────────────
create schema if not exists extensions;
alter extension vector set schema extensions;

-- ── Move is_admin() to a non-exposed schema ────────────────────────────────
create schema if not exists private;

create function private.is_admin(uid uuid)
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = uid and role in ('support', 'system_admin')
  );
$$ language sql security definer set search_path = '';

-- Repoint every policy from public.is_admin(...) to private.is_admin(...)
alter policy "users_select" on public.users
  using ((select auth.uid()) = id or private.is_admin((select auth.uid())));

alter policy "subscription_requests_select" on public.subscription_requests
  using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));
alter policy "subscription_requests_admin_update" on public.subscription_requests
  using (private.is_admin((select auth.uid())));
alter policy "subscription_requests_admin_delete" on public.subscription_requests
  using (private.is_admin((select auth.uid())));

alter policy "platform_connections_select" on public.platform_connections
  using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));
alter policy "platform_connections_update" on public.platform_connections
  using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())))
  with check ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));
alter policy "platform_connections_delete" on public.platform_connections
  using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));

alter policy "profile_data_select" on public.profile_data
  using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));
alter policy "profile_data_admin_insert" on public.profile_data
  with check (private.is_admin((select auth.uid())));
alter policy "profile_data_admin_update" on public.profile_data
  using (private.is_admin((select auth.uid())));
alter policy "profile_data_admin_delete" on public.profile_data
  using (private.is_admin((select auth.uid())));

alter policy "automation_jobs_select" on public.automation_jobs
  using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));
alter policy "automation_jobs_admin_insert" on public.automation_jobs
  with check (private.is_admin((select auth.uid())));
alter policy "automation_jobs_admin_update" on public.automation_jobs
  using (private.is_admin((select auth.uid())));
alter policy "automation_jobs_admin_delete" on public.automation_jobs
  using (private.is_admin((select auth.uid())));

alter policy "market_scores_select" on public.market_scores
  using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));
alter policy "market_scores_admin_insert" on public.market_scores
  with check (private.is_admin((select auth.uid())));
alter policy "market_scores_admin_update" on public.market_scores
  using (private.is_admin((select auth.uid())));
alter policy "market_scores_admin_delete" on public.market_scores
  using (private.is_admin((select auth.uid())));

alter policy "ai_embeddings_select" on public.ai_embeddings
  using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));
alter policy "ai_embeddings_admin_insert" on public.ai_embeddings
  with check (private.is_admin((select auth.uid())));
alter policy "ai_embeddings_admin_update" on public.ai_embeddings
  using (private.is_admin((select auth.uid())));
alter policy "ai_embeddings_admin_delete" on public.ai_embeddings
  using (private.is_admin((select auth.uid())));

alter policy "prompt_registry_admin_all" on public.prompt_registry
  using (private.is_admin((select auth.uid())))
  with check (private.is_admin((select auth.uid())));

alter policy "audit_logs_admin_select" on public.audit_logs
  using (private.is_admin((select auth.uid())));

alter policy "payment_events_admin_all" on public.payment_events
  using (private.is_admin((select auth.uid())))
  with check (private.is_admin((select auth.uid())));

-- Drop the now-unused public copy
drop function public.is_admin(uuid);
