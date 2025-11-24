-- Create order status history table for tracking
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order tracking info table
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  tracking_number VARCHAR(255),
  courier VARCHAR(100),
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  tracking_url TEXT,
  last_location TEXT,
  last_update_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add tracking number to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255),
  ADD COLUMN IF NOT EXISTS estimated_delivery DATE;

-- Create indexes
CREATE INDEX idx_order_status_history_order ON public.order_status_history(order_id);
CREATE INDEX idx_order_tracking_order ON public.order_tracking(order_id);
CREATE INDEX idx_order_tracking_number ON public.order_tracking(tracking_number);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- Customers can view their own order history
CREATE POLICY "Customers can view own order history"
  ON public.order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
      AND (orders.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

-- Admin can manage all order history
CREATE POLICY "Admin can manage order history"
  ON public.order_status_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Customers can view their own tracking
CREATE POLICY "Customers can view own tracking"
  ON public.order_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_tracking.order_id
      AND (orders.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

-- Public can view tracking by tracking number
CREATE POLICY "Public can view by tracking number"
  ON public.order_tracking FOR SELECT
  USING (true);

-- Admin can manage all tracking
CREATE POLICY "Admin can manage tracking"
  ON public.order_tracking FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Function to log order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (
      order_id,
      old_status,
      new_status,
      changed_by,
      changed_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for order status changes
CREATE TRIGGER order_status_change_trigger
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();
