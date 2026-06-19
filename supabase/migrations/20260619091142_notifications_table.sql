create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text not null,
  action_url  text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, is_read) where is_read = false;

alter table public.notifications enable row level security;

create policy "users read own notifications"
  on public.notifications for select
  using (user_id = (select auth.uid()));

create policy "users update own notifications"
  on public.notifications for update
  using (user_id = (select auth.uid()));

create policy "service role insert notifications"
  on public.notifications for insert
  with check (true);

create policy "admins read all notifications"
  on public.notifications for select
  using (private.is_admin((select auth.uid())));
