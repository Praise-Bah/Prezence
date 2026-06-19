-- Social OAuth sign-ups should not default to CM; onboarding collects country later.
alter table public.users alter column country_code drop default;
alter table public.users alter column country_code drop not null;
