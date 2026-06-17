-- BillingModule: extend subscription_requests for the two-step proof-upload flow.

-- 1. Allow screenshot_url to be null initially (set after proof upload step).
alter table public.subscription_requests
  alter column screenshot_url drop not null;

-- 2. Add columns needed by BillingModule.
alter table public.subscription_requests
  add column if not exists payment_reference  varchar(20),
  add column if not exists screened_by_ai     boolean not null default false,
  add column if not exists ai_confidence      integer,
  add column if not exists ai_confidence_level text,
  add column if not exists reviewed_by        uuid,
  add column if not exists reviewed_at        timestamptz,
  add column if not exists rejection_reason   text,
  add column if not exists admin_notes        text,
  add column if not exists provider_event_id  text unique,
  add column if not exists updated_at         timestamptz not null default now();

-- Backfill payment_reference for any existing rows, then enforce not-null.
update public.subscription_requests set payment_reference = 'PRZ-LEGACY' where payment_reference is null;
alter table public.subscription_requests alter column payment_reference set not null;

-- 3. Extend payment_events: add user context and financials; relax constraints
--    that the MVP flow can't always satisfy.
alter table public.payment_events
  add column if not exists user_id     uuid references public.users(id) on delete cascade,
  add column if not exists amount_xaf  integer not null default 0,
  add column if not exists currency    varchar(8) not null default 'XAF';

-- Make provider_event_id and payload nullable — internal audit events don't
-- have a provider-side event ID or external payload.
alter table public.payment_events
  alter column provider_event_id drop not null,
  alter column payload            drop not null;

-- Index for user-scoped payment event lookups.
create index if not exists payment_events_user_id_idx on public.payment_events (user_id);
