-- Add has_variants column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wishlist"
ON public.wishlist
FOR ALL
USING (auth.uid() = user_id);

-- Create guest_wishlist table
CREATE TABLE IF NOT EXISTS public.guest_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(session_id, product_id)
);

ALTER TABLE public.guest_wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage guest wishlist"
ON public.guest_wishlist
FOR ALL
USING (true);

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_purchase_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  per_customer_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
ON public.coupons
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage coupons"
ON public.coupons
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create coupon_usage table
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(coupon_id, order_id)
);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coupon usage"
ON public.coupon_usage
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can create coupon usage"
ON public.coupon_usage
FOR INSERT
WITH CHECK (true);

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews"
ON public.product_reviews
FOR SELECT
USING (is_approved = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can create reviews"
ON public.product_reviews
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all reviews"
ON public.product_reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create migrate_guest_wishlist function
CREATE OR REPLACE FUNCTION public.migrate_guest_wishlist(_session_id TEXT, _user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  migrated_count INTEGER := 0;
BEGIN
  -- Insert guest wishlist items into user wishlist
  INSERT INTO public.wishlist (user_id, product_id, created_at)
  SELECT _user_id, product_id, created_at
  FROM public.guest_wishlist
  WHERE session_id = _session_id
  ON CONFLICT (user_id, product_id) DO NOTHING;
  
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  
  -- Delete guest wishlist items
  DELETE FROM public.guest_wishlist WHERE session_id = _session_id;
  
  RETURN migrated_count;
END;
$$;

-- Create validate_coupon function
CREATE OR REPLACE FUNCTION public.validate_coupon(
  _coupon_code TEXT,
  _customer_email TEXT,
  _cart_total NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coupon_record RECORD;
  usage_count INTEGER;
  customer_usage_count INTEGER;
  discount_amount NUMERIC;
  result JSON;
BEGIN
  -- Find the coupon
  SELECT * INTO coupon_record
  FROM public.coupons
  WHERE code = _coupon_code AND is_active = true;
  
  -- Check if coupon exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Invalid coupon code'
    );
  END IF;
  
  -- Check if coupon is expired
  IF coupon_record.valid_until IS NOT NULL AND coupon_record.valid_until < now() THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'This coupon has expired'
    );
  END IF;
  
  -- Check if coupon hasn't started yet
  IF coupon_record.valid_from > now() THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'This coupon is not yet active'
    );
  END IF;
  
  -- Check minimum purchase amount
  IF _cart_total < coupon_record.min_purchase_amount THEN
    RETURN json_build_object(
      'valid', false,
      'message', format('Minimum purchase amount of R%.2f required', coupon_record.min_purchase_amount)
    );
  END IF;
  
  -- Check total usage limit
  IF coupon_record.usage_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO usage_count
    FROM public.coupon_usage
    WHERE coupon_id = coupon_record.id;
    
    IF usage_count >= coupon_record.usage_limit THEN
      RETURN json_build_object(
        'valid', false,
        'message', 'This coupon has reached its usage limit'
      );
    END IF;
  END IF;
  
  -- Check per-customer usage limit
  SELECT COUNT(*) INTO customer_usage_count
  FROM public.coupon_usage
  WHERE coupon_id = coupon_record.id AND customer_email = _customer_email;
  
  IF customer_usage_count >= coupon_record.per_customer_limit THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'You have already used this coupon the maximum number of times'
    );
  END IF;
  
  -- Calculate discount
  IF coupon_record.discount_type = 'fixed' THEN
    discount_amount := coupon_record.discount_value;
  ELSE -- percentage
    discount_amount := (_cart_total * coupon_record.discount_value / 100);
  END IF;
  
  -- Apply max discount limit
  IF coupon_record.max_discount_amount IS NOT NULL THEN
    discount_amount := LEAST(discount_amount, coupon_record.max_discount_amount);
  END IF;
  
  -- Ensure discount doesn't exceed cart total
  discount_amount := LEAST(discount_amount, _cart_total);
  
  RETURN json_build_object(
    'valid', true,
    'message', 'Coupon applied successfully',
    'coupon', json_build_object(
      'id', coupon_record.id,
      'code', coupon_record.code,
      'description', coupon_record.description,
      'discount_type', coupon_record.discount_type,
      'discount_value', coupon_record.discount_value
    ),
    'discount_amount', discount_amount
  );
END;
$$;

-- Create get_order_statistics function
CREATE OR REPLACE FUNCTION public.get_order_statistics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_revenue', COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0),
    'total_orders', COUNT(*),
    'pending_orders', COUNT(*) FILTER (WHERE status = 'pending'),
    'processing_orders', COUNT(*) FILTER (WHERE status = 'processing'),
    'shipped_orders', COUNT(*) FILTER (WHERE status = 'shipped'),
    'delivered_orders', COUNT(*) FILTER (WHERE status = 'delivered'),
    'cancelled_orders', COUNT(*) FILTER (WHERE status = 'cancelled')
  ) INTO stats
  FROM public.orders;
  
  RETURN stats;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();