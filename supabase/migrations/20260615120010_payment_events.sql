-- Payment provider webhook events (idempotent via unique provider_event_id)
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider payment_method not null,
  provider_event_id text not null,
  event_type text not null,
  subscription_request_id uuid references public.subscription_requests(id) on delete set null,
  payload jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index payment_events_subscription_request_id_idx on public.payment_events(subscription_request_id);
create index payment_events_processed_idx on public.payment_events(processed);

alter table public.payment_events enable row level security;

create policy "payment_events_admin_all"
  on public.payment_events for all
  using (public.is_admin(auth.uid()));
