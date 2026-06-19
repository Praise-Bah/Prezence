-- Add bull_job_id to scheduled_posts for O(1) BullMQ job cancellation lookup.
-- Previously cancellation required a full queue scan (getDelayed).
alter table public.scheduled_posts add column if not exists bull_job_id text;
