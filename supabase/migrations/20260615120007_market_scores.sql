-- Market-fit scores computed per user/platform
create table public.market_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  platform supported_platform not null,
  score integer not null check (score >= 0 and score <= 100),
  completeness numeric(5, 2) not null,
  keyword_density numeric(5, 2) not null,
  market_demand numeric(5, 2) not null,
  recency numeric(5, 2) not null,
  recommendations text[] not null default '{}',
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index market_scores_user_platform_idx on public.market_scores(user_id, platform, computed_at desc);

alter table public.market_scores enable row level security;

create policy "market_scores_select_own"
  on public.market_scores for select
  using (auth.uid() = user_id);

create policy "market_scores_admin_all"
  on public.market_scores for all
  using (public.is_admin(auth.uid()));
