-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Public can view banner settings" ON public.settings;

-- Create new policy that allows public access to banner, payfast, store and theme settings
CREATE POLICY "Public can view public settings"
  ON public.settings FOR SELECT
  USING (
    key LIKE 'banner_%'
    OR key LIKE 'payfast_%'
    OR key = 'store_name'
    OR key = 'store_logo'
    OR key = 'theme_config'
    OR key = 'store_settings'
    OR public.has_role(auth.uid(), 'admin')
  );