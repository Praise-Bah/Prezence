-- Add optional category for onboarding upload slots (CV, certification, etc.)

alter table public.user_documents
  add column if not exists category text
  check (
    category is null
    or category in (
      'cv',
      'certification',
      'portfolio',
      'reference_letters',
      'awards',
      'other'
    )
  );

create index if not exists user_documents_category_idx
  on public.user_documents (user_id, category);
