-- Audit logs (append-only, anonymized — never store raw PII per CLAUDE.md)
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id_hash text not null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}',
  ip_hash text,
  created_at timestamptz not null default now()
);

create index audit_logs_user_id_hash_idx on public.audit_logs(user_id_hash);
create index audit_logs_action_idx on public.audit_logs(action);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

-- Append-only: no select/update/delete policies for regular users.
create policy "audit_logs_admin_select"
  on public.audit_logs for select
  using (public.is_admin(auth.uid()));

create policy "audit_logs_insert_service"
  on public.audit_logs for insert
  with check (true);
