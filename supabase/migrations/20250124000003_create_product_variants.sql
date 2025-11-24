-- Create product variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  sku VARCHAR(100) UNIQUE,
  variant_name VARCHAR(255) NOT NULL,

  -- Variant attributes (for vaping products)
  flavor VARCHAR(100),
  nicotine_strength VARCHAR(50),
  size VARCHAR(50),
  color VARCHAR(50),

  -- Pricing and inventory
  price_adjustment DECIMAL(10, 2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Images
  image_url TEXT,

  -- Metadata
  weight DECIMAL(10, 2),
  dimensions JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT check_positive_stock CHECK (stock_quantity >= 0)
);

-- Create variant option groups table
CREATE TABLE IF NOT EXISTS public.variant_option_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL, -- e.g., "Flavor", "Nicotine Strength", "Size"
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create variant options table
CREATE TABLE IF NOT EXISTS public.variant_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.variant_option_groups(id) ON DELETE CASCADE NOT NULL,
  value VARCHAR(100) NOT NULL, -- e.g., "Strawberry", "3mg", "60ml"
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create variant combinations table (links variants to their option values)
CREATE TABLE IF NOT EXISTS public.variant_option_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES public.variant_options(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(variant_id, option_id)
);

-- Create indexes
CREATE INDEX idx_variants_product ON public.product_variants(product_id);
CREATE INDEX idx_variants_active ON public.product_variants(is_active);
CREATE INDEX idx_variants_sku ON public.product_variants(sku);
CREATE INDEX idx_variant_groups_product ON public.variant_option_groups(product_id);
CREATE INDEX idx_variant_options_group ON public.variant_options(group_id);
CREATE INDEX idx_variant_values_variant ON public.variant_option_values(variant_id);

-- Add has_variants flag to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_option_values ENABLE ROW LEVEL SECURITY;

-- Public can view active variants
CREATE POLICY "Public can view active variants"
  ON public.product_variants FOR SELECT
  USING (is_active = true);

-- Admin can manage all variants
CREATE POLICY "Admin can manage variants"
  ON public.product_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Public can view variant groups
CREATE POLICY "Public can view variant groups"
  ON public.variant_option_groups FOR SELECT
  USING (true);

-- Admin can manage variant groups
CREATE POLICY "Admin can manage variant groups"
  ON public.variant_option_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Public can view variant options
CREATE POLICY "Public can view variant options"
  ON public.variant_options FOR SELECT
  USING (true);

-- Admin can manage variant options
CREATE POLICY "Admin can manage variant options"
  ON public.variant_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Public can view variant values
CREATE POLICY "Public can view variant values"
  ON public.variant_option_values FOR SELECT
  USING (true);

-- Admin can manage variant values
CREATE POLICY "Admin can manage variant values"
  ON public.variant_option_values FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Function to check and update has_variants flag
CREATE OR REPLACE FUNCTION public.update_product_has_variants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the product's has_variants flag
  UPDATE public.products
  SET has_variants = (
    SELECT COUNT(*) > 0
    FROM public.product_variants
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    AND is_active = true
  )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to update has_variants
CREATE TRIGGER update_has_variants_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_product_has_variants();

-- Add variant_id to order_items table
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id),
  ADD COLUMN IF NOT EXISTS variant_name VARCHAR(255);
