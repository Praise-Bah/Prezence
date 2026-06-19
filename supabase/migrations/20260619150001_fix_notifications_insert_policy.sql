-- Fix: scope notifications INSERT policy to service_role only.
-- The original policy had no `to` clause, allowing any authenticated
-- Supabase client to insert notifications for arbitrary user IDs.

drop policy if exists "service role insert notifications" on public.notifications;

create policy "service role insert notifications"
  on public.notifications for insert
  to service_role
  with check (true);
