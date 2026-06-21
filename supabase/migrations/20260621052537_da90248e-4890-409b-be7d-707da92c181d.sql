DROP POLICY IF EXISTS "Anyone can read records" ON public.records;
DROP POLICY IF EXISTS "Anyone can insert records" ON public.records;
REVOKE ALL ON public.records FROM anon;
REVOKE ALL ON public.records FROM authenticated;
GRANT ALL ON public.records TO service_role;