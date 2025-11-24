-- Create storage buckets for brand assets and custom icons
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('brand-assets', 'brand-assets', true),
  ('custom-icons', 'custom-icons', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for brand-assets bucket
CREATE POLICY "Public read access for brand assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'brand-assets');

CREATE POLICY "Admin upload access for brand assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin update access for brand assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-assets' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin delete access for brand assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-assets' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS policies for custom-icons bucket
CREATE POLICY "Public read access for custom icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'custom-icons');

CREATE POLICY "Admin upload access for custom icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'custom-icons' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin update access for custom icons"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'custom-icons' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin delete access for custom icons"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'custom-icons' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);