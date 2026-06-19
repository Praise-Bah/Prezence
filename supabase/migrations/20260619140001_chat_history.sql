-- Migration: chat_sessions and chat_messages for AI conversation persistence.
-- One session per user+platform; messages are appended per exchange.

create table if not exists public.chat_sessions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users(id) on delete cascade,
  platform   text        not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_chat_sessions_user_platform
  on public.chat_sessions (user_id, platform);

alter table public.chat_sessions enable row level security;

create policy "chat_sessions_own"
  on public.chat_sessions for all to authenticated
  using (user_id = (select auth.uid()) or private.is_admin((select auth.uid())))
  with check (user_id = (select auth.uid()) or private.is_admin((select auth.uid())));

-- ─────────────────────────────────────────────────────────────

create table if not exists public.chat_messages (
  id          uuid        primary key default gen_random_uuid(),
  session_id  uuid        not null references public.chat_sessions(id) on delete cascade,
  role        text        not null check (role in ('user', 'assistant')),
  content     text        not null,
  tokens_used integer     not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_chat_messages_session
  on public.chat_messages (session_id, created_at);

alter table public.chat_messages enable row level security;

create policy "chat_messages_own"
  on public.chat_messages for all to authenticated
  using (
    session_id in (
      select id from public.chat_sessions
      where user_id = (select auth.uid())
    )
    or private.is_admin((select auth.uid()))
  )
  with check (
    session_id in (
      select id from public.chat_sessions
      where user_id = (select auth.uid())
    )
    or private.is_admin((select auth.uid()))
  );
