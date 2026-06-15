-- Platform connections (OAuth tokens, always AES-256-GCM envelope encrypted at rest)
create type supported_platform as enum (
  'linkedin', 'github', 'instagram', 'facebook',
  'fiverr', 'freelancer', 'tiktok', 'twitter'
);

create type integration_layer as enum ('L1', 'L2', 'L3A', 'L3B');

create type connection_status as enum ('active', 'expired', 'revoked', 'error');

create table public.platform_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  platform supported_platform not null,
  layer_used integration_layer not null,
  -- Envelope-encrypted token material (AES-256-GCM). Never store plaintext tokens.
  access_token_ciphertext text not null,
  access_token_iv text not null,
  access_token_tag text not null,
  refresh_token_ciphertext text,
  refresh_token_iv text,
  refresh_token_tag text,
  scopes text[] not null default '{}',
  status connection_status not null default 'active',
  connected_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

create trigger platform_connections_set_updated_at
  before update on public.platform_connections
  for each row execute function set_updated_at();

create index platform_connections_user_id_idx on public.platform_connections(user_id);

alter table public.platform_connections enable row level security;

create policy "platform_connections_select_own"
  on public.platform_connections for select
  using (auth.uid() = user_id);

create policy "platform_connections_modify_own"
  on public.platform_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "platform_connections_admin_all"
  on public.platform_connections for all
  using (public.is_admin(auth.uid()));
