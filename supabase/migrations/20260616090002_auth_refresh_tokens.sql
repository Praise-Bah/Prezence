-- Refresh token sessions for the AuthModule: supports 7-day rotation with
-- reuse detection (reuse of a revoked token revokes the whole family).
create table public.auth_refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  -- sha256 hex of the signed JWT; the raw token is never stored
  token_hash text not null unique,
  family_id uuid not null,
  revoked_at timestamptz,
  replaced_by uuid references public.auth_refresh_tokens(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  user_agent text,
  ip_hash text
);

create index auth_refresh_tokens_user_id_idx on public.auth_refresh_tokens(user_id);
create index auth_refresh_tokens_family_id_idx on public.auth_refresh_tokens(family_id);
create index auth_refresh_tokens_token_hash_idx on public.auth_refresh_tokens(token_hash);

alter table public.auth_refresh_tokens enable row level security;

create policy "auth_refresh_tokens_admin_select"
  on public.auth_refresh_tokens for select
  using (private.is_admin((select auth.uid())));
