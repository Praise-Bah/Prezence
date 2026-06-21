CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  original_key TEXT NOT NULL,
  base_url TEXT NOT NULL,
  variants JSONB NOT NULL DEFAULT '{}',
  width INT,
  height INT,
  mime_type TEXT NOT NULL,
  size_bytes INT NOT NULL,
  purpose TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS images_user_id_idx ON public.images(user_id);
CREATE INDEX IF NOT EXISTS images_purpose_idx ON public.images(purpose);

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own images"
  ON public.images FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "service role insert images"
  ON public.images FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service role update images"
  ON public.images FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service role delete images"
  ON public.images FOR DELETE
  TO service_role
  USING (true);
