-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('admin', 'customer');

-- Create enum for order status
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- ============================================
-- CORE TABLES
-- ============================================

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  image_url TEXT,
  pack_info TEXT,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_method TEXT NOT NULL,
  delivery_notes TEXT,
  delivery_price DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status order_status DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  telegram_chat_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery options table
CREATE TABLE IF NOT EXISTS public.delivery_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimated_days INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table (key-value store)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  severity TEXT DEFAULT 'info',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telegram customers table
CREATE TABLE IF NOT EXISTS public.telegram_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id TEXT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  preferences JSONB DEFAULT '{}',
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product subscriptions table (for stock alerts)
CREATE TABLE IF NOT EXISTS public.product_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  telegram_chat_id TEXT,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abandoned carts table
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  telegram_chat_id TEXT,
  reminded_at TIMESTAMPTZ,
  recovered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Broadcast messages table
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat sessions table (support chat)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_thread_id TEXT,
  visitor_name TEXT,
  visitor_email TEXT,
  status TEXT DEFAULT 'active',
  current_page TEXT,
  user_agent TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  message_text TEXT NOT NULL,
  telegram_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product images table (additional images)
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user has role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for new user role assignment
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_options_updated_at
  BEFORE UPDATE ON public.delivery_options
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Products: Public read, admin write
CREATE POLICY "Public can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles: Users view own, admins view all
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only system can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (false);

-- Orders: Users view own, admins view all, public create
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Order items: Public read/create
CREATE POLICY "Anyone can view order items"
  ON public.order_items FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- Delivery options: Public read, admin write
CREATE POLICY "Public can view delivery options"
  ON public.delivery_options FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage delivery options"
  ON public.delivery_options FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Settings: Public read banner settings, admins full access
CREATE POLICY "Public can view banner settings"
  ON public.settings FOR SELECT
  USING (key LIKE 'banner_%' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage settings"
  ON public.settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Audit logs: Admins read, system insert
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Telegram customers: Public create/update
CREATE POLICY "Public can manage telegram customers"
  ON public.telegram_customers FOR ALL
  USING (true);

-- Product subscriptions: Public subscribe, admin manage
CREATE POLICY "Public can subscribe to products"
  ON public.product_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view subscriptions"
  ON public.product_subscriptions FOR SELECT
  USING (true);

CREATE POLICY "Admins can update subscriptions"
  ON public.product_subscriptions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Abandoned carts: Admin view/update, public create
CREATE POLICY "Admins can view abandoned carts"
  ON public.abandoned_carts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can create abandoned carts"
  ON public.abandoned_carts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update abandoned carts"
  ON public.abandoned_carts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Broadcast messages: Admin only
CREATE POLICY "Admins can manage broadcasts"
  ON public.broadcast_messages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Chat sessions: Public create/read, admin update
CREATE POLICY "Public can create chat sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (true);

CREATE POLICY "Admins can update chat sessions"
  ON public.chat_sessions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Chat messages: Public create/read
CREATE POLICY "Public can manage chat messages"
  ON public.chat_messages FOR ALL
  USING (true);

-- Product images: Public read, admin write
CREATE POLICY "Public can view product images"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product images"
  ON public.product_images FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ENABLE REALTIME
-- ============================================

-- Enable realtime for settings (for banner updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;