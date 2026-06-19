-- Migration: create password_reset_tokens table
-- Used by forgot-password / reset-password flow in AuthModule.

create table if not exists public.password_reset_tokens (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users(id) on delete cascade,
  token_hash text        not null unique,
  expires_at timestamptz not null,
  used_at    timestamptz default null,
  created_at timestamptz default now() not null
);

create index if not exists idx_prt_user_id  on public.password_reset_tokens (user_id);
create index if not exists idx_prt_token    on public.password_reset_tokens (token_hash);

alter table public.password_reset_tokens enable row level security;

-- NestJS API accesses via a direct Postgres role that bypasses RLS;
-- restrict any Supabase client access to admins only.
create policy "admin_all_password_reset_tokens"
  on public.password_reset_tokens
  for all
  to authenticated
  using (private.is_admin((select auth.uid())))
  with check (private.is_admin((select auth.uid())));
