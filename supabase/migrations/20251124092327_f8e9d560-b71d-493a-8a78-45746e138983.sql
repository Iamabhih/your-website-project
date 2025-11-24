-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- RLS policies for product-images bucket
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Insert PayFast settings (sandbox mode by default)
INSERT INTO settings (key, value, updated_by)
VALUES 
  ('payfast_mode', '"sandbox"'::jsonb, NULL),
  ('payfast_merchant_id', '"10000100"'::jsonb, NULL),
  ('payfast_merchant_key', '"46f0cd694581a"'::jsonb, NULL),
  ('payfast_passphrase', '""'::jsonb, NULL),
  ('admin_email', '"admin@cbdshop.co.za"'::jsonb, NULL)
ON CONFLICT (key) DO NOTHING;

-- Insert banner settings
INSERT INTO settings (key, value, updated_by)
VALUES 
  ('banner_enabled', 'true'::jsonb, NULL),
  ('banner_text', '"Free delivery on orders over R500!"'::jsonb, NULL),
  ('banner_link', '"/shop"'::jsonb, NULL)
ON CONFLICT (key) DO NOTHING;