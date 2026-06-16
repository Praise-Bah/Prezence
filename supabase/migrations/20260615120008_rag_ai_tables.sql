-- RAG embeddings store + prompt registry for IntelligenceModule/AIModule
create table public.ai_embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  content text not null,
  embedding vector(1536) not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index ai_embeddings_user_id_idx on public.ai_embeddings(user_id);
create index ai_embeddings_embedding_idx
  on public.ai_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

alter table public.ai_embeddings enable row level security;

create policy "ai_embeddings_select_own"
  on public.ai_embeddings for select
  using (auth.uid() = user_id);

create policy "ai_embeddings_admin_all"
  on public.ai_embeddings for all
  using (public.is_admin(auth.uid()));

-- Prompt registry (versioned prompt templates for OpenRouter model routing)
create table public.prompt_registry (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version integer not null default 1,
  template text not null,
  model text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, version)
);

create trigger prompt_registry_set_updated_at
  before update on public.prompt_registry
  for each row execute function set_updated_at();

alter table public.prompt_registry enable row level security;

create policy "prompt_registry_admin_all"
  on public.prompt_registry for all
  using (public.is_admin(auth.uid()));
