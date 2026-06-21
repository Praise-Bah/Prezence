-- Remove starter plan tier; migrate existing rows to free.
-- Remote schema uses column `plan` + enum type subscription_plan (not CHECK constraints).

UPDATE public.users
SET plan = 'free'
WHERE plan = 'starter';

UPDATE public.subscription_requests
SET plan = 'free'
WHERE plan = 'starter';

CREATE TYPE public.subscription_plan_new AS ENUM ('free', 'professional', 'elite');

ALTER TABLE public.users
  ALTER COLUMN plan DROP DEFAULT;

ALTER TABLE public.users
  ALTER COLUMN plan TYPE public.subscription_plan_new
  USING plan::text::public.subscription_plan_new;

ALTER TABLE public.subscription_requests
  ALTER COLUMN plan TYPE public.subscription_plan_new
  USING plan::text::public.subscription_plan_new;

DROP TYPE public.subscription_plan;

ALTER TYPE public.subscription_plan_new RENAME TO subscription_plan;

ALTER TABLE public.users
  ALTER COLUMN plan SET DEFAULT 'free'::public.subscription_plan;
