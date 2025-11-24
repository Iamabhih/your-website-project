-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, product_id, variant_id)
);

-- Create wishlist for non-authenticated users (session-based)
CREATE TABLE IF NOT EXISTS public.guest_wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, product_id, variant_id)
);

-- Create indexes
CREATE INDEX idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX idx_wishlist_product ON public.wishlist(product_id);
CREATE INDEX idx_guest_wishlist_session ON public.guest_wishlist(session_id);
CREATE INDEX idx_guest_wishlist_product ON public.guest_wishlist(product_id);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_wishlist ENABLE ROW LEVEL SECURITY;

-- Users can only access their own wishlist
CREATE POLICY "Users can view own wishlist"
  ON public.wishlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own wishlist"
  ON public.wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlist"
  ON public.wishlist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own wishlist"
  ON public.wishlist FOR DELETE
  USING (auth.uid() = user_id);

-- Guest wishlist is accessible by session ID (handled in application)
CREATE POLICY "Public can manage guest wishlist"
  ON public.guest_wishlist FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add wishlist count to products (for popularity)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS wishlist_count INTEGER DEFAULT 0;

-- Function to update wishlist count
CREATE OR REPLACE FUNCTION public.update_wishlist_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the product's wishlist count
  UPDATE public.products
  SET wishlist_count = (
    SELECT COUNT(*)
    FROM public.wishlist
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
  )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to update wishlist count
CREATE TRIGGER update_wishlist_count_trigger
AFTER INSERT OR DELETE ON public.wishlist
FOR EACH ROW
EXECUTE FUNCTION public.update_wishlist_count();

-- Function to migrate guest wishlist to user wishlist on login
CREATE OR REPLACE FUNCTION public.migrate_guest_wishlist(
  p_session_id VARCHAR(255),
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_migrated_count INTEGER := 0;
BEGIN
  -- Insert guest wishlist items into user wishlist (ignore duplicates)
  INSERT INTO public.wishlist (user_id, product_id, variant_id, added_at)
  SELECT p_user_id, product_id, variant_id, added_at
  FROM public.guest_wishlist
  WHERE session_id = p_session_id
  ON CONFLICT (user_id, product_id, variant_id) DO NOTHING;

  GET DIAGNOSTICS v_migrated_count = ROW_COUNT;

  -- Delete guest wishlist items
  DELETE FROM public.guest_wishlist
  WHERE session_id = p_session_id;

  RETURN v_migrated_count;
END;
$$;
