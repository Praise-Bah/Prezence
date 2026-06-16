-- Users (extends auth.users with Prezence profile data)
create type user_role as enum ('user', 'institutional_admin', 'support', 'system_admin');
create type subscription_plan as enum ('free', 'starter', 'professional', 'elite');
create type user_language as enum ('en', 'fr', 'camfranglais');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role user_role not null default 'user',
  plan subscription_plan not null default 'free',
  country_code text not null default 'CM',
  language user_language not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function set_updated_at();

-- Security-definer helper to check admin role without recursive RLS evaluation
create or replace function public.is_admin(uid uuid)
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = uid and role in ('support', 'system_admin')
  );
$$ language sql security definer set search_path = public;

alter table public.users enable row level security;

create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id);

create policy "users_admin_select_all"
  on public.users for select
  using (public.is_admin(auth.uid()));
