-- user_edit_signals: captures every field-level edit a user makes to AI-generated content.
-- The voice-learning worker reads these nightly to update the user's voice profile
-- so future generation matches the user's personal style.

create table if not exists public.user_edit_signals (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.users(id) on delete cascade,
  platform      text        not null,
  field_name    text        not null,
  original_text text        not null,
  edited_text   text        not null,
  created_at    timestamptz not null default now()
);

create index if not exists user_edit_signals_user_id_idx    on public.user_edit_signals (user_id);
create index if not exists user_edit_signals_created_at_idx on public.user_edit_signals (created_at);

alter table public.user_edit_signals enable row level security;

-- NestJS writes via service_role; users read their own; admins read all.
create policy "service_role can insert edit signals"
  on public.user_edit_signals for insert
  to service_role
  with check (true);

create policy "users can select own edit signals"
  on public.user_edit_signals for select
  using (auth.uid() = user_id);

create policy "admins can read all edit signals"
  on public.user_edit_signals for select
  using (private.is_admin((select auth.uid())));
