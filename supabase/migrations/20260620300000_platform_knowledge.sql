-- platform_knowledge: curated knowledge documents used as RAG context during profile generation.
-- Each row contains platform-specific best practices, character limit guidance,
-- SEO tips, and audience insights. The embedding column enables cosine similarity
-- retrieval at generation time (top-3 docs are injected into the system prompt).

create table if not exists public.platform_knowledge (
  id          uuid        primary key default gen_random_uuid(),
  platform    text,                            -- NULL = applies to all platforms
  title       text        not null,
  content     text        not null,
  category    text        not null default 'general',
                          -- 'best_practices' | 'seo_tips' | 'audience_insights' | 'character_limits' | 'general'
  embedding   vector(1536),                    -- populated by seed script
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists platform_knowledge_platform_idx    on public.platform_knowledge (platform);
create index if not exists platform_knowledge_category_idx   on public.platform_knowledge (category);
create index if not exists platform_knowledge_active_idx     on public.platform_knowledge (is_active) where is_active = true;

-- HNSW index for vector similarity search (only created once embedding column has data)
-- This index is created after the seed script populates embeddings.
-- create index platform_knowledge_embedding_hnsw_idx
--   on public.platform_knowledge using hnsw (embedding vector_cosine_ops)
--   with (m = 16, ef_construction = 64);

alter table public.platform_knowledge enable row level security;

-- Only admins and service_role can manage knowledge docs
create policy "admins can manage platform knowledge"
  on public.platform_knowledge
  to service_role
  using (true)
  with check (true);

create policy "all authenticated users can read active knowledge"
  on public.platform_knowledge for select
  using (is_active = true);
