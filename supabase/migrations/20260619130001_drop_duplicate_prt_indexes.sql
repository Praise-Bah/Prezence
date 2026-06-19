-- Drop duplicate indexes on password_reset_tokens created by two separate
-- migration passes. Keep the original password_reset_tokens_*_idx names.
drop index if exists public.idx_prt_token;
drop index if exists public.idx_prt_user_id;
