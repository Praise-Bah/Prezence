-- Consolidate dual SELECT policies on ai_usage_logs and platform_health_checks
-- into single policies to eliminate multiple-permissive-policies advisor warnings.

drop policy if exists "aul_admin_all" on public.ai_usage_logs;
drop policy if exists "aul_select_own" on public.ai_usage_logs;

create policy "aul_select"
  on public.ai_usage_logs
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_admin((select auth.uid()))
  );

drop policy if exists "phc_admin_all" on public.platform_health_checks;
drop policy if exists "phc_select_own" on public.platform_health_checks;

create policy "phc_select"
  on public.platform_health_checks
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_admin((select auth.uid()))
  );
