-- Subscription requests (MVP manual screenshot verification flow)
create type payment_method as enum ('mtn_momo', 'orange_money', 'flutterwave', 'paystack', 'stripe');

create type subscription_status as enum (
  'pending_ai_review',
  'provisional',
  'confirmed',
  'active',
  'past_due',
  'rejected',
  'cancelled'
);

create table public.subscription_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan subscription_plan not null,
  amount_xaf integer not null check (amount_xaf >= 0),
  payment_method payment_method not null,
  screenshot_url text not null,
  transaction_id_extracted text,
  ai_screening_result jsonb,
  status subscription_status not null default 'pending_ai_review',
  admin_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index subscription_requests_user_id_idx on public.subscription_requests(user_id);
create index subscription_requests_status_idx on public.subscription_requests(status);

alter table public.subscription_requests enable row level security;

create policy "subscription_requests_select_own"
  on public.subscription_requests for select
  using (auth.uid() = user_id);

create policy "subscription_requests_insert_own"
  on public.subscription_requests for insert
  with check (auth.uid() = user_id);

create policy "subscription_requests_admin_all"
  on public.subscription_requests for all
  using (public.is_admin(auth.uid()));
