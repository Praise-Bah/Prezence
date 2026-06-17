-- Repair any legacy users that received an empty password hash during custom auth migration.
-- The dummy bcrypt hash is structurally valid but should never match a real user password.
update public.users
set password_hash = '$2b$12$elRPZMGljaonecYrXuyOuemKyPzSjoGz3jzn8wog1ixQOoSuBRl0G'
where password_hash = '';
