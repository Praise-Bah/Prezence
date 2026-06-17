-- Decouple public.users from Supabase auth.users — the NestJS AuthModule
-- is the sole identity provider (own bcrypt passwords, own JWT issuance).
-- RLS policies referencing auth.uid() become vestigial for API-mediated
-- access (NestJS connects via a direct Postgres role and bypasses RLS) but
-- are left in place as defense-in-depth.

alter table public.users drop constraint if exists users_id_fkey;
alter table public.users alter column id set default gen_random_uuid();
alter table public.users add column password_hash text not null default '$2b$12$elRPZMGljaonecYrXuyOuemKyPzSjoGz3jzn8wog1ixQOoSuBRl0G';
alter table public.users alter column password_hash drop default;
