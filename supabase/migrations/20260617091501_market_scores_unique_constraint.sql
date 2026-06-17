-- Make the market_scores upsert target explicit as a table constraint.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.market_scores'::regclass
      and conname = 'market_scores_user_platform_unique'
      and contype = 'u'
  ) then
    if exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and tablename = 'market_scores'
        and indexname = 'market_scores_user_platform_unique_idx'
    ) then
      execute 'alter table public.market_scores add constraint market_scores_user_platform_unique unique using index market_scores_user_platform_unique_idx';
    else
      execute 'alter table public.market_scores add constraint market_scores_user_platform_unique unique (user_id, platform)';
    end if;
  end if;
end $$;
