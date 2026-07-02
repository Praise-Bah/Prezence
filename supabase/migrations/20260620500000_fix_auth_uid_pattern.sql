-- Fix auth.uid() initplan pattern on RLS SELECT policies (performance advisor)

DROP POLICY IF EXISTS "users can select own edit signals"
  ON public.user_edit_signals;

CREATE POLICY "users can select own edit signals"
  ON public.user_edit_signals FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "users can select own documents"
  ON public.user_documents;

CREATE POLICY "users can select own documents"
  ON public.user_documents FOR SELECT
  USING ((select auth.uid()) = user_id);
