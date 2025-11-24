-- Create product reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create review helpful tracking table
CREATE TABLE IF NOT EXISTS public.review_helpful (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Create indexes
CREATE INDEX idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX idx_reviews_approved ON public.product_reviews(is_approved);
CREATE INDEX idx_reviews_rating ON public.product_reviews(rating);
CREATE INDEX idx_review_helpful_review ON public.review_helpful(review_id);

-- Add rating fields to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful ENABLE ROW LEVEL SECURITY;

-- Public can view approved reviews
CREATE POLICY "Public can view approved reviews"
  ON public.product_reviews FOR SELECT
  USING (is_approved = true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Users can update their own reviews (before approval)
CREATE POLICY "Users can update own reviews"
  ON public.product_reviews FOR UPDATE
  USING (auth.uid() = user_id AND is_approved = false)
  WITH CHECK (auth.uid() = user_id);

-- Admin can manage all reviews
CREATE POLICY "Admin can manage reviews"
  ON public.product_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Public can mark reviews as helpful
CREATE POLICY "Users can mark helpful"
  ON public.review_helpful FOR INSERT
  WITH CHECK (true);

-- Users can view helpful marks
CREATE POLICY "Public can view helpful marks"
  ON public.review_helpful FOR SELECT
  USING (true);

-- Function to update product rating
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only update if review is approved
  IF NEW.is_approved = true OR (TG_OP = 'UPDATE' AND OLD.is_approved = false AND NEW.is_approved = true) THEN
    UPDATE public.products
    SET
      average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.product_reviews
        WHERE product_id = NEW.product_id AND is_approved = true
      ),
      review_count = (
        SELECT COUNT(*)
        FROM public.product_reviews
        WHERE product_id = NEW.product_id AND is_approved = true
      )
    WHERE id = NEW.product_id;
  END IF;

  -- If review is being deleted or unapproved, recalculate
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.is_approved = true AND NEW.is_approved = false) THEN
    UPDATE public.products
    SET
      average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.product_reviews
        WHERE product_id = COALESCE(OLD.product_id, NEW.product_id) AND is_approved = true
      ),
      review_count = (
        SELECT COUNT(*)
        FROM public.product_reviews
        WHERE product_id = COALESCE(OLD.product_id, NEW.product_id) AND is_approved = true
      )
    WHERE id = COALESCE(OLD.product_id, NEW.product_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to auto-update product ratings
CREATE TRIGGER update_product_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_rating();

-- Function to increment helpful count
CREATE OR REPLACE FUNCTION public.increment_review_helpful()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.product_reviews
  SET helpful_count = helpful_count + 1
  WHERE id = NEW.review_id;

  RETURN NEW;
END;
$$;

-- Create trigger for helpful count
CREATE TRIGGER increment_helpful_trigger
AFTER INSERT ON public.review_helpful
FOR EACH ROW
EXECUTE FUNCTION public.increment_review_helpful();
