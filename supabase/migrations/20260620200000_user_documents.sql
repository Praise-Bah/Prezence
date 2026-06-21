-- user_documents: stores documents uploaded by users (CV, portfolio, certificates, etc.)
-- Text is extracted asynchronously by the document-extraction worker and used
-- as additional context for profile generation.

create table if not exists public.user_documents (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.users(id) on delete cascade,
  filename        text        not null,
  mime_type       text        not null,
  r2_key          text        not null,
  file_size       bigint      not null,
  status          text        not null default 'pending'
                              check (status in ('pending', 'extracting', 'done', 'failed')),
  extracted_text  text,
  error_message   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists user_documents_user_id_idx    on public.user_documents (user_id);
create index if not exists user_documents_status_idx     on public.user_documents (status);

alter table public.user_documents enable row level security;

-- NestJS writes via service_role
create policy "service_role can manage documents"
  on public.user_documents
  to service_role
  using (true)
  with check (true);

-- Users can read and soft-manage their own documents
create policy "users can select own documents"
  on public.user_documents for select
  using (auth.uid() = user_id);

-- Admins can read all
create policy "admins can read all documents"
  on public.user_documents for select
  using (private.is_admin((select auth.uid())));
