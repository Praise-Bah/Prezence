-- IntelligenceModule schema changes
-- 1. Fix IVFFlat → HNSW on ai_embeddings (no training required, better recall)
-- 2. Add usage-tracking columns to ai_embeddings
-- 3. Add interview_responses table

-- HNSW index (deferred fix from Greptile comment on PR #4)
drop index if exists public.ai_embeddings_embedding_idx;
create index ai_embeddings_embedding_hnsw_idx
  on public.ai_embeddings using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Track which model generated each embedding and token cost
alter table public.ai_embeddings
  add column if not exists model_used  text,
  add column if not exists token_count integer;

-- Persisted interview answers — one row per (user, platform, interview_version)
create table public.interview_responses (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  platform          supported_platform not null,
  interview_version integer not null default 1,
  answers           jsonb not null,
  created_at        timestamptz not null default now(),
  unique (user_id, platform, interview_version)
);

create index interview_responses_user_id_idx on public.interview_responses(user_id);

alter table public.interview_responses enable row level security;

create policy "interview_responses_select"
  on public.interview_responses for select
  using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));

create policy "interview_responses_insert"
  on public.interview_responses for insert
  with check ((select auth.uid()) = user_id);

create policy "interview_responses_update"
  on public.interview_responses for update
  using ((select auth.uid()) = user_id);

create policy "interview_responses_admin_delete"
  on public.interview_responses for delete
  using (private.is_admin((select auth.uid())));

-- Seed: active prompt templates for generation (Claude Sonnet) and QA (Gemini Flash)
insert into public.prompt_registry (name, version, template, model, is_active) values
(
  'generate_profile',
  1,
  'You are Prezence AI, an expert personal branding coach for African professionals and youth.

Your task: Generate a complete, professional {{platform}} profile for the user below.

IMPORTANT CONSTRAINTS:
{{char_limits}}

USER''S INTERVIEW ANSWERS:
{{answers}}

SIMILAR SUCCESSFUL PROFILES (for reference style):
{{rag_context}}

INSTRUCTIONS:
1. Write in {{language}} (en=English, fr=French, camfranglais=natural mix of English/French)
2. Respect character limits strictly — count every character
3. Highlight African context and experience as a strength
4. Use keywords that rank well on {{platform}}
5. Be authentic — never invent achievements not mentioned in the answers

OUTPUT FORMAT (valid JSON, no markdown fences):
{
  "sections": { "<field_name>": "<generated_value>" },
  "keywords_used": ["keyword1", "keyword2"],
  "character_counts": { "<field_name>": <count> }
}',
  'anthropic/claude-sonnet-4-6',
  true
),
(
  'qa_profile',
  1,
  'You are a quality assurance reviewer for professional profiles on {{platform}}.

GENERATED CONTENT TO REVIEW:
{{content}}

PLATFORM CHARACTER LIMITS:
{{char_limits}}

Check each section:
1. All character limits are respected
2. Content is professional, coherent, and grammatically correct
3. No empty or placeholder sections
4. Keywords are naturally integrated, not stuffed

OUTPUT FORMAT (valid JSON, no markdown fences):
{
  "quality_score": <integer 0-100>,
  "passes_constraints": <true|false>,
  "issues": ["<issue description>"],
  "suggestions": ["<improvement suggestion>"]
}',
  'google/gemini-flash-1.5-8b',
  true
)
on conflict (name, version) do nothing;
