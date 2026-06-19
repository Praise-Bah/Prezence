-- Migration: add profile columns to public.users
-- Added by AuthModule (Phase 2): name, bio, location, timezone,
-- email_notifications, push_notifications.

alter table public.users
  add column if not exists name            text             default null,
  add column if not exists bio             text             default null,
  add column if not exists location        text             default null,
  add column if not exists timezone        text             default 'Africa/Douala',
  add column if not exists email_notifications boolean      default true  not null,
  add column if not exists push_notifications  boolean      default true  not null;
