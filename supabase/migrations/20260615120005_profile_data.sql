-- Generated profile content per user/platform/interview version
create table public.profile_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  platform supported_platform not null,
  content jsonb not null,
  interview_version integer not null default 1,
  quality_score numeric(5, 2),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, platform, interview_version)
);

create index profile_data_user_id_idx on public.profile_data(user_id);
create index profile_data_user_platform_idx on public.profile_data(user_id, platform);

alter table public.profile_data enable row level security;

create policy "profile_data_select_own"
  on public.profile_data for select
  using (auth.uid() = user_id);

create policy "profile_data_admin_all"
  on public.profile_data for all
  using (public.is_admin(auth.uid()));
