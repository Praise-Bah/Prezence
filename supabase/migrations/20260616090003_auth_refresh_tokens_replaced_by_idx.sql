-- Cover the self-referential FK so Postgres can resolve it without a seq-scan.
create index auth_refresh_tokens_replaced_by_idx
  on public.auth_refresh_tokens (replaced_by)
  where replaced_by is not null;
